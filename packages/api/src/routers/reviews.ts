import { db } from "@dealort/db";
import { organization, user } from "@dealort/db/schema/auth";
import { review } from "@dealort/db/schema/reviews";
import { and, asc, desc, eq, type SQL, sql } from "drizzle-orm";
import { z } from "zod";
import { protectedProcedure, publicProcedure } from "../index";

// Helper function to update organization rating
async function updateOrganizationRating(organizationId: string) {
  const stats = await db
    .select({
      avgRating: sql<number>`COALESCE(AVG(${review.rating}), 0)`,
    })
    .from(review)
    .where(eq(review.organizationId, organizationId));

  await db
    .update(organization)
    .set({
      rating: Math.round(stats[0]?.avgRating ?? 0),
    })
    .where(eq(organization.id, organizationId));
}

// Helper function to build where conditions for review list
function buildReviewWhereConditions(
  organizationId: string,
  filter: "all" | "my",
  userId?: string
): SQL {
  let conditions = eq(review.organizationId, organizationId);
  if (filter === "my" && userId) {
    conditions = and(conditions, eq(review.userId, userId)) as SQL;
  }
  return conditions;
}

// Helper function to enrich review with user data
async function enrichReviewWithUser(r: typeof review.$inferSelect) {
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
}

export const reviewsRouter: Record<string, unknown> = {
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
      await updateOrganizationRating(input.organizationId);

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
      await updateOrganizationRating(existingReview.organizationId);

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
      await updateOrganizationRating(existingReview.organizationId);

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
      const userId = context.session?.user?.id;
      let whereConditions = buildReviewWhereConditions(
        input.organizationId,
        input.filter,
        userId
      );

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
            ) as SQL;
          } else {
            whereConditions = and(
              whereConditions,
              sql`${review.id} != ${input.cursor}`
            ) as SQL;
          }
        }
      }

      // Build and execute query with sorting
      const baseQuery = db.select().from(review).where(whereConditions);

      let reviews: (typeof review.$inferSelect)[];
      if (input.sortBy === "recent") {
        reviews = await baseQuery
          .orderBy(desc(review.createdAt))
          .limit(input.limit + 1);
      } else if (input.sortBy === "top_rating") {
        reviews = await baseQuery
          .orderBy(desc(review.rating), desc(review.createdAt))
          .limit(input.limit + 1);
      } else {
        reviews = await baseQuery
          .orderBy(asc(review.rating), desc(review.createdAt))
          .limit(input.limit + 1);
      }

      // Process pagination
      const hasMore = reviews.length > input.limit;
      const items = hasMore ? reviews.slice(0, input.limit) : reviews;
      const nextCursor =
        hasMore && items.length > 0 ? (items.at(-1)?.id ?? null) : null;

      // Enrich with user data
      const reviewsWithUsers = await Promise.all(
        items.map(enrichReviewWithUser)
      );

      return {
        items: reviewsWithUsers,
        nextCursor,
        hasMore,
      };
    }),
};

export type ReviewsRouter = typeof reviewsRouter;
