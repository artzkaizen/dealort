import { describe, expect, it } from "vitest";
import { getTimeoutForRoute, TIMEOUTS } from "../timeouts";

describe("Timeout Configuration", () => {
  it("should return correct timeout for heavy routes", () => {
    expect(getTimeoutForRoute("analytics.getOverviewAnalytics")).toBe(
      TIMEOUTS.HEAVY
    );
    expect(getTimeoutForRoute("products.list")).toBe(TIMEOUTS.HEAVY);
    expect(getTimeoutForRoute("comments.list")).toBe(TIMEOUTS.HEAVY);
    expect(getTimeoutForRoute("products.getBySlug")).toBe(TIMEOUTS.HEAVY);
  });

  it("should return correct timeout for moderate-heavy routes", () => {
    expect(getTimeoutForRoute("reviews.list")).toBe(TIMEOUTS.MODERATE_HEAVY);
    expect(getTimeoutForRoute("products.syncOrganizationMetadata")).toBe(
      TIMEOUTS.MODERATE_HEAVY
    );
  });

  it("should return correct timeout for moderate routes", () => {
    expect(getTimeoutForRoute("reviews.create")).toBe(TIMEOUTS.MODERATE);
    expect(getTimeoutForRoute("comments.create")).toBe(TIMEOUTS.MODERATE);
  });

  it("should return correct timeout for light routes", () => {
    expect(getTimeoutForRoute("healthCheck")).toBe(TIMEOUTS.LIGHT);
    expect(getTimeoutForRoute("reports.create")).toBe(TIMEOUTS.LIGHT);
  });

  it("should return default timeout for unknown routes", () => {
    expect(getTimeoutForRoute("unknown.route")).toBe(TIMEOUTS.MODERATE);
  });

  it("should have timeouts within valid range (2-10 minutes)", () => {
    expect(TIMEOUTS.LIGHT).toBeGreaterThanOrEqual(2 * 60 * 1000);
    expect(TIMEOUTS.LIGHT).toBeLessThanOrEqual(10 * 60 * 1000);
    expect(TIMEOUTS.MODERATE).toBeGreaterThanOrEqual(2 * 60 * 1000);
    expect(TIMEOUTS.MODERATE).toBeLessThanOrEqual(10 * 60 * 1000);
    expect(TIMEOUTS.MODERATE_HEAVY).toBeGreaterThanOrEqual(2 * 60 * 1000);
    expect(TIMEOUTS.MODERATE_HEAVY).toBeLessThanOrEqual(10 * 60 * 1000);
    expect(TIMEOUTS.HEAVY).toBeGreaterThanOrEqual(2 * 60 * 1000);
    expect(TIMEOUTS.HEAVY).toBeLessThanOrEqual(10 * 60 * 1000);
  });
});
