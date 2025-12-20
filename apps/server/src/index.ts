// dotenv.config({ path: '../../.env' });

import { createContext } from "@dealort/api/context";
import { arcjetProtectionMiddleware } from "@dealort/api/middleware/arcjet";
import {
  authTimeoutMiddleware,
  healthCheckTimeoutMiddleware,
  uploadTimeoutMiddleware,
} from "@dealort/api/middleware/hono-timeout";
import { createTimeoutInterceptor } from "@dealort/api/middleware/orpc-timeout";
import { appRouter } from "@dealort/api/routers/index";
import { uploadRouteHandler } from "@dealort/api/routers/uploadthing";
import { auth } from "@dealort/auth";
import { env } from "@dealort/utils/env";
import {
  captureException,
  initErrorTracking,
} from "@dealort/utils/error-tracker";
import { serverLogger } from "@dealort/utils/logger";

// Initialize error tracking
initErrorTracking();

import { OpenAPIHandler } from "@orpc/openapi/fetch";
import { OpenAPIReferencePlugin } from "@orpc/openapi/plugins";
import { onError } from "@orpc/server";
import { RPCHandler } from "@orpc/server/fetch";
import { ZodToJsonSchemaConverter } from "@orpc/zod/zod4";
import { type Context, Hono } from "hono";
import { cors } from "hono/cors";
import { logger as honoLogger } from "hono/logger";

const app = new Hono();

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

async function uploadThingAdapter(c: Context) {
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

export const apiHandler = new OpenAPIHandler(appRouter, {
  plugins: [
    new OpenAPIReferencePlugin({
      schemaConverters: [new ZodToJsonSchemaConverter()],
    }),
  ],
  interceptors: [
    createTimeoutInterceptor(),
    onError((error) => {
      serverLogger.error(
        {
          error: {
            message: error.message,
            stack: error.stack,
            name: error.name,
          },
        },
        "OpenAPI handler error"
      );
      captureException(
        error instanceof Error ? error : new Error(String(error)),
        {
          handler: "OpenAPI",
        }
      );
    }),
  ],
});

export const rpcHandler = new RPCHandler(appRouter, {
  interceptors: [
    createTimeoutInterceptor(),
    onError((error) => {
      serverLogger.error(
        {
          error: {
            message: error.message,
            stack: error.stack,
            name: error.name,
          },
        },
        "RPC handler error"
      );
      captureException(
        error instanceof Error ? error : new Error(String(error)),
        {
          handler: "RPC",
        }
      );
    }),
  ],
});

// Apply Arcjet protection to RPC and API routes (but not auth/upload routes)
app.use("/rpc/*", arcjetProtectionMiddleware);
app.use("/api-reference/*", arcjetProtectionMiddleware);

app.use("/*", async (c, next) => {
  const context = await createContext({ context: c });

  const rpcResult = await rpcHandler.handle(c.req.raw, {
    prefix: "/rpc",
    context,
  });

  if (rpcResult.matched) {
    return c.newResponse(rpcResult.response.body, rpcResult.response);
  }

  const apiResult = await apiHandler.handle(c.req.raw, {
    prefix: "/api-reference",
    context,
  });

  if (apiResult.matched) {
    return c.newResponse(apiResult.response.body, apiResult.response);
  }

  await next();
});

// Start the server
const port = process.env.PORT ? Number.parseInt(process.env.PORT, 10) : 3000;

export default {
  port,
  fetch: app.fetch,
};
