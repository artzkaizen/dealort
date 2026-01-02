import { db } from "@dealort/db";
import {
  comment,
  follow,
  member,
  organization,
  organizationImpression,
  organizationReference,
  review,
} from "@dealort/db/schema";
import { apiLogger } from "@dealort/utils/logger";
import { ORPCError } from "@orpc/server";
import { and, count, desc, eq, sql } from "drizzle-orm";
import * as z from "zod/v4";
import { protectedProcedure, publicProcedure } from "../index";

// Helper function to fetch organization stats
async function fetchOrganizationStats(organizationId: string) {
  const [reviewStats, commentCount, followerCount, likeCount] =
    await Promise.all([
      db
        .select({
          count: count(),
          avgRating: sql<number>`COALESCE(AVG(${review.rating}), 0)`,
        })
        .from(review)
        .where(eq(review.organizationId, organizationId)),
      db
        .select({ count: count() })
        .from(comment)
        .where(eq(comment.organizationId, organizationId)),
      db
        .select({ count: count() })
        .from(follow)
        .where(eq(follow.organizationId, organizationId)),
      db
        .select({ count: count() })
        .from(organizationImpression)
        .where(
          and(
            eq(organizationImpression.organizationId, organizationId),
            eq(organizationImpression.type, "like")
          )
        ),
    ]);

  return {
    reviewCount: reviewStats[0]?.count ?? 0,
    avgRating: reviewStats[0]?.avgRating ?? 0,
    commentCount: commentCount[0]?.count ?? 0,
    followerCount: followerCount[0]?.count ?? 0,
    likeCount: likeCount[0]?.count ?? 0,
  };
}

// Helper function to check user interaction state
async function checkUserInteractionState(
  organizationId: string,
  userId?: string
) {
  if (!userId) {
    return { isFollowing: false, hasLiked: false };
  }

  const [followRecord, likeRecord] = await Promise.all([
    db.query.follow.findFirst({
      where: and(
        eq(follow.organizationId, organizationId),
        eq(follow.userId, userId)
      ),
    }),
    db.query.organizationImpression.findFirst({
      where: and(
        eq(organizationImpression.organizationId, organizationId),
        eq(organizationImpression.userId, userId),
        eq(organizationImpression.type, "like")
      ),
    }),
  ]);

  return {
    isFollowing: !!followRecord,
    hasLiked: !!likeRecord,
  };
}

// Helper function to upsert organization reference
async function upsertOrganizationReference(
  tx: Parameters<Parameters<typeof db.transaction>[0]>[0],
  options: {
    organizationId: string;
    existingRef: typeof organizationReference.$inferSelect | null | undefined;
    url?: string;
    xUrl?: string;
    linkedinUrl?: string;
    sourceCodeUrl?: string;
  }
) {
  const { organizationId, existingRef, url, xUrl, linkedinUrl, sourceCodeUrl } =
    options;

  if (existingRef) {
    await tx
      .update(organizationReference)
      .set({
        webUrl: url ?? existingRef.webUrl,
        xUrl: xUrl ?? existingRef.xUrl,
        linkedinUrl: linkedinUrl ?? existingRef.linkedinUrl,
        sourceCodeUrl: sourceCodeUrl ?? existingRef.sourceCodeUrl,
      })
      .where(eq(organizationReference.id, existingRef.id));
  } else if (url || xUrl || linkedinUrl || sourceCodeUrl) {
    await tx.insert(organizationReference).values({
      id: crypto.randomUUID(),
      organizationId,
      webUrl: url ?? "",
      xUrl: xUrl ?? "",
      linkedinUrl: linkedinUrl ?? null,
      sourceCodeUrl: sourceCodeUrl ?? null,
    });
  }
}

// Helper function to build organization update object
function buildOrganizationUpdate(input: {
  logo?: string | null;
  gallery?: string[] | undefined;
  releaseDateMs?: number | null;
}) {
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

  return orgUpdate;
}

// Helper function to enrich organization with stats
async function enrichOrganizationWithStats(
  org: typeof organization.$inferSelect
) {
  // Get review count
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

  // Get reference URLs
  const ref = await db.query.organizationReference.findFirst({
    where: eq(organizationReference.organizationId, org.id),
  });

  const logo = org.logo ?? null;
  const gallery = org.gallery ?? [];
  const category = org.category ?? [];

  return {
    id: org.id,
    name: org.name,
    slug: org.slug,
    tagline: org.tagline,
    description: org.description ?? null,
    category,
    url: ref?.webUrl ?? null,
    xURL: ref?.xUrl ?? null,
    linkedinURL: ref?.linkedinUrl ?? null,
    sourceCodeURL: ref?.sourceCodeUrl ?? null,
    isDev: org.isDev,
    isOpenSource: org.isOpenSource,
    rating: Number(reviewStats[0]?.avgRating ?? 0),
    impressions: org.impressions,
    logo,
    gallery,
    createdAt: org.createdAt,
    releaseDate: org.releaseDate,
    reviewCount: reviewStats[0]?.count ?? 0,
    commentCount: commentCount[0]?.count ?? 0,
  };
}

