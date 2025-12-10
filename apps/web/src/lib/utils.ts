import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Formats number to redable format like 1k, 2.5m
 */
export const formatNumber = new Intl.NumberFormat("en-US", {
  notation: "compact",
  compactDisplay: "short", // Use 'k' instead of 'thousand'
});

/**
 * Converts text into a URL-friendly slug (lowercase, with words separated by hyphens, removing special characters).
 * @param {string} text The input string to slugify.
 * @returns {string} The slugified string (e.g., 'my-great-article').
 */
export function slugify(text: string): string {
  if (!text) return "";
  return text
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/[\s-]+/g, "-")
    .replace(/^-+|-+$/g, "");
}
