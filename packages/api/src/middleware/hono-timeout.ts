import type { Context } from "hono";
import { TIMEOUTS } from "./timeouts";

/**
 * Creates a Hono middleware that applies timeout to requests
 * @param timeoutMs - Timeout in milliseconds
 * @returns Hono middleware
 */
export function createHonoTimeoutMiddleware(timeoutMs: number) {
  return async (c: Context, next: () => Promise<void>) =>
    Promise.race([
      next(),
      new Promise<never>((_, reject) => {
        setTimeout(() => {
          const timeoutSeconds = Math.round(timeoutMs / 1000);
          reject(
            new Response(
              JSON.stringify({
                error: "TIMEOUT",
                message: `Request timeout: The operation took longer than ${timeoutSeconds} seconds to complete. Please try again or contact support if the problem persists.`,
              }),
              {
                status: 504,
                statusText: "Gateway Timeout",
                headers: { "Content-Type": "application/json" },
              }
            )
          );
        }, timeoutMs);
      }),
    ]);
}

/**
 * Timeout middleware for auth routes (2-3 minutes)
 */
export const authTimeoutMiddleware = createHonoTimeoutMiddleware(
  TIMEOUTS.LIGHT
);

/**
 * Timeout middleware for upload routes (5-7 minutes)
 */
export const uploadTimeoutMiddleware = createHonoTimeoutMiddleware(
  TIMEOUTS.MODERATE_HEAVY
);

/**
 * Timeout middleware for health check (2 minutes)
 */
export const healthCheckTimeoutMiddleware = createHonoTimeoutMiddleware(
  2 * 60 * 1000
);
