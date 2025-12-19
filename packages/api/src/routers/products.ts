import { db } from "@dealort/db";
import {
  follow,
  member,
  organization,
  organizationImpression,
} from "@dealort/db/schema/auth";
import { organizationReference } from "@dealort/db/schema/org_meta";
import { comment, review } from "@dealort/db/schema/reviews";
import { and, count, eq, sql } from "drizzle-orm";
import { z } from "zod";
import { protectedProcedure, publicProcedure } from "../index";

export const productsRouter = {
  /**
   * Get product/organization by slug
   */
  getBySlug: publicProcedure
    .input(z.object({ slug: z.string() }))
    .handler(async ({ context, input }) => {
      try {
        const org = (await db.query.organization.findFirst({
          where: eq(organization.slug, input.slug),
          with: {
            members: {
              limit: 1,
              with: {
                user: true,
              },
            },
          },
        })) as
          | (typeof organization.$inferSelect & {
              members?: Array<{ user?: unknown }>;
            })
          | undefined;

        if (!org) {
          throw new Error("Product not found");
        }

        // Get review stats
        const reviewStats = await db
          .select({
            count: count(),
            avgRating: sql<number>`COALESCE(AVG(${review.rating}), 0)`,
          })
          .from(review)
          .where(eq(review.organizationId, org.id));

        // Get comment count
        const commentCount = await db
          .select({ count: count() })
          .from(comment)
          .where(eq(comment.organizationId, org.id));

        // Get follower count
        const followerCount = await db
          .select({ count: count() })
          .from(follow)
          .where(eq(follow.organizationId, org.id));

        // Get like count
        const likeCount = await db
          .select({ count: count() })
          .from(organizationImpression)
          .where(
            and(
              eq(organizationImpression.organizationId, org.id),
              eq(organizationImpression.type, "like")
            )
          );

        // Check if user is following (if authenticated)
        let isFollowing = false;
        if (context.session?.user) {
          const followRecord = await db.query.follow.findFirst({
            where: and(
              eq(follow.organizationId, org.id),
              eq(follow.userId, context.session.user.id)
            ),
          });
          isFollowing = !!followRecord;
        }

        // Check if user has liked (if authenticated)
        let hasLiked = false;
        if (context.session?.user) {
          const likeRecord = await db.query.organizationImpression.findFirst({
            where: and(
              eq(organizationImpression.organizationId, org.id),
              eq(organizationImpression.userId, context.session.user.id),
              eq(organizationImpression.type, "like")
            ),
          });
          hasLiked = !!likeRecord;
        }

        // Get the owner (first member's user)
        const owner =
          (org as { members?: Array<{ user?: unknown }> }).members &&
          (org as { members: Array<{ user?: unknown }> }).members.length > 0
            ? ((org as { members: Array<{ user?: unknown }> }).members[0]
                ?.user ?? null)
            : null;

        // Get references (one record per organization) from normalized table
        const ref = await db.query.organizationReference.findFirst({
          where: eq(organizationReference.organizationId, org.id),
        });
        const productUrl = ref?.webUrl ?? null;
        const xUrl = ref?.xUrl ?? null;
        const linkedinUrl = ref?.linkedinUrl ?? null;
        const sourceCodeUrl = ref?.sourceCodeUrl ?? null;

        // Get logo and gallery from organization table
        const logo = org.logo ?? null;
        const gallery = (org.gallery as string[] | null) ?? [];

        return {
          ...org,
          logo,
          gallery,
          url: productUrl,
          xURL: xUrl,
          linkedinURL: linkedinUrl,
          sourceCodeURL: sourceCodeUrl,
          reviewCount: reviewStats[0]?.count ?? 0,
          averageRating: Number(reviewStats[0]?.avgRating ?? 0),
          commentCount: commentCount[0]?.count ?? 0,
          followerCount: followerCount[0]?.count ?? 0,
          likeCount: likeCount[0]?.count ?? 0,
          isFollowing,
          hasLiked,
          owner,
        };
      } catch (error) {
        console.error("Error in getBySlug:", error);
        console.error(
          "Error details:",
          error instanceof Error ? error.message : String(error)
        );
        console.error(
          "Error stack:",
          error instanceof Error ? error.stack : "No stack trace"
        );
        console.error("Input slug:", input.slug);
        throw error;
      }
    }),

  /**
   * Like/unlike a product/organization
   */
  toggleLike: protectedProcedure
    .input(z.object({ organizationId: z.string() }))
    .handler(async ({ context, input }) => {
      if (!context.session?.user) {
        throw new Error("Unauthorized");
      }

      const userId = context.session.user.id;

      // Check if already liked
      const existingLike = await db.query.organizationImpression.findFirst({
        where: and(
          eq(organizationImpression.organizationId, input.organizationId),
          eq(organizationImpression.userId, userId),
          eq(organizationImpression.type, "like")
        ),
      });

      if (existingLike) {
        // Unlike - delete the impression
        await db
          .delete(organizationImpression)
          .where(eq(organizationImpression.id, existingLike.id));

        // Decrement impressions count
        await db
          .update(organization)
          .set({
            impressions: sql`${organization.impressions} - 1`,
          })
          .where(eq(organization.id, input.organizationId));

        return { liked: false };
      }
      // Like - create impression
      const id = crypto.randomUUID();
      await db.insert(organizationImpression).values({
        id,
        organizationId: input.organizationId,
        userId,
        type: "like",
      });

      // Increment impressions count
      await db
        .update(organization)
        .set({
          impressions: sql`${organization.impressions} + 1`,
        })
        .where(eq(organization.id, input.organizationId));

      return { liked: true };
    }),

  /**
   * Follow/unfollow a product/organization
   */
  toggleFollow: protectedProcedure
    .input(z.object({ organizationId: z.string() }))
    .handler(async ({ context, input }) => {
      if (!context.session?.user) {
        throw new Error("Unauthorized");
      }

      const userId = context.session.user.id;

      // Check if already following
      const existingFollow = await db.query.follow.findFirst({
        where: and(
          eq(follow.organizationId, input.organizationId),
          eq(follow.userId, userId)
        ),
      });

      if (existingFollow) {
        // Unfollow - delete the follow record
        await db.delete(follow).where(eq(follow.id, existingFollow.id));
        return { following: false };
      }
      // Follow - create follow record
      const id = crypto.randomUUID();
      await db.insert(follow).values({
        id,
        organizationId: input.organizationId,
        userId,
      });
      return { following: true };
    }),

  /**
   * Sync organization links into the normalized tables.
   * organizationReference is the canonical storage for URLs.
   * Logo and gallery are stored directly on the organization table.
   */
  syncOrganizationMetadata: protectedProcedure
    .input(
      z.object({
        organizationId: z.string(),
        url: z.string().url().optional(),
        xUrl: z.string().url().optional(),
        linkedinUrl: z.string().url().optional(),
        sourceCodeUrl: z.string().url().optional(),
        logo: z.string().url().optional(),
        gallery: z.array(z.string().url()).optional(),
        // Release date in milliseconds since epoch (optional)
        releaseDateMs: z.number().optional(),
      })
    )
    .handler(async ({ context, input }) => {
      if (!context.session?.user) {
        throw new Error("Unauthorized");
      }

      // Ensure the current user is a member (preferably owner) of the organization
      const membership = await db.query.member.findFirst({
        where: and(
          eq(member.organizationId, input.organizationId),
          eq(member.userId, context.session.user.id)
        ),
      });

      if (!membership || membership.role !== "owner") {
        throw new Error("You are not allowed to update this organization");
      }

      // Check if reference record already exists
      const existingRef = await db.query.organizationReference.findFirst({
        where: eq(organizationReference.organizationId, input.organizationId),
      });

      // Apply changes transactionally
      await db.transaction(async (tx) => {
        // Upsert organization reference
        if (existingRef) {
          await tx
            .update(organizationReference)
            .set({
              webUrl: input.url ?? existingRef.webUrl,
              xUrl: input.xUrl ?? existingRef.xUrl,
              linkedinUrl: input.linkedinUrl ?? existingRef.linkedinUrl,
              sourceCodeUrl: input.sourceCodeUrl ?? existingRef.sourceCodeUrl,
            })
            .where(eq(organizationReference.id, existingRef.id));
        } else if (
          input.url ||
          input.xUrl ||
          input.linkedinUrl ||
          input.sourceCodeUrl
        ) {
          await tx.insert(organizationReference).values({
            id: crypto.randomUUID(),
            organizationId: input.organizationId,
            webUrl: input.url ?? "",
            xUrl: input.xUrl ?? "",
            linkedinUrl: input.linkedinUrl ?? null,
            sourceCodeUrl: input.sourceCodeUrl ?? null,
          });
        }

        // Update logo, gallery and release date directly on organization table
        const orgUpdate: {
          logo?: string | null;
          gallery?: string[] | null;
          releaseDate?: Date | null;
        } = {};
        if (input.logo !== undefined) {
          orgUpdate.logo = input.logo;
        }
        if (input.gallery !== undefined) {
          orgUpdate.gallery = input.gallery.length > 0 ? input.gallery : null;
        }
        if (input.releaseDateMs !== undefined) {
          orgUpdate.releaseDate =
            input.releaseDateMs === null ? null : new Date(input.releaseDateMs);
        }

        if (Object.keys(orgUpdate).length > 0) {
          await tx
            .update(organization)
            .set(orgUpdate)
            .where(eq(organization.id, input.organizationId));
        }
      });

      return { success: true };
    }),
};

export type ProductsRouter = typeof productsRouter;
