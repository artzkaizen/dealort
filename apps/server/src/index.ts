// dotenv.config({ path: '../../.env' });

import { createContext } from "@dealort/api/context";
import { appRouter } from "@dealort/api/routers/index";
import { uploadRouteHandler } from "@dealort/api/routers/uploadthing";
import { auth } from "@dealort/auth";
import { env } from "@dealort/utils/env";
import { OpenAPIHandler } from "@orpc/openapi/fetch";
import { OpenAPIReferencePlugin } from "@orpc/openapi/plugins";
import { onError } from "@orpc/server";
import { RPCHandler } from "@orpc/server/fetch";
import { ZodToJsonSchemaConverter } from "@orpc/zod/zod4";
import { type Context, Hono } from "hono";
import { cors } from "hono/cors";
import { logger } from "hono/logger";

const app = new Hono();

// Initialize Arcjet protection
// const aj = arcjet({
//   key: env.ARCJET_KEY || "",
//   rules: [
//     shield({
//       mode: "LIVE",
//     }),
//   ],

//   characteristics: ["userIdOrIp"],
// });

// const botSettings = { mode: "LIVE", allow: [] } satisfies BotOptions;
// const restrictiveRateLimitSettings = {
//   mode: "LIVE",
//   max: 10,
//   interval: "10m",
// } satisfies SlidingWindowRateLimitOptions<[]>;
// const laxRateLimitSettings = {
//   mode: "LIVE",
//   max: 60,
//   interval: "1m",
// } satisfies SlidingWindowRateLimitOptions<[]>;
// const emailSettings = {
//   mode: "LIVE",
//   block: ["DISPOSABLE", "INVALID", "NO_MX_RECORDS"],
// } satisfies EmailOptions;

app.use(logger());

// Apply Arcjet protection to all routes

// app.use("*", async (c, next) => {
//   // Skip Arcjet if no key is configured (for local development)
//   if (!env.ARCJET_KEY) {
//     await next();
//     return;
//   }

//   let body: string | undefined;
//   let parsedBody: Record<string, unknown> | undefined;
//   try {
//     body = await c.req.text();
//     if (body?.trim().startsWith("{")) {
//       parsedBody = JSON.parse(body);
//     }
//   } catch {
//     body = undefined;
//     parsedBody = undefined;
//   }

//   // Simulate getting user or IP
//   // (Auth is on a different route, cannot call it synchronously here)
//   // For extra safety, this could be improved with a proper user session/context extraction.
//   const userIdOrIp =
//     c.get("userId") ||
//     c.req.header("x-user-id") ||
//     c.req.header("x-forwarded-for") ||
//     c.req.header("x-real-ip") ||
//     "127.0.0.1";

//   const pathname = new URL(c.req.url).pathname;

//   let protectWith: {};
//   if (pathname.startsWith("/api/auth/sign-up")) {
//     // Restrictive on sign-up
//     if (
//       parsedBody &&
//       typeof parsedBody === "object" &&
//       typeof parsedBody.email === "string"
//     ) {
//       protectWith = aj.withRule(
//         protectSignup({
//           email: emailSettings,
//           bots: botSettings,
//           rateLimit: restrictiveRateLimitSettings,
//         })
//       );
//     } else {
//       protectWith = aj
//         .withRule(detectBot(botSettings))
//         .withRule(slidingWindow(restrictiveRateLimitSettings));
//     }
//   } else {
//     // Apply basic detection and lax rate limit everywhere else
//     protectWith = aj
//       .withRule(detectBot(botSettings))
//       .withRule(slidingWindow(laxRateLimitSettings));
//   }

//   // Ensure protectWith is typed properly and has the 'protect' method
//   if (typeof (protectWith as any).protect !== "function") {
//     throw new Error("protectWith is not properly configured");
//   }

//   const decision = await (protectWith as any).protect({
//     method: c.req.method,
//     path: pathname,
//     headers: c.req.raw.headers,
//     ip:
//       c.req.header("x-forwarded-for") || c.req.header("x-real-ip") || undefined,
//     getBody: async () => body,
//     email: parsedBody?.email,
//     userIdOrIp,
//   });

//   if (decision.isDenied()) {
//     if (decision.reason?.isRateLimit?.()) {
//       return c.text("Too Many Requests", 429);
//     }
//     if (decision.reason?.isEmail?.()) {
//       let message: string;
//       const types = decision.reason.emailTypes || [];
//       if (types.includes("DISPOSABLE")) {
//         message = "Disposable email addresses are not allowed";
//       } else if (types.includes("INVALID")) {
//         message = "Invalid email address";
//       } else if (types.includes("NO_MX_RECORDS")) {
//         message = "No MX records found for email address";
//       } else {
//         message = "Email address is not allowed";
//       }
//       return c.json({ message }, 400);
//     }
//     return c.text("Access Denied", 403);
//   }

//   await next();
// });

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

// Auth route handler
app.on(["POST", "GET"], "/api/auth/*", (c) => auth.handler(c.req.raw));

app.get("/", (c) => c.text("OK"));

async function uploadThingAdapter(c: Context) {
  console.log("reached uploadThingAdapter");
  const response = await uploadRouteHandler(c.req.raw);

  // Return the response directly, converting it to Hono's response format
  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers: response.headers,
  });
}

app.use("/api/uploadthing/*", uploadThingAdapter);

export const apiHandler = new OpenAPIHandler(appRouter, {
  plugins: [
    new OpenAPIReferencePlugin({
      schemaConverters: [new ZodToJsonSchemaConverter()],
    }),
  ],
  interceptors: [
    onError((error) => {
      console.error(error);
    }),
  ],
});

export const rpcHandler = new RPCHandler(appRouter, {
  interceptors: [
    onError((error) => {
      console.error("RPC Error:", error);
      console.error("Error stack:", error.stack);
      console.error("Error message:", error.message);
    }),
  ],
});

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
