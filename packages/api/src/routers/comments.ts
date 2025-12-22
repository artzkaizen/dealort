import { db } from "@dealort/db";
import { comment, commentLike, user } from "@dealort/db/schema";
import { and, desc, eq, isNull, type SQL, sql } from "drizzle-orm";
import { z } from "zod";
import { protectedProcedure, publicProcedure } from "../index";

// Helper function to enrich comment with user data
async function enrichCommentWithUser(
  c: typeof comment.$inferSelect,
  userId?: string
) {
  const commentUser = await db.query.user.findFirst({
    where: eq(user.id, c.userId),
  });

  const likeCount = await db
    .select({ count: sql<number>`COUNT(*)` })
    .from(commentLike)
    .where(eq(commentLike.commentId, c.id));

  let hasLiked = false;
  if (userId) {
    const like = await db.query.commentLike.findFirst({
      where: and(
        eq(commentLike.commentId, c.id),
        eq(commentLike.userId, userId)
      ),
    });
    hasLiked = !!like;
  }

  return {
    ...c,
    user: commentUser
      ? {
          id: commentUser.id,
          name: commentUser.name,
          username: commentUser.username,
          displayUsername: commentUser.displayUsername,
          image: commentUser.image,
        }
      : null,
    likeCount: likeCount[0]?.count ?? 0,
    hasLiked,
  };
}

// Helper function to recursively fetch replies
async function fetchRepliesRecursively(
  parentId: string,
  userId?: string
): Promise<
  Array<
    typeof comment.$inferSelect & {
      user: unknown;
      likeCount: number;
      hasLiked: boolean;
      replies: unknown[];
    }
  >
> {
  const directReplies = await db.query.comment.findMany({
    where: eq(comment.parentId, parentId),
    orderBy: desc(comment.createdAt),
  });

  const repliesWithUsers = await Promise.all(
    directReplies.map(async (r) => {
      const enriched = await enrichCommentWithUser(r, userId);
      const nestedReplies = await fetchRepliesRecursively(r.id, userId);
      return {
        ...enriched,
        replies: nestedReplies,
      };
    })
  );

  return repliesWithUsers;
}

export const commentsRouter: Record<string, unknown> = {
  /**
   * Create a comment or reply
   */
  create: protectedProcedure
    .input(
      z.object({
        organizationId: z.string(),
        content: z.string().min(1),
        parentId: z.string().optional(),
      })
    )
    .handler(async ({ context, input }) => {
      if (!context.session?.user) {
        throw new Error("Unauthorized");
      }

      const id = crypto.randomUUID();
      await db.insert(comment).values({
        id,
        organizationId: input.organizationId,
        userId: context.session.user.id,
        content: input.content,
        parentId: input.parentId || null,
      });

      return { id, success: true };
    }),

  /**
   * Update a comment
   */
  update: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        content: z.string().min(1),
      })
    )
    .handler(async ({ context, input }) => {
      if (!context.session?.user) {
        throw new Error("Unauthorized");
      }

      const existingComment = await db.query.comment.findFirst({
        where: and(
          eq(comment.id, input.id),
          eq(comment.userId, context.session.user.id)
        ),
      });

      if (!existingComment) {
        throw new Error("Comment not found or unauthorized");
      }

      await db
        .update(comment)
        .set({
          content: input.content,
        })
        .where(eq(comment.id, input.id));

      return { success: true };
    }),

  /**
   * Delete a comment
   */
  delete: protectedProcedure
    .input(z.object({ id: z.string() }))
    .handler(async ({ context, input }) => {
      if (!context.session?.user) {
        throw new Error("Unauthorized");
      }

      const existingComment = await db.query.comment.findFirst({
        where: and(
          eq(comment.id, input.id),
          eq(comment.userId, context.session.user.id)
        ),
      });

      if (!existingComment) {
        throw new Error("Comment not found or unauthorized");
      }

      // Delete all replies first (cascade should handle this, but being explicit)
      await db.delete(comment).where(eq(comment.parentId, input.id));
      // Delete the comment
      await db.delete(comment).where(eq(comment.id, input.id));
      // Delete all likes on this comment
      await db.delete(commentLike).where(eq(commentLike.commentId, input.id));

      return { success: true };
    }),

  /**
   * Toggle like on a comment
   */
  toggleLike: protectedProcedure
    .input(z.object({ commentId: z.string() }))
    .handler(async ({ context, input }) => {
      if (!context.session?.user) {
        throw new Error("Unauthorized");
      }

      const userId = context.session.user.id;

      const existingLike = await db.query.commentLike.findFirst({
        where: and(
          eq(commentLike.commentId, input.commentId),
          eq(commentLike.userId, userId)
        ),
      });

      if (existingLike) {
        await db.delete(commentLike).where(eq(commentLike.id, existingLike.id));
        return { liked: false };
      }
      const id = crypto.randomUUID();
      await db.insert(commentLike).values({
        id,
        commentId: input.commentId,
        userId,
      });
      return { liked: true };
    }),

  /**
   * List comments with infinite query support
   * Returns top-level comments with their replies nested
   */
  list: publicProcedure
    .input(
      z.object({
        organizationId: z.string(),
        cursor: z.string().optional(),
        limit: z.number().min(1).max(50).default(10),
      })
    )
    .handler(async ({ context, input }) => {
      // Fetch top-level comments (parentId is null)
      let whereConditions: SQL = and(
        eq(comment.organizationId, input.organizationId),
        isNull(comment.parentId)
      ) as SQL;

      // Apply cursor if provided
      if (input.cursor) {
        const cursorComment = await db.query.comment.findFirst({
          where: eq(comment.id, input.cursor),
        });
        if (cursorComment) {
          whereConditions = and(
            whereConditions,
            sql`${comment.createdAt} < ${cursorComment.createdAt}`
          ) as SQL;
        }
      }

      // Build query with cursor pagination
      const topLevelComments = await db
        .select()
        .from(comment)
        .where(whereConditions)
        .orderBy(desc(comment.createdAt))
        .limit(input.limit + 1);

      const hasMore = topLevelComments.length > input.limit;
      const items = hasMore
        ? topLevelComments.slice(0, input.limit)
        : topLevelComments;

      // Fetch replies for each top-level comment
      const userId = context.session?.user?.id;
      const commentsWithReplies = await Promise.all(
        items.map(async (c) => {
          const enriched = await enrichCommentWithUser(c, userId);
          const replies = await fetchRepliesRecursively(c.id, userId);
          return {
            ...enriched,
            replies,
          };
        })
      );

      const nextCursor =
        hasMore && items.length > 0 ? (items.at(-1)?.id ?? null) : null;

      return {
        items: commentsWithReplies,
        nextCursor,
        hasMore,
      };
    }),
};

export type CommentsRouter = typeof commentsRouter;