export const productsRouter = {
  /**
   * Get product/organization by slug
   */
  getBySlug: publicProcedure
    .input(z.object({ slug: z.string() }))
    .handler(async ({ context, input }) => {
      try {
        const org = await db.query.organization.findFirst({
          where: eq(organization.slug, input.slug),
          with: {
            members: {
              limit: 1,
              with: {
                user: true,
              },
            },
          },
        });

        if (!org) {
          throw new ORPCError("NOT_FOUND", { message: "Product not found." });
        }

        // Fetch stats and user interaction state in parallel
        const [stats, userState] = await Promise.all([
          fetchOrganizationStats(org.id),
          checkUserInteractionState(org.id, context.session?.user?.id),
        ]);

        // Get the owner (first member's user)
        const owner =
          org.members && org.members.length > 0
            ? (org.members[0]?.user ?? null)
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
        const gallery = org.gallery ?? [];

        return {
          ...org,
          logo,
          gallery,
          url: productUrl,
          xURL: xUrl,
          linkedinURL: linkedinUrl,
          sourceCodeURL: sourceCodeUrl,
          reviewCount: stats.reviewCount,
          averageRating: Number(stats.avgRating),
          commentCount: stats.commentCount,
          followerCount: stats.followerCount,
          likeCount: stats.likeCount,
          isFollowing: userState.isFollowing,
          hasLiked: userState.hasLiked,
          owner,
        };
      } catch (error) {
        apiLogger.error(
          {
            error: {
              message: error instanceof Error ? error.message : String(error),
              stack: error instanceof Error ? error.stack : undefined,
            },
            input: { slug: input.slug },
          },
          "Error in getBySlug"
        );
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
        throw new ORPCError("UNAUTHORIZED");
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
        throw new ORPCError("UNAUTHORIZED");
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
        url: z.url().optional(),
        xUrl: z.url().optional(),
        linkedinUrl: z.url().optional(),
        sourceCodeUrl: z.url().optional(),
        logo: z.url().optional(),
        gallery: z.array(z.url()).optional(),
        // Release date in milliseconds since epoch (optional, null to clear)
        releaseDateMs: z.union([z.number(), z.null()]).optional(),
      })
    )
    .handler(async ({ context, input }) => {
      if (!context.session?.user) {
        throw new ORPCError("UNAUTHORIZED");
      }

      // Ensure the current user is a member (preferably owner) of the organization
      const membership = await db.query.member.findFirst({
        where: and(
          eq(member.organizationId, input.organizationId),
          eq(member.userId, context.session.user.id)
        ),
      });

      if (!membership || membership.role !== "owner") {
        throw new ORPCError("FORBIDDEN", {
          message: "You are not allowed to update this organization",
        });
      }

      // Check if reference record already exists
      const existingRef = await db.query.organizationReference.findFirst({
        where: eq(organizationReference.organizationId, input.organizationId),
      });

      // Apply changes transactionally
      await db.transaction(async (tx) => {
        // Upsert organization reference
        await upsertOrganizationReference(tx, {
          organizationId: input.organizationId,
          existingRef,
          url: input.url,
          xUrl: input.xUrl,
          linkedinUrl: input.linkedinUrl,
          sourceCodeUrl: input.sourceCodeUrl,
        });

        // Update organization fields
        const orgUpdate = buildOrganizationUpdate({
          logo: input.logo,
          gallery: input.gallery,
          releaseDateMs: input.releaseDateMs,
        });
        if (Object.keys(orgUpdate).length > 0) {
          await tx
            .update(organization)
            .set(orgUpdate)
            .where(eq(organization.id, input.organizationId));
        }
      });

      return { success: true };
    }),

  /**
   * List products with pagination, filtering, and sorting
   */
  list: publicProcedure
    .input(
      z.object({
        cursor: z.string().optional(),
        limit: z.number().min(1).max(50).default(10),
        categories: z.array(z.string()).optional(),
        sortBy: z.enum(["newest", "top", "trending"]).default("newest"),
      })
    )
    .handler(async ({ input }) => {
      // Fetch all listed products (we'll filter categories in memory for simplicity)
      // For production with large datasets, consider using a proper JSON search or separate category table
      const allOrgs = await db.query.organization.findMany({
        where: eq(organization.isListed, true),
        orderBy: [desc(organization.createdAt)],
      });

      // Filter by categories if provided
      let filteredOrgs = allOrgs;
      if (input.categories && input.categories.length > 0) {
        filteredOrgs = allOrgs.filter((org) => {
          const orgCategories = org.category ?? [];
          return input.categories?.some((cat) => orgCategories.includes(cat));
        });
      }

      // Sort the filtered results
      if (input.sortBy === "newest") {
        filteredOrgs.sort(
          (a, b) => b.createdAt.getTime() - a.createdAt.getTime()
        );
      } else if (input.sortBy === "top") {
        filteredOrgs.sort((a, b) => {
          if (b.rating !== a.rating) return b.rating - a.rating;
          return b.impressions - a.impressions;
        });
      } else if (input.sortBy === "trending") {
        filteredOrgs.sort((a, b) => {
          if (b.impressions !== a.impressions) {
            return b.impressions - a.impressions;
          }
          return b.createdAt.getTime() - a.createdAt.getTime();
        });
      }

      // Apply cursor pagination
      let startIndex = 0;
      if (input.cursor) {
        const cursorIndex = filteredOrgs.findIndex(
          (org) => org.id === input.cursor
        );
        if (cursorIndex >= 0) {
          startIndex = cursorIndex + 1;
        }
      }

      const paginatedOrgs = filteredOrgs.slice(
        startIndex,
        startIndex + input.limit + 1
      );
      const hasMore = paginatedOrgs.length > input.limit;
      const items = hasMore
        ? paginatedOrgs.slice(0, input.limit)
        : paginatedOrgs;

      // Enrich with stats
      const productsWithStats = await Promise.all(
        items.map((org) => enrichOrganizationWithStats(org))
      );

      return {
        items: productsWithStats,
        nextCursor:
          hasMore && items.length > 0 ? (items.at(-1)?.id ?? null) : null,
        hasMore,
      };
    }),

  /**
   * List launches with pagination and sorting
   */
  listLaunches: publicProcedure
    .input(
      z.object({
        cursor: z.string().optional(),
        limit: z.number().min(1).max(50).default(10),
        categories: z.array(z.string()).optional(),
        sortBy: z
          .enum(["recent_launch", "top_launches", "launching_soon"])
          .default("recent_launch"),
      })
    )
    .handler(async ({ input }) => {
      const now = new Date();

      // Fetch all listed products with releaseDate
      const allOrgs = await db.query.organization.findMany({
        where: and(eq(organization.isListed, true)),
      });

      // Filter by categories if provided
      let filteredOrgs = allOrgs.filter((org) => org.releaseDate !== null);
      if (input.categories && input.categories.length > 0) {
        filteredOrgs = filteredOrgs.filter((org) => {
          const orgCategories = org.category ?? [];
          return input.categories?.some((cat) => orgCategories.includes(cat));
        });
      }

      if (input.sortBy === "recent_launch") {
        // Recent launch: products with release dates, sorted by releaseDate descending
        filteredOrgs.sort(
          (a, b) =>
            (b.releaseDate?.getTime() ?? 0) - (a.releaseDate?.getTime() ?? 0)
        );
      } else if (input.sortBy === "top_launches") {
        // Top launches: highest impressions and ratings
        filteredOrgs.sort((a, b) => {
          if (b.impressions !== a.impressions) {
            return b.impressions - a.impressions;
          }
          if (b.rating !== a.rating) return b.rating - a.rating;
          return b.createdAt.getTime() - a.createdAt.getTime();
        });
      } else if (input.sortBy === "launching_soon") {
        // Launching soon: release date after now, closest to now
        filteredOrgs = filteredOrgs.filter(
          (org) => org.releaseDate && org.releaseDate > now
        );
        filteredOrgs.sort(
          (a, b) =>
            (a.releaseDate?.getTime() ?? 0) - (b.releaseDate?.getTime() ?? 0)
        );
      }

      // Apply cursor pagination
      let startIndex = 0;
      if (input.cursor) {
        const cursorIndex = filteredOrgs.findIndex(
          (org) => org.id === input.cursor
        );
        if (cursorIndex >= 0) {
          startIndex = cursorIndex + 1;
        }
      }

      const paginatedOrgs = filteredOrgs.slice(
        startIndex,
        startIndex + input.limit + 1
      );
      const hasMore = paginatedOrgs.length > input.limit;
      const items = hasMore
        ? paginatedOrgs.slice(0, input.limit)
        : paginatedOrgs;

      // Enrich with stats
      const launchesWithStats = await Promise.all(
        items.map((org) => enrichOrganizationWithStats(org))
      );

      return {
        items: launchesWithStats,
        nextCursor:
          hasMore && items.length > 0 ? (items.at(-1)?.id ?? null) : null,
        hasMore,
      };
    }),

  /**
   * Get recent listed products for sidebar
   */
  listRecent: publicProcedure
    .input(
      z.object({
        limit: z.number().min(1).max(20).default(10),
      })
    )
    .handler(async ({ input }) => {
      const orgs = await db.query.organization.findMany({
        where: eq(organization.isListed, true),
        orderBy: [desc(organization.createdAt)],
        limit: input.limit,
      });

      // Enrich with stats
      const productsWithStats = await Promise.all(
        orgs.map((org) => enrichOrganizationWithStats(org))
      );

      return productsWithStats;
    }),
};

export type ProductsRouter = typeof productsRouter;
