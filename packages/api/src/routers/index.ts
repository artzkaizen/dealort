import { db } from "@dealort/db";
import { user } from "@dealort/db/schema";
import type { RouterClient } from "@orpc/server";
import { eq } from "drizzle-orm";
import * as z from "zod/v4";
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

      await db
        .update(user)
        .set({ image: input.image })
        .where(eq(user.id, context.session.user.id));

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

export type AppRouterClient = RouterClient<typeof appRouter>;
