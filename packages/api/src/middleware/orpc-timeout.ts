import { ORPCError } from "@orpc/server";
import { getTimeoutForRoute } from "./timeouts";

/**
 * Creates an ORPC interceptor that applies timeouts based on route path
 */
export function createTimeoutInterceptor() {
  return {
    intercept(ctx: { path?: string }, next: () => Promise<any>) {
      if (!ctx.path) {
        return next();
      }

      // Extract route path from ORPC path (e.g., "/products/list" -> "products.list")
      const routePath = ctx.path.split("/").filter(Boolean).join(".");

      const timeoutMs = getTimeoutForRoute(routePath);

      return Promise.race([
        next(),
        new Promise<never>((_, reject) => {
          setTimeout(() => {
            const timeoutSeconds = Math.round(timeoutMs / 1000);
            reject(
              new ORPCError("TIMEOUT", {
                message: `Request timeout: The operation took longer than ${timeoutSeconds} seconds to complete. Please try again or contact support if the problem persists.`,
              })
            );
          }, timeoutMs);
        }),
      ]);
    },
  };
}
