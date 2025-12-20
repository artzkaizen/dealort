import pino from "pino";
import { env } from "./env";

/**
 * Logger configuration based on environment
 */
const loggerConfig: pino.LoggerOptions = {
  level: env.NODE_ENV === "production" ? "info" : "debug",
  formatters: {
    level: (label) => ({ level: label }),
  },
  timestamp: pino.stdTimeFunctions.isoTime,
  ...(env.NODE_ENV === "development" && {
    transport: {
      target: "pino-pretty",
      options: {
        colorize: true,
        translateTime: "HH:MM:ss Z",
        ignore: "pid,hostname",
      },
    },
  }),
};

/**
 * Base logger instance
 */
const baseLogger = pino(loggerConfig);

/**
 * Create a child logger with context
 * @param context - Context object to include in all log messages
 * @returns Child logger instance
 */
export function createLogger(context: Record<string, unknown> = {}) {
  return baseLogger.child(context);
}

/**
 * Server logger - for server-side operations
 */
export const serverLogger = createLogger({ component: "server" });

/**
 * API logger - for API route handlers
 */
export const apiLogger = createLogger({ component: "api" });

/**
 * Email logger - for email service operations
 */
export const emailLogger = createLogger({ component: "email" });

/**
 * Auth logger - for authentication operations
 */
export const authLogger = createLogger({ component: "auth" });

/**
 * Default logger export
 */
export const logger = baseLogger;

export default logger;
