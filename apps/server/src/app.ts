import { createContext } from "@dealort/api/context";
import { arcjetProtectionMiddleware } from "@dealort/api/middleware/arcjet";
import {
  authTimeoutMiddleware,
  healthCheckTimeoutMiddleware,
  uploadTimeoutMiddleware,
} from "@dealort/api/middleware/hono-timeout";
import { appRouter } from "@dealort/api/routers/index";
import { uploadRouteHandler } from "@dealort/api/routers/uploadthing";
import { auth } from "@dealort/auth";
import { env } from "@dealort/utils/env";
import {
  captureException,
  initErrorTracking,
} from "@dealort/utils/error-tracker";
import { serverLogger } from "@dealort/utils/logger";
import { OpenAPIHandler } from "@orpc/openapi/fetch";
import { OpenAPIReferencePlugin } from "@orpc/openapi/plugins";
import { RPCHandler } from "@orpc/server/fetch";
import { ZodToJsonSchemaConverter } from "@orpc/zod/zod4";
import { type Context, Hono } from "hono";
import { cors } from "hono/cors";
import { logger as honoLogger } from "hono/logger";

// Initialize error tracking on startup
initErrorTracking();

export const app = new Hono();

app.use(
  honoLogger((str) => {
    serverLogger.info({ message: str.trim() });
  })
);

app.use(
  "*",
  cors({
    origin: env.CORS_ORIGIN || "",
    allowMethods: ["GET", "POST", "OPTIONS"],
    allowHeaders: [
      "Content-Type",
      "Authorization",
      "x-uploadthing-package",
      "x-uploadthing-version",
      "b3",
      "referer",
      "traceparent",
    ],
    credentials: true,
  })
);

// Auth route handler - Skip Arcjet (Better-Auth handles its own security)
// Apply timeout middleware (2-3 minutes)
app.on(["POST", "GET"], "/api/auth/*", authTimeoutMiddleware, (c) =>
  auth.handler(c.req.raw)
);

// Health check with timeout (2 minutes)
app.get("/", healthCheckTimeoutMiddleware, (c) => c.text("OK"));

/**
 * Adapter to handle UploadThing requests in Hono context
 */
async function uploadThingAdapter(c: Context): Promise<Response> {
  const response = await uploadRouteHandler(c.req.raw);

  // Return the response directly, converting it to Hono's response format
  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers: response.headers,
  });
}

// UploadThing route - Skip Arcjet (UploadThing handles its own security)
// Apply timeout middleware (5-7 minutes)
app.use("/api/uploadthing/*", uploadTimeoutMiddleware, uploadThingAdapter);

/**
 * Error handler interceptor for API/RPC requests
 * Logs errors and sends them to error tracking service
 */
function createErrorInterceptor(handlerName: string) {
  return async (options: { next: () => Promise<any> }) => {
    try {
      return await options.next();
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));

      
      serverLogger.error(
        {
          error: {
            message: err.message,
            stack: err.stack,
            name: err.name,
          },
        },
        `${handlerName} handler error`
      );

      captureException(err, {
        handler: handlerName,
      });

      // Re-throw to let ORPC handle the error response
      throw err;
    }
  };
}

/**
 * OpenAPI handler for API documentation and reference
 */
export const apiHandler = new OpenAPIHandler(appRouter, {
  plugins: [
    new OpenAPIReferencePlugin({
      schemaConverters: [new ZodToJsonSchemaConverter()],
    }),
  ],
  interceptors: [createErrorInterceptor("OpenAPI")],
});

/**
 * RPC handler for client-server communication
 */
export const rpcHandler = new RPCHandler(appRouter, {
  interceptors: [createErrorInterceptor("RPC")],
});

// Apply Arcjet protection to RPC and API routes
// app.use("/rpc/*", arcjetProtectionMiddleware);
app.use("/api-reference/*", arcjetProtectionMiddleware);

/**
 * Main RPC/API router middleware
 * Handles all RPC and OpenAPI requests with proper error handling
 */
app.use("/*", async (c, next) => {
  try {
    // Create request context with session and database
    const context = await createContext({ context: c });

    // Try to handle as RPC request
    const rpcResult = await rpcHandler.handle(c.req.raw, {
      prefix: "/rpc",
      context,
    });

    if (rpcResult.matched) {
      return c.newResponse(rpcResult.response.body, rpcResult.response);
    }

    // Try to handle as OpenAPI request
    const apiResult = await apiHandler.handle(c.req.raw, {
      prefix: "/api-reference",
      context,
    });

    if (apiResult.matched) {
      return c.newResponse(apiResult.response.body, apiResult.response);
    }

    // Not an RPC or API request, continue to next middleware
    await next();
  } catch (error) {
    const err = error instanceof Error ? error : new Error(String(error));

    serverLogger.error(
      {
        error: {
          message: err.message,
          stack: err.stack,
          name: err.name,
        },
        path: c.req.path,
        method: c.req.method,
      },
      "Middleware error"
    );

    captureException(err, {
      handler: "middleware",
      path: c.req.path,
    });

    throw error;
  }
});