/**
 * Utility to strip HTML tags, unescape common HTML entities,
 * and clean snippets for preview cards and modals.
 */
export function cleanHtmlText(text: string | null | undefined): string {
  if (!text) return "";

  return text
    // Remove embedded HTML tags like <img>, <p>, <a>, etc.
    .replace(/<[^>]*>/g, "")
    // Remove escaped HTML tags like &lt;img ... &gt;
    .replace(/&lt;[^&]*&gt;/gi, "")
    // Decode common HTML entities
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&apos;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&nbsp;/g, " ")
    .replace(/&#8217;/g, "'")
    .replace(/&#8220;/g, '"')
    .replace(/&#8221;/g, '"')
    // Normalize extra whitespace
    .replace(/\s+/g, " ")
    .trim();
}
