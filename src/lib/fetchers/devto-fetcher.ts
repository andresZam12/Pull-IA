/**
 * PULL-IA — Dev.to Fetcher
 *
 * Uses the official Dev.to public API (no key required for read).
 * Fetches top articles filtered by tag and minimum reactions.
 * Docs: https://developers.forem.com/api
 */

import { BaseFetcher } from "./base-fetcher";
import type { RawArticle, FetcherConfig } from "@/types";
import { SourceType, Category } from "@/types";

const DEVTO_API = "https://dev.to/api";
const MIN_REACTIONS = 20;
const TARGET_TAGS = ["ai", "machinelearning", "programming", "devops", "career", "webdev"];

interface DevtoArticle {
  id: number;
  title: string;
  url: string;
  description: string;
  body_markdown?: string;
  user: { name: string; username: string };
  published_timestamp: string;
  positive_reactions_count: number;
  cover_image?: string;
  tag_list: string[];
}

export class DevtoFetcher extends BaseFetcher {
  constructor() {
    super({
      name: "Dev.to",
      slug: "devto",
      url: "https://dev.to",
      type: SourceType.API,
      categories: [Category.PROGRAMMING, Category.ENGINEERING, Category.EMPLOYABILITY],
      language: "en",
      reputationScore: 0.7,
    });
  }

  async fetch(): Promise<RawArticle[]> {
    const apiKey = process.env.DEVTO_API_KEY;

    const headers: Record<string, string> = {
      "User-Agent": "PULL-IA/1.0",
      Accept: "application/json",
    };
    if (apiKey) headers["api-key"] = apiKey;

    // Fetch articles for each target tag in parallel
    const tagResults = await Promise.allSettled(
      TARGET_TAGS.map((tag) =>
        fetch(`${DEVTO_API}/articles?tag=${tag}&per_page=10&top=7`, {
          headers,
        }).then((r) => r.json() as Promise<DevtoArticle[]>)
      )
    );

    const allArticles: DevtoArticle[] = [];
    for (const result of tagResults) {
      if (result.status === "fulfilled" && Array.isArray(result.value)) {
        allArticles.push(...result.value);
      }
    }

    // Deduplicate by ID, filter by reactions
    const seen = new Set<number>();
    const filtered = allArticles
      .filter((a) => {
        if (seen.has(a.id)) return false;
        seen.add(a.id);
        return a.positive_reactions_count >= MIN_REACTIONS;
      })
      .sort((a, b) => b.positive_reactions_count - a.positive_reactions_count)
      .slice(0, 20);

    return filtered.map((article) => ({
      title: article.title,
      url: this.normalizeUrl(article.url),
      rawContent: this.truncateContent(article.description ?? ""),
      author: article.user.name,
      imageUrl: article.cover_image ?? undefined,
      publishedAt: new Date(article.published_timestamp),
      sourceName: this.config.name,
      sourceUrl: this.config.url,
    }));
  }
}
