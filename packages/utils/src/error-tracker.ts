import * as Sentry from "@sentry/bun";
import { env } from "./env";

/**
 * Initialize error tracking service (Sentry)
 * Only initializes in production or if SENTRY_DSN is provided
 */
export function initErrorTracking() {
  if (!env.SENTRY_DSN) {
    // Error tracking is optional - don't fail if not configured
    return;
  }

  Sentry.init({
    dsn: env.SENTRY_DSN,
    environment: env.NODE_ENV || "development",
    tracesSampleRate: env.NODE_ENV === "production" ? 0.1 : 1.0,
    beforeSend(event, _hint) {
      // Filter out sensitive information
      if (event.request) {
        // Remove sensitive headers
        if (event.request.headers) {
          delete event.request.headers.authorization;
          delete event.request.headers.cookie;
        }
      }
      return event;
    },
  });
}

/**
 * Capture an exception
 */
export function captureException(
  error: Error,
  context?: Record<string, unknown>
) {
  if (!env.SENTRY_DSN) return;

  Sentry.captureException(error, {
    extra: context,
  });
}

/**
 * Capture a message
 */
export function captureMessage(
  message: string,
  level: "info" | "warning" | "error" = "error",
  context?: Record<string, unknown>
) {
  if (!env.SENTRY_DSN) return;

  Sentry.captureMessage(message, {
    level,
    extra: context,
  });
}

/**
 * Set user context for error tracking
 */
export function setUserContext(user: {
  id: string;
  email?: string;
  username?: string;
}) {
  if (!env.SENTRY_DSN) return;

  Sentry.setUser({
    id: user.id,
    email: user.email,
    username: user.username,
  });
}

/**
 * Clear user context
 */
export function clearUserContext() {
  if (!env.SENTRY_DSN) return;

  Sentry.setUser(null);
}

/**
 * Add breadcrumb for debugging
 */
export function addBreadcrumb(
  message: string,
  category?: string,
  level: "debug" | "info" | "warning" | "error" = "info",
  data?: Record<string, unknown>
) {
  if (!env.SENTRY_DSN) return;

  Sentry.addBreadcrumb({
    message,
    category,
    level,
    data,
  });
}
