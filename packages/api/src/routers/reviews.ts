import { db } from "@dealort/db";
import { organization, user } from "@dealort/db/schema/auth";
import { review } from "@dealort/db/schema/reviews";
import { and, asc, desc, eq, sql } from "drizzle-orm";
import { z } from "zod";
import { protectedProcedure, publicProcedure } from "../index";

export const reviewsRouter = {
  /**
   * Create a review
   */
  create: protectedProcedure
    .input(
      z.object({
        organizationId: z.string(),
        rating: z.number().min(1).max(5),
        title: z.string().optional(),
        content: z.string().min(1),
      })
    )
    .handler(async ({ context, input }) => {
      if (!context.session?.user) {
        throw new Error("Unauthorized");
      }

      // Check if user already reviewed this organization
      const existingReview = await db.query.review.findFirst({
        where: and(
          eq(review.organizationId, input.organizationId),
          eq(review.userId, context.session.user.id)
        ),
      });

      if (existingReview) {
        throw new Error("You have already reviewed this product");
      }

      const id = crypto.randomUUID();
      await db.insert(review).values({
        id,
        organizationId: input.organizationId,
        userId: context.session.user.id,
        rating: input.rating,
        title: input.title,
        content: input.content,
      });

      // Update organization average rating
      const stats = await db
        .select({
          avgRating: sql<number>`COALESCE(AVG(${review.rating}), 0)`,
        })
        .from(review)
        .where(eq(review.organizationId, input.organizationId));

      await db
        .update(organization)
        .set({
          rating: Math.round(stats[0]?.avgRating ?? 0),
        })
        .where(eq(organization.id, input.organizationId));

      return { id, success: true };
    }),

  /**
   * Update a review
   */
  update: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        rating: z.number().min(1).max(5).optional(),
        title: z.string().optional(),
        content: z.string().min(1).optional(),
      })
    )
    .handler(async ({ context, input }) => {
      if (!context.session?.user) {
        throw new Error("Unauthorized");
      }

      const existingReview = await db.query.review.findFirst({
        where: and(
          eq(review.id, input.id),
          eq(review.userId, context.session.user.id)
        ),
      });

      if (!existingReview) {
        throw new Error("Review not found or unauthorized");
      }

      await db
        .update(review)
        .set({
          rating: input.rating,
          title: input.title,
          content: input.content,
        })
        .where(eq(review.id, input.id));

      // Update organization average rating
      const stats = await db
        .select({
          avgRating: sql<number>`COALESCE(AVG(${review.rating}), 0)`,
        })
        .from(review)
        .where(eq(review.organizationId, existingReview.organizationId));

      await db
        .update(organization)
        .set({
          rating: Math.round(stats[0]?.avgRating ?? 0),
        })
        .where(eq(organization.id, existingReview.organizationId));

      return { success: true };
    }),

  /**
   * Delete a review
   */
  delete: protectedProcedure
    .input(z.object({ id: z.string() }))
    .handler(async ({ context, input }) => {
      if (!context.session?.user) {
        throw new Error("Unauthorized");
      }

      const existingReview = await db.query.review.findFirst({
        where: and(
          eq(review.id, input.id),
          eq(review.userId, context.session.user.id)
        ),
      });

      if (!existingReview) {
        throw new Error("Review not found or unauthorized");
      }

      await db.delete(review).where(eq(review.id, input.id));

      // Update organization average rating
      const stats = await db
        .select({
          avgRating: sql<number>`COALESCE(AVG(${review.rating}), 0)`,
        })
        .from(review)
        .where(eq(review.organizationId, existingReview.organizationId));

      await db
        .update(organization)
        .set({
          rating: Math.round(stats[0]?.avgRating ?? 0),
        })
        .where(eq(organization.id, existingReview.organizationId));

      return { success: true };
    }),

  /**
   * List reviews with infinite query support
   */
  list: publicProcedure
    .input(
      z.object({
        organizationId: z.string(),
        cursor: z.string().optional(),
        limit: z.number().min(1).max(50).default(10),
        filter: z.enum(["all", "my"]).default("all"),
        sortBy: z
          .enum(["recent", "top_rating", "lowest_rating"])
          .default("recent"),
      })
    )
    .handler(async ({ context, input }) => {
      let whereConditions = eq(review.organizationId, input.organizationId);

      // Filter by user if "my reviews"
      if (input.filter === "my" && context.session?.user) {
        whereConditions = and(
          whereConditions,
          eq(review.userId, context.session.user.id)
        ) as any;
      }

      // Build query with cursor pagination
      let query = db
        .select()
        .from(review)
        .where(whereConditions)
        .limit(input.limit + 1); // Fetch one extra to check if there's more

      // Apply sorting
      if (input.sortBy === "recent") {
        query = query.orderBy(desc(review.createdAt)) as any;
      } else if (input.sortBy === "top_rating") {
        query = query.orderBy(
          desc(review.rating),
          desc(review.createdAt)
        ) as any;
      } else if (input.sortBy === "lowest_rating") {
        query = query.orderBy(
          asc(review.rating),
          desc(review.createdAt)
        ) as any;
      }

      // Apply cursor if provided
      if (input.cursor) {
        const cursorReview = await db.query.review.findFirst({
          where: eq(review.id, input.cursor),
        });
        if (cursorReview) {
          if (input.sortBy === "recent") {
            whereConditions = and(
              whereConditions,
              sql`${review.createdAt} < ${cursorReview.createdAt}`
            ) as any;
          } else {
            whereConditions = and(
              whereConditions,
              sql`${review.id} != ${input.cursor}`
            ) as any;
          }
          query = db
            .select()
            .from(review)
            .where(whereConditions)
            .limit(input.limit + 1) as any;
          if (input.sortBy === "recent") {
            query = query.orderBy(desc(review.createdAt)) as any;
          } else if (input.sortBy === "top_rating") {
            query = query.orderBy(
              desc(review.rating),
              desc(review.createdAt)
            ) as any;
          } else if (input.sortBy === "lowest_rating") {
            query = query.orderBy(
              asc(review.rating),
              desc(review.createdAt)
            ) as any;
          }
        }
      }

      const reviews = (await query) as any;

      const hasMore = reviews.length > input.limit;
      const items = hasMore ? reviews.slice(0, input.limit) : reviews;
      const nextCursor =
        hasMore && items.length > 0 ? (items.at(-1)?.id ?? null) : null;

      // Fetch user data for each review
      const reviewsWithUsers = await Promise.all(
        items.map(async (r: typeof review.$inferSelect) => {
          const reviewUser = await db.query.user.findFirst({
            where: eq(user.id, r.userId),
          });
          return {
            ...r,
            user: reviewUser
              ? {
                  id: reviewUser.id,
                  name: reviewUser.name,
                  username: reviewUser.username,
                  displayUsername: reviewUser.displayUsername,
                  image: reviewUser.image,
                }
              : null,
          };
        })
      );

      return {
        items: reviewsWithUsers,
        nextCursor,
        hasMore,
      };
    }),
};

export type ReviewsRouter = typeof reviewsRouter;
