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

/**
 * Formats a date to a short relative time string (e.g., "1 min", "30 mins", "10 secs", "12 hrs", "3 months", "1yr", "2 yrs")
 * @param {Date | number} date The date to format
 * @returns {string} The formatted time string
 */
export function formatShortTime(date: Date | number): string {
  const now = new Date();
  const then = typeof date === "number" ? new Date(date) : date;
  const diffMs = now.getTime() - then.getTime();
  const diffSecs = Math.floor(diffMs / 1000);
  const diffMins = Math.floor(diffSecs / 60);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);
  const diffMonths = Math.floor(diffDays / 30);
  const diffYears = Math.floor(diffDays / 365);

  if (diffSecs < 60) {
    return `${diffSecs} ${diffSecs === 1 ? "sec" : "secs"}`;
  }
  if (diffMins < 60) {
    return `${diffMins} ${diffMins === 1 ? "min" : "mins"}`;
  }
  if (diffHours < 24) {
    return `${diffHours} ${diffHours === 1 ? "hr" : "hrs"}`;
  }
  if (diffDays < 30) {
    return `${diffDays} ${diffDays === 1 ? "day" : "days"}`;
  }
  if (diffMonths < 12) {
    return `${diffMonths} ${diffMonths === 1 ? "month" : "months"}`;
  }
  return `${diffYears} ${diffYears === 1 ? "yr" : "yrs"}`;
}
