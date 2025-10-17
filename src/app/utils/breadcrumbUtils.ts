/**
 * Utility functions for breadcrumb handling
 */

/**
 * Fully numeric segment pattern (e.g., "123")
 */
export const NUMERIC_ID_PATTERN = /^\d+$/;

/**
 * UUID format pattern (e.g., "550e8400-e29b-41d4-a716-446655440000")
 */
export const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * ID-name format pattern (e.g., "123-john-doe")
 */
export const ID_NAME_PATTERN = /^\d+-[a-z0-9-]+$/i;

/**
 * Checks if a URL segment appears to be an ID segment that should be
 * excluded from breadcrumb display
 *
 * @param segment The URL path segment to check
 * @returns True if the segment looks like an ID, false otherwise
 */
export function isIdSegment(segment: string): boolean {
  // Match fully numeric segments
  if (NUMERIC_ID_PATTERN.test(segment)) return true;

  // Match UUID format
  if (UUID_PATTERN.test(segment)) return true;

  // Match ID-name format (e.g., "123-john-doe")
  if (ID_NAME_PATTERN.test(segment)) return true;

  return false;
}

/**
 * Formats a URL segment into a human-readable label
 *
 * @param segment The URL path segment to format
 * @returns A formatted label with proper capitalization and spaces
 */
export function formatSegmentLabel(segment: string): string {
  return segment
    .split("-")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}
