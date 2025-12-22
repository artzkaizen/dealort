import { createClient } from "@arcjet/protocol/client";
import { createConnectTransport } from "@connectrpc/connect-node";
import { env } from "@dealort/utils/env";
import { apiLogger } from "@dealort/utils/logger";
import arcjet, {
  detectBot,
  protectSignup,
  shield,
  slidingWindow,
} from "arcjet";
import type { Context } from "hono";

// Initialize Arcjet protection
const mode =
  env.NODE_ENV === "production" ? ("LIVE" as const) : ("DRY_RUN" as const);

// Create Arcjet client with ConnectRPC transport
// Arcjet requires a client to be provided
const arcjetClient = env.ARCJET_KEY
  ? createClient({
      transport: createConnectTransport({
        baseUrl: "https://decide.arcjet.com",
        httpVersion: "2",
      }),
      baseUrl: "https://decide.arcjet.com",
      timeout: 10_000,
      sdkStack: "BUN",
      sdkVersion: "1.0.0-beta.15",
    })
  : undefined;

const aj =
  env.ARCJET_KEY && arcjetClient
    ? arcjet({
        key: env.ARCJET_KEY,
        log: apiLogger,
        client: arcjetClient,
        rules: [
          shield({
            mode,
          }),
        ],
        characteristics: ["userIdOrIp"],
      })
    : null;

const botSettings = {
  mode,
  deny: [],
};

const restrictiveRateLimitSettings = {
  mode,
  max: 10,
  interval: "10m" as const,
};

const laxRateLimitSettings = {
  mode,
  max: 60,
  interval: "1m" as const,
};

const emailSettings = {
  mode,
  block: ["DISPOSABLE", "INVALID", "NO_MX_RECORDS"] as [
    "DISPOSABLE",
    "INVALID",
    "NO_MX_RECORDS",
  ],
};

// Helper function to get user ID or IP
function getUserIdOrIp(c: Context): string {
  return (
    c.get("userId") ||
    c.req.header("x-user-id") ||
    c.req.header("x-forwarded-for") ||
    c.req.header("x-real-ip") ||
    "127.0.0.1"
  );
}

// Helper function to parse request body for email
async function parseBodyForEmail(
  request: Request
): Promise<Record<string, unknown> | undefined> {
  try {
    const clonedRequest = request.clone();
    const body = await clonedRequest.text();
    if (body?.trim().startsWith("{")) {
      return JSON.parse(body) as Record<string, unknown>;
    }
  } catch {
    // If body parsing fails, return undefined
  }
  return;
}

// Helper function to build protection rules for sign-up
function buildSignUpProtection(
  parsedBody: Record<string, unknown> | undefined
): ReturnType<NonNullable<typeof aj>["withRule"]> {
  if (!aj) {
    throw new Error("Arcjet is not initialized");
  }
  if (
    parsedBody &&
    typeof parsedBody === "object" &&
    typeof parsedBody.email === "string"
  ) {
    return aj.withRule(
      protectSignup({
        email: emailSettings,
        bots: botSettings,
        rateLimit: restrictiveRateLimitSettings,
      })
    );
  }
  return aj
    .withRule(detectBot(botSettings))
    .withRule(slidingWindow(restrictiveRateLimitSettings));
}

// Helper function to handle denied decisions
function handleDeniedDecision(
  c: Context,
  decision: Awaited<
    ReturnType<ReturnType<NonNullable<typeof aj>["withRule"]>["protect"]>
  >
) {
  if (decision.reason?.isRateLimit?.()) {
    return c.text("Too Many Requests", 429);
  }
  if (decision.reason?.isEmail?.()) {
    let message: string;
    const types = decision.reason.emailTypes || [];
    if (types.includes("DISPOSABLE")) {
      message = "Disposable email addresses are not allowed";
    } else if (types.includes("INVALID")) {
      message = "Invalid email address";
    } else if (types.includes("NO_MX_RECORDS")) {
      message = "No MX records found for email address";
    } else {
      message = "Email address is not allowed";
    }
    return c.json({ message }, 400);
  }
  return c.text("Access Denied", 403);
}

/**
 * Arcjet middleware that protects routes without consuming the request body
 * This middleware should be applied selectively to routes that need protection
 * but don't require body inspection for email validation.
 */
export async function arcjetProtectionMiddleware(
  c: Context,
  next: () => Promise<void>
) {
  // Skip Arcjet if no key is configured or not initialized (for local development)
  if (!(env.ARCJET_KEY && aj)) {
    await next();
    return;
  }

  const pathname = new URL(c.req.url).pathname;
  const userIdOrIp = getUserIdOrIp(c);
  const isSignUpRoute = pathname.startsWith("/api/auth/sign-up");
  const isWaitlistRoute = pathname.includes("/waitlist/");

  // Build protection rules based on route
  let protectWith: ReturnType<typeof aj.withRule>;
  let parsedBody: Record<string, unknown> | undefined;

  if (isSignUpRoute) {
    parsedBody = await parseBodyForEmail(c.req.raw);
    protectWith = buildSignUpProtection(parsedBody);
  } else if (isWaitlistRoute) {
    // For waitlist routes, only apply rate limiting (skip bot detection)
    // Bot detection requires User-Agent header which may not be present
    protectWith = aj.withRule(slidingWindow(laxRateLimitSettings));
  } else {
    protectWith = aj
      .withRule(detectBot(botSettings))
      .withRule(slidingWindow(laxRateLimitSettings));
  }

  // Execute protection
  try {
    const decision = await protectWith.protect(
      {
        method: c.req.method,
        path: pathname,
        headers: c.req.raw.headers,
        ip:
          c.req.header("x-forwarded-for") ||
          c.req.header("x-real-ip") ||
          undefined,
        getBody: async () => {
          if (isSignUpRoute) {
            const clonedRequest = c.req.raw.clone();
            return await clonedRequest.text();
          }
          return;
        },
        email: parsedBody?.email as string | undefined,
        userIdOrIp,
      },
      {
        userIdOrIp,
      }
    );

    if (decision.isDenied()) {
      return handleDeniedDecision(c, decision);
    }
  } catch (error) {
    // If Arcjet fails (e.g., missing User-Agent for bot detection), log and continue
    // This prevents blocking legitimate requests due to Arcjet configuration issues
    apiLogger.warn(
      {
        error: error instanceof Error ? error.message : String(error),
        path: pathname,
      },
      "Arcjet protection failed, allowing request to proceed"
    );
    // Continue to next middleware/handler
  }

  await next();
}
