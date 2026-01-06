import { db } from "@dealort/db";
import { env } from "@dealort/utils/env";
import { publicProcedure } from "../index";

/**
 * Health check response
 */
export interface HealthCheckResponse {
  status: "healthy" | "degraded" | "unhealthy";
  timestamp: string;
  checks: {
    database: {
      status: "healthy" | "unhealthy";
      responseTime?: number;
    };
    services: {
      resend: {
        status: "healthy" | "unhealthy" | "not_configured";
      };
      uploadthing: {
        status: "healthy" | "unhealthy" | "not_configured";
      };
    };
  };
}

export const healthRouter = {
  /**
   * Comprehensive health check endpoint
   * Checks database connectivity and external service availability
   */
  check: publicProcedure.handler(async (): Promise<HealthCheckResponse> => {
    const checks: HealthCheckResponse["checks"] = {
      database: {
        status: "unhealthy",
      },
      services: {
        resend: {
          status: env.RESEND_API_KEY ? "healthy" : "not_configured",
        },
        uploadthing: {
          status:
            env.UPLOADTHING_TOKEN && env.UPLOADTHING_CALLBACK_URL
              ? "healthy"
              : "not_configured",
        },
      },
    };

    // Check database connectivity
    const dbStartTime = Date.now();
    try {
      await db.execute(sql`SELECT 1`);
      checks.database.status = "healthy";
      checks.database.responseTime = Date.now() - dbStartTime;
    } catch (error) {
      checks.database.status = "unhealthy";
    }

    // Determine overall status
    const isHealthy =
      checks.database.status === "healthy" &&
      checks.services.resend.status !== "unhealthy" &&
      checks.services.uploadthing.status !== "unhealthy";

    const isDegraded =
      checks.database.status === "healthy" &&
      (checks.services.resend.status === "not_configured" ||
        checks.services.uploadthing.status === "not_configured");

    const status: HealthCheckResponse["status"] = isHealthy
      ? "healthy"
      : isDegraded
        ? "degraded"
        : "unhealthy";

    return {
      status,
      timestamp: new Date().toISOString(),
      checks,
    };
  }),
};

export type HealthRouter = typeof healthRouter;
