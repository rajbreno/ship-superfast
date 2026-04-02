/** Generic utilities for parsing and sanitizing AI agent output. */

/** Strip HTML tags and truncate to a max length. */
export function sanitizeString(input: unknown, maxLength: number): string {
  if (typeof input !== "string") return "";
  return input.replace(/<[^>]*>/g, "").slice(0, maxLength);
}

/**
 * Extract a JSON array from free-form LLM text.
 * Agents often return JSON embedded in surrounding prose — this extracts
 * the first [...] block and parses it. Returns an empty array on failure.
 *
 * @example
 * const items = parseJsonArrayFromText<{ name: string }>(
 *   agentResponse,
 *   (item) => typeof item === "object" && item !== null && typeof item.name === "string",
 * );
 */
export function parseJsonArrayFromText<T>(
  text: string,
  typeGuard?: (item: unknown) => item is T,
): T[] {
  try {
    const jsonMatch = text.match(/\[[\s\S]*\]/);
    if (!jsonMatch) return [];

    const parsed = JSON.parse(jsonMatch[0]);
    if (!Array.isArray(parsed)) return [];

    if (typeGuard) {
      return parsed.filter(typeGuard);
    }
    return parsed as T[];
  } catch {
    return [];
  }
}
