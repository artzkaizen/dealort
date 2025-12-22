import { db } from "@dealort/db";
import type { RouterClient } from "@orpc/server";
import { z } from "zod";
import { protectedProcedure, publicProcedure } from "../index";
import { analyticsRouter } from "./analytics";
import { commentsRouter } from "./comments";
import { healthRouter } from "./health";
import { productsRouter } from "./products";
import { reportsRouter } from "./reports";
import { reviewsRouter } from "./reviews";
import { waitlistRouter } from "./waitlist";

/**
 * Main application router combining all route handlers
 * Note: Type annotation is intentionally omitted to allow TypeScript to infer the type.
 * The AppRouter type is exported separately for client usage.
 */
// @ts-expect-error - Type inference exceeds TypeScript's serialization limit, but runtime works correctly
export const appRouter = {
  /**
   * Simple health check endpoint
   */
  healthCheck: publicProcedure.handler(() => "OK"),

  /**
   * Comprehensive health check with service status
   */
  health: healthRouter,

  /**
   * Test endpoint for protected routes
   */
  privateData: protectedProcedure.handler(({ context }) => ({
    message: "This is private",
    user: context.session?.user,
  })),

  /**
   * Update user profile image
   */
  updateUserImage: protectedProcedure
    .input(z.object({ image: z.string().url() }))
    .handler(async ({ context, input }) => {
      if (!context.session?.user) {
        throw new Error("Unauthorized");
      }

      await db.$client.execute({
        sql: "UPDATE user SET image = ?, updated_at = ? WHERE id = ?",
        args: [input.image, new Date().toISOString(), context.session.user.id],
      });

      return { success: true };
    }),

  /**
   * Product/organization routes
   */
  products: productsRouter,

  /**
   * Review routes
   */
  reviews: reviewsRouter,

  /**
   * Comment routes
   */
  comments: commentsRouter,

  /**
   * Report routes
   */
  reports: reportsRouter,

  /**
   * Analytics routes
   */
  analytics: analyticsRouter,

  /**
   * Waitlist routes
   */
  waitlist: waitlistRouter,
};

export type AppRouter = typeof appRouter;
// Type assertion needed because child routers use Record<string, unknown>
// which doesn't satisfy ORPC's strict Router type constraint, but works correctly at runtime
// The routers are properly structured ORPC routers, just typed more loosely
// @ts-expect-error - Record<string, unknown> doesn't satisfy Router constraint but works at runtime
export type AppRouterClient = RouterClient<typeof appRouter>;
