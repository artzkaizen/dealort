import { describe, expect, it } from "vitest";
import { healthRouter } from "../health";

describe("Health Router", () => {
  it("should return health check response", async () => {
    const result = await healthRouter.check.handler({} as any);

    expect(result).toHaveProperty("status");
    expect(result).toHaveProperty("timestamp");
    expect(result).toHaveProperty("checks");
    expect(result.checks).toHaveProperty("database");
    expect(result.checks).toHaveProperty("services");
    expect(["healthy", "degraded", "unhealthy"]).toContain(result.status);
  });

  it("should check database connectivity", async () => {
    const result = await healthRouter.check.handler({} as any);

    expect(result.checks.database).toHaveProperty("status");
    expect(["healthy", "unhealthy"]).toContain(result.checks.database.status);
  });
});
