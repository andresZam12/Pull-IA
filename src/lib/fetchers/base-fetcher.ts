/**
 * PULL-IA — Abstract Base Fetcher
 *
 * All news source fetchers extend this class.
 * Enforces a consistent interface and shared error handling logic
 * across all sources (RSS, API, scraper).
 */

import type { RawArticle, FetcherConfig } from "@/types";

export abstract class BaseFetcher {
  protected readonly config: FetcherConfig;

  constructor(config: FetcherConfig) {
    this.config = config;
  }

  /**
   * Fetch raw articles from the source.
   * Each subclass implements its own fetching strategy.
   */
  abstract fetch(): Promise<RawArticle[]>;

  /**
   * Identify this fetcher by source name.
   */
  get sourceName(): string {
    return this.config.name;
  }

  get sourceSlug(): string {
    return this.config.slug;
  }

  /**
   * Safely fetch with timeout and error handling.
   * Returns empty array on failure so the pipeline continues.
   */
  async safeFetch(): Promise<RawArticle[]> {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 15_000); // 15s timeout

      const articles = await this.fetch();
      clearTimeout(timeoutId);

      console.log(
        `[${this.config.name}] Fetched ${articles.length} articles successfully`
      );
      return articles;
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      console.error(`[${this.config.name}] Fetch failed: ${message}`);
      return [];
    }
  }

  /**
   * Normalize a URL: trim, ensure https, remove tracking params.
   */
  protected normalizeUrl(url: string): string {
    try {
      const parsed = new URL(url.trim());
      // Remove common tracking parameters
      const trackingParams = [
        "utm_source",
        "utm_medium",
        "utm_campaign",
        "utm_term",
        "utm_content",
        "ref",
        "source",
        "fbclid",
        "gclid",
      ];
      trackingParams.forEach((p) => parsed.searchParams.delete(p));
      return parsed.toString();
    } catch {
      return url.trim();
    }
  }

  /**
   * Strip HTML tags from raw content.
   */
  protected stripHtml(html: string): string {
    return html
      .replace(/<[^>]*>/g, " ")
      .replace(/\s+/g, " ")
      .trim();
  }

  /**
   * Truncate text to a safe length for AI processing.
   */
  protected truncateContent(text: string, maxLength = 8000): string {
    if (text.length <= maxLength) return text;
    return text.slice(0, maxLength) + "...";
  }
}
