/**
 * Request timeout configurations for different route categories
 * Timeouts are specified in milliseconds
 */

// Timeout constants in milliseconds
export const TIMEOUTS = {
  // Heavy routes (8-10 minutes) - Complex aggregations, large data processing
  HEAVY: 10 * 60 * 1000, // 10 minutes

  // Moderate-heavy routes (5-7 minutes) - File uploads, list operations with joins
  MODERATE_HEAVY: 7 * 60 * 1000, // 7 minutes

  // Moderate routes (3-5 minutes) - CRUD operations with calculations
  MODERATE: 5 * 60 * 1000, // 5 minutes

  // Light routes (2-3 minutes) - Simple operations
  LIGHT: 3 * 60 * 1000, // 3 minutes
} as const;

/**
 * Route timeout mapping
 * Maps route paths to their timeout durations
 */
export const ROUTE_TIMEOUTS: Record<string, number> = {
  // Heavy routes (10 minutes)
  "analytics.getOverviewAnalytics": TIMEOUTS.HEAVY,
  "products.list": TIMEOUTS.HEAVY,
  "comments.list": TIMEOUTS.HEAVY,
  "products.getBySlug": TIMEOUTS.HEAVY,

  // Moderate-heavy routes (7 minutes)
  "reviews.list": TIMEOUTS.MODERATE_HEAVY,
  "products.syncOrganizationMetadata": TIMEOUTS.MODERATE_HEAVY,

  // Moderate routes (5 minutes)
  "reviews.create": TIMEOUTS.MODERATE,
  "reviews.update": TIMEOUTS.MODERATE,
  "reviews.delete": TIMEOUTS.MODERATE,
  "comments.create": TIMEOUTS.MODERATE,
  "comments.update": TIMEOUTS.MODERATE,
  "comments.delete": TIMEOUTS.MODERATE,
  "comments.toggleLike": TIMEOUTS.MODERATE,
  "products.create": TIMEOUTS.MODERATE,
  "products.update": TIMEOUTS.MODERATE,
  "products.follow": TIMEOUTS.MODERATE,
  "products.unfollow": TIMEOUTS.MODERATE,
  "products.toggleImpression": TIMEOUTS.MODERATE,

  // Light routes (3 minutes)
  healthCheck: TIMEOUTS.LIGHT,
  "reports.create": TIMEOUTS.LIGHT,
  updateUserImage: TIMEOUTS.LIGHT,
  privateData: TIMEOUTS.LIGHT,
};

/**
 * Get timeout for a specific route path
 * @param routePath - The route path (e.g., "products.list", "reviews.create")
 * @returns Timeout in milliseconds, defaults to MODERATE if not found
 */
export function getRouteTimeout(routePath: string): number {
  return ROUTE_TIMEOUTS[routePath] ?? TIMEOUTS.MODERATE;
}

/**
 * Check if a route path matches a pattern (for nested routes)
 * @param routePath - The route path to check
 * @param pattern - The pattern to match (supports wildcards)
 * @returns True if route matches pattern
 */
export function matchesRoutePattern(
  routePath: string,
  pattern: string
): boolean {
  if (pattern === "*") return true;
  if (pattern.endsWith("*")) {
    return routePath.startsWith(pattern.slice(0, -1));
  }
  return routePath === pattern;
}

/**
 * Get timeout for a route path, checking patterns
 * @param routePath - The route path
 * @returns Timeout in milliseconds
 */
export function getTimeoutForRoute(routePath: string): number {
  // Check exact match first
  if (ROUTE_TIMEOUTS[routePath]) {
    return ROUTE_TIMEOUTS[routePath];
  }

  // Check pattern matches
  for (const [pattern, timeout] of Object.entries(ROUTE_TIMEOUTS)) {
    if (matchesRoutePattern(routePath, pattern)) {
      return timeout;
    }
  }

  // Default timeout
  return TIMEOUTS.MODERATE;
}
