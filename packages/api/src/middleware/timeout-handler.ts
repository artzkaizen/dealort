import { ORPCError } from "@orpc/server";
import { getTimeoutForRoute } from "./timeouts";

/**
 * Custom error class for timeout errors
 */
export class TimeoutError extends Error {
  constructor(routePath: string, timeoutMs: number) {
    const timeoutSeconds = Math.round(timeoutMs / 1000);
    super(
      `Request timeout: The operation took longer than ${timeoutSeconds} seconds to complete. Please try again or contact support if the problem persists.`
    );
    this.name = "TimeoutError";
  }
}

/**
 * Wraps a handler function with timeout protection
 * @param handler - The handler function to wrap
 * @param routePath - The route path for timeout configuration
 * @returns Wrapped handler with timeout
 */
export function withTimeout<T extends (...args: any[]) => Promise<any>>(
  handler: T,
  routePath: string
): T {
  return (async (...args: Parameters<T>) => {
    const timeoutMs = getTimeoutForRoute(routePath);

    return Promise.race([
      handler(...args),
      new Promise<never>((_, reject) => {
        setTimeout(() => {
          reject(new TimeoutError(routePath, timeoutMs));
        }, timeoutMs);
      }),
    ]).catch((error) => {
      if (error instanceof TimeoutError) {
        throw new ORPCError("TIMEOUT", error.message);
      }
      throw error;
    });
  }) as T;
}
