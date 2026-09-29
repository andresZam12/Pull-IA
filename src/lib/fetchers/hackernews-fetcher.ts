/**
 * PULL-IA — Hacker News Fetcher
 *
 * Uses the official HN Firebase API (free, no key required).
 * Fetches top stories filtered by minimum score threshold.
 * Docs: https://github.com/HackerNews/API
 */

import { BaseFetcher } from "./base-fetcher";
import type { RawArticle, FetcherConfig } from "@/types";
import { SourceType, Category } from "@/types";

const HN_API_BASE = "https://hacker-news.firebaseio.com/v0";
const MIN_SCORE = 50; // only stories with 50+ upvotes
const MAX_STORIES = 30;

interface HNStory {
  id: number;
  title: string;
  url?: string; // external link (may be absent for "Ask HN")
  score: number;
  by: string;
  time: number; // Unix timestamp
  text?: string; // for "Ask HN" posts
  descendants?: number;
  type: string;
}

export class HackerNewsFetcher extends BaseFetcher {
  constructor() {
    super({
      name: "Hacker News",
      slug: "hacker-news",
      url: "https://news.ycombinator.com",
      type: SourceType.API,
      categories: [Category.PROGRAMMING, Category.ENGINEERING, Category.AI],
      language: "en",
      reputationScore: 0.85,
    });
  }

  async fetch(): Promise<RawArticle[]> {
    // Fetch top story IDs
    const topIdsRes = await fetch(`${HN_API_BASE}/topstories.json`);
    if (!topIdsRes.ok) throw new Error("Failed to fetch HN top stories");

    const allIds: number[] = await topIdsRes.json();
    const topIds = allIds.slice(0, 100); // check top 100 to find 30 with min score

    // Fetch story details in parallel (batches of 10)
    const stories = await this.fetchStoriesInBatches(topIds, 10);

    // Filter: external links only, above score threshold
    const filtered = stories
      .filter(
        (s) =>
          s.url &&
          s.score >= MIN_SCORE &&
          s.type === "story" &&
          !s.url.includes("ycombinator.com")
      )
      .sort((a, b) => b.score - a.score)
      .slice(0, MAX_STORIES);

    return filtered.map((story) => ({
      title: story.title,
      url: this.normalizeUrl(story.url!),
      rawContent: story.text ? this.stripHtml(story.text) : undefined,
      author: story.by,
      publishedAt: new Date(story.time * 1000),
      sourceName: this.config.name,
      sourceUrl: this.config.url,
    }));
  }

  private async fetchStoriesInBatches(
    ids: number[],
    batchSize: number
  ): Promise<HNStory[]> {
    const results: HNStory[] = [];

    for (let i = 0; i < ids.length; i += batchSize) {
      const batch = ids.slice(i, i + batchSize);
      const batchResults = await Promise.allSettled(
        batch.map((id) =>
          fetch(`${HN_API_BASE}/item/${id}.json`).then((r) => r.json())
        )
      );

      for (const result of batchResults) {
        if (result.status === "fulfilled" && result.value) {
          results.push(result.value as HNStory);
        }
      }

      // Respect HN API rate limits
      if (i + batchSize < ids.length) {
        await new Promise((resolve) => setTimeout(resolve, 200));
      }
    }

    return results;
  }
}
