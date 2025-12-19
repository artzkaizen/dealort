import { db } from "@dealort/db";
import { member, organizationImpression } from "@dealort/db/schema/auth";
import { review } from "@dealort/db/schema/reviews";
import { and, count, eq, gte, lt, sql } from "drizzle-orm";
import { z } from "zod";
import { protectedProcedure } from "../index";

/**
 * Calculate date ranges based on duration
 */
function getDateRanges(duration: "30 days" | "3 months" | "1 year") {
  const now = Date.now();
  let currentPeriodStart: number;
  let previousPeriodStart: number;
  let previousPeriodEnd: number;

  switch (duration) {
    case "30 days":
      currentPeriodStart = now - 30 * 24 * 60 * 60 * 1000;
      previousPeriodEnd = currentPeriodStart;
      previousPeriodStart = previousPeriodEnd - 30 * 24 * 60 * 60 * 1000;
      break;
    case "3 months":
      currentPeriodStart = now - 90 * 24 * 60 * 60 * 1000;
      previousPeriodEnd = currentPeriodStart;
      previousPeriodStart = previousPeriodEnd - 90 * 24 * 60 * 60 * 1000;
      break;
    case "1 year":
      currentPeriodStart = now - 365 * 24 * 60 * 60 * 1000;
      previousPeriodEnd = currentPeriodStart;
      previousPeriodStart = previousPeriodEnd - 365 * 24 * 60 * 60 * 1000;
      break;
    default:
      currentPeriodStart = now - 30 * 24 * 60 * 60 * 1000;
      previousPeriodEnd = currentPeriodStart;
      previousPeriodStart = previousPeriodEnd - 30 * 24 * 60 * 60 * 1000;
      break;
  }

  return {
    currentPeriodStart,
    previousPeriodStart,
    previousPeriodEnd,
    now,
  };
}

/**
 * Calculate change metrics (absolute change, percentage, and trend direction)
 */
function calculateChange(
  current: number,
  previous: number
): {
  value: string;
  positive: boolean;
  percent: string;
} {
  const absoluteChange = current - previous;
  const isPositive = absoluteChange >= 0;
  let percentChange: number;
  if (previous === 0) {
    percentChange = current > 0 ? 100 : 0;
  } else {
    percentChange = Math.abs((absoluteChange / previous) * 100);
  }

  return {
    value: `${isPositive ? "+" : ""}${absoluteChange.toLocaleString()}`,
    positive: isPositive,
    percent: `${isPositive ? "+" : "-"}${percentChange.toFixed(1)}%`,
  };
}

export const analyticsRouter = {
  getOverviewAnalytics: protectedProcedure
    .input(
      z.object({
        userId: z.string(),
        duration: z.enum(["30 days", "3 months", "1 year"]),
      })
    )
    .handler(async ({ input }) => {
      const { userId, duration } = input;

      // Get all organization IDs for this user
      const userOrganizations = await db.query.member.findMany({
        where: eq(member.userId, userId),
        columns: {
          organizationId: true,
        },
      });

      const organizationIds = userOrganizations.map((m) => m.organizationId);

      if (organizationIds.length === 0) {
        // Return empty data if user has no organizations
        return {
          impressions: {
            value: "0",
            change: {
              value: "+0",
              positive: true,
              percent: "+0%",
            },
          },
          ratings: {
            value: "0",
            change: {
              value: "+0",
              positive: true,
              percent: "+0%",
            },
          },
        };
      }

      const {
        currentPeriodStart,
        previousPeriodStart,
        previousPeriodEnd,
        now,
      } = getDateRanges(duration);

      // Convert timestamps to Date objects for drizzle
      const currentPeriodStartDate = new Date(currentPeriodStart);
      const previousPeriodStartDate = new Date(previousPeriodStart);
      const previousPeriodEndDate = new Date(previousPeriodEnd);
      const nowDate = new Date(now);

      // Calculate impressions for current period
      const currentImpressions = await db
        .select({ count: count() })
        .from(organizationImpression)
        .where(
          and(
            sql`${organizationImpression.organizationId} IN (${sql.join(
              organizationIds.map((id) => sql`${id}`),
              sql`, `
            )})`,
            gte(organizationImpression.createdAt, currentPeriodStartDate),
            lt(organizationImpression.createdAt, nowDate)
          )
        );

      // Calculate impressions for previous period
      const previousImpressions = await db
        .select({ count: count() })
        .from(organizationImpression)
        .where(
          and(
            sql`${organizationImpression.organizationId} IN (${sql.join(
              organizationIds.map((id) => sql`${id}`),
              sql`, `
            )})`,
            gte(organizationImpression.createdAt, previousPeriodStartDate),
            lt(organizationImpression.createdAt, previousPeriodEndDate)
          )
        );

      // Calculate ratings for current period
      const currentRatings = await db
        .select({ count: count() })
        .from(review)
        .where(
          and(
            sql`${review.organizationId} IN (${sql.join(
              organizationIds.map((id) => sql`${id}`),
              sql`, `
            )})`,
            gte(review.createdAt, currentPeriodStartDate),
            lt(review.createdAt, nowDate)
          )
        );

      // Calculate ratings for previous period
      const previousRatings = await db
        .select({ count: count() })
        .from(review)
        .where(
          and(
            sql`${review.organizationId} IN (${sql.join(
              organizationIds.map((id) => sql`${id}`),
              sql`, `
            )})`,
            gte(review.createdAt, previousPeriodStartDate),
            lt(review.createdAt, previousPeriodEndDate)
          )
        );

      const impressionsCurrent = currentImpressions[0]?.count ?? 0;
      const impressionsPrevious = previousImpressions[0]?.count ?? 0;
      const ratingsCurrent = currentRatings[0]?.count ?? 0;
      const ratingsPrevious = previousRatings[0]?.count ?? 0;

      return {
        impressions: {
          value: impressionsCurrent.toLocaleString(),
          change: calculateChange(impressionsCurrent, impressionsPrevious),
        },
        ratings: {
          value: ratingsCurrent.toLocaleString(),
          change: calculateChange(ratingsCurrent, ratingsPrevious),
        },
      };
    }),
};
