/**
 * Utility functions for working with organization data
 */

import type {
  OrganizationListItem,
  OrganizationWithMetadata,
  ProductData,
} from "@/types/organization";
import {
  isOrganizationWithCategory,
  isOrganizationWithGallery,
  isOrganizationWithLogo,
  isOrganizationWithTagline,
} from "@/types/organization";

/**
 * Get organization tagline safely
 */
export function getOrganizationTagline(
  org: OrganizationListItem | null | undefined
): string {
  if (isOrganizationWithTagline(org)) {
    return org.tagline;
  }
  return "";
}

/**
 * Get organization category safely
 */
export function getOrganizationCategory(
  org: OrganizationListItem | null | undefined
): string[] {
  if (isOrganizationWithCategory(org)) {
    return org.category;
  }
  return [];
}

/**
 * Get organization gallery safely
 */
export function getOrganizationGallery(
  org:
    | OrganizationListItem
    | OrganizationWithMetadata
    | ProductData
    | null
    | undefined
): string[] {
  if (!org) return [];

  if (isOrganizationWithGallery(org)) {
    return org.gallery;
  }

  // Check if it's ProductData
  if ("gallery" in org && Array.isArray(org.gallery)) {
    return org.gallery.filter(
      (item): item is string => typeof item === "string"
    );
  }

  return [];
}

/**
 * Get organization logo safely
 */
export function getOrganizationLogo(
  org:
    | OrganizationListItem
    | OrganizationWithMetadata
    | ProductData
    | null
    | undefined
): string | null {
  if (!org) return null;

  if (isOrganizationWithLogo(org)) {
    return org.logo;
  }

  // Check if it has a logo property
  if ("logo" in org && typeof org.logo === "string") {
    return org.logo || null;
  }

  return null;
}

/**
 * Normalize organization data for consistent access
 */
export function normalizeOrganizationData(
  org: OrganizationListItem | null | undefined
): {
  id: string;
  name: string;
  slug: string | null;
  tagline: string;
  category: string[];
  logo: string | null;
  isListed: boolean;
  releaseDate: Date | null;
  createdAt: Date;
} | null {
  if (!org) return null;

  return {
    id: org.id,
    name: org.name ?? "",
    slug: org.slug ?? null,
    tagline: getOrganizationTagline(org),
    category: getOrganizationCategory(org),
    logo: getOrganizationLogo(org),
    isListed: isOrganizationListed(org),
    releaseDate: getOrganizationReleaseDate(org),
    createdAt: org.createdAt ? new Date(org.createdAt) : new Date(),
  };
}

/**
 * Filter out null organizations from array
 */
export function filterNonNullOrganizations(
  organizations: (OrganizationListItem | null)[] | null | undefined
): OrganizationListItem[] {
  if (!organizations) return [];
  return organizations.filter(
    (org): org is OrganizationListItem => org !== null
  );
}

/**
 * Get organization description safely
 */
export function getOrganizationDescription(
  org: OrganizationListItem | OrganizationWithMetadata | null | undefined
): string | null {
  if (!org) return null;
  if ("description" in org && typeof org.description === "string") {
    return org.description || null;
  }
  return null;
}

/**
 * Get organization release date safely
 */
export function getOrganizationReleaseDate(
  org: OrganizationListItem | OrganizationWithMetadata | null | undefined
): Date | null {
  if (!org) return null;
  if ("releaseDate" in org && org.releaseDate) {
    return org.releaseDate instanceof Date
      ? org.releaseDate
      : new Date(org.releaseDate);
  }
  return null;
}

/**
 * Check if organization is in development
 */
export function isOrganizationInDev(
  org: OrganizationListItem | OrganizationWithMetadata | null | undefined
): boolean {
  if (!org) return false;
  return "isDev" in org && typeof org.isDev === "boolean" && org.isDev;
}

/**
 * Check if organization is open source
 */
export function isOrganizationOpenSource(
  org: OrganizationListItem | OrganizationWithMetadata | null | undefined
): boolean {
  if (!org) return false;
  return (
    "isOpenSource" in org &&
    typeof org.isOpenSource === "boolean" &&
    org.isOpenSource
  );
}

/**
 * Check if organization is listed
 */
export function isOrganizationListed(
  org: OrganizationListItem | OrganizationWithMetadata | null | undefined
): boolean {
  if (!org) return false;
  return "isListed" in org && typeof org.isListed === "boolean" && org.isListed;
}
