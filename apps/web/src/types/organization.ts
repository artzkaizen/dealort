/**
 * Type definitions for organization/product data structures
 */

import type { authClient } from "@/lib/auth-client";

/**
 * Base organization type from Better Auth getFullOrganization
 */
export type BaseOrganization = NonNullable<
  Awaited<
    ReturnType<typeof authClient.organization.getFullOrganization>
  >["data"]
>;

/**
 * Organization references from the API
 */
export interface OrganizationReferences {
  webUrl: string | null;
  xUrl: string | null;
  linkedinUrl: string | null;
  sourceCodeUrl: string | null;
}

/**
 * Organization with metadata (combines Better Auth org with API product data)
 */
export interface OrganizationWithMetadata extends BaseOrganization {
  references?: OrganizationReferences;
}

/**
 * Organization list item type (from useListOrganizations)
 */
export type OrganizationListItem = NonNullable<
  NonNullable<
    ReturnType<typeof authClient.useListOrganizations>["data"]
  >[number]
>;

/**
 * Type guard to check if organization has tagline property
 */
export function isOrganizationWithTagline(
  org: OrganizationListItem | BaseOrganization | null | undefined
): org is OrganizationListItem & { tagline: string } {
  return (
    org !== null &&
    org !== undefined &&
    "tagline" in org &&
    typeof org.tagline === "string"
  );
}

/**
 * Type guard to check if organization has category property
 */
export function isOrganizationWithCategory(
  org: OrganizationListItem | BaseOrganization | null | undefined
): org is OrganizationListItem & { category: string[] } {
  return (
    org !== null &&
    org !== undefined &&
    "category" in org &&
    Array.isArray(org.category) &&
    org.category.every((item) => typeof item === "string")
  );
}

/**
 * Type guard to check if organization has gallery property
 */
export function isOrganizationWithGallery(
  org: OrganizationListItem | BaseOrganization | null | undefined
): org is OrganizationListItem & { gallery: string[] } {
  return (
    org !== null &&
    org !== undefined &&
    "gallery" in org &&
    Array.isArray(org.gallery) &&
    org.gallery.every((item) => typeof item === "string")
  );
}

/**
 * Type guard to check if organization has logo property
 */
export function isOrganizationWithLogo(
  org: OrganizationListItem | BaseOrganization | null | undefined
): org is OrganizationListItem & { logo: string } {
  return (
    org !== null &&
    org !== undefined &&
    "logo" in org &&
    typeof org.logo === "string" &&
    org.logo.length > 0
  );
}

/**
 * Product data from API (products.getBySlug)
 */
export interface ProductData {
  id: string;
  name: string;
  slug: string;
  tagline: string;
  description: string | null;
  category: string[];
  url: string | null;
  xURL: string | null;
  linkedinURL: string | null;
  sourceCodeURL: string | null;
  isDev: boolean;
  isOpenSource: boolean;
  rating: number;
  impressions: number;
  logo: string | null;
  gallery: string[] | null;
  createdAt: Date;
  releaseDate: Date | null;
  reviewCount: number;
  commentCount: number;
  followerCount: number;
  likeCount: number;
  isFollowing: boolean;
  hasLiked: boolean;
  owner: unknown | null;
}
