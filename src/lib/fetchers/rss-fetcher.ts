/**
 * PULL-IA — RSS Fetcher
 *
 * Parses any RSS/Atom feed and returns normalized RawArticles.
 * Used for: TechCrunch, The Verge, Wired, arXiv, Anthropic, OpenAI blogs.
 */

import { BaseFetcher } from "./base-fetcher";
import type { RawArticle, FetcherConfig } from "@/types";

interface RssItem {
  title?: string;
  link?: string;
  description?: string;
  content?: string;
  author?: string;
  pubDate?: string;
  enclosure?: { url?: string };
  "media:content"?: { "@_url"?: string };
}

export class RssFetcher extends BaseFetcher {
  constructor(config: FetcherConfig) {
    super(config);
  }

  async fetch(): Promise<RawArticle[]> {
    const feedUrl = this.config.feedUrl ?? this.config.url;

    const response = await fetch(feedUrl, {
      headers: {
        "User-Agent":
          "PULL-IA/1.0 (+https://pull-ia.com; Tech news aggregator)",
        Accept: "application/rss+xml, application/xml, text/xml",
      },
      next: { revalidate: 0 }, // always fresh
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status} from ${feedUrl}`);
    }

    const xml = await response.text();
    const items = this.parseRssXml(xml);

    return items
      .filter((item) => item.title && item.link)
      .slice(0, 30) // max 30 per fetch
      .map((item) => ({
        title: this.stripHtml(item.title ?? ""),
        url: this.normalizeUrl(item.link ?? ""),
        rawContent: this.truncateContent(
          this.stripHtml(item.content ?? item.description ?? "")
        ),
        author: item.author,
        imageUrl: item.enclosure?.url ?? item["media:content"]?.["@_url"],
        publishedAt: item.pubDate ? new Date(item.pubDate) : undefined,
        sourceName: this.config.name,
        sourceUrl: this.config.url,
      }));
  }

  /**
   * Minimal XML parser for RSS/Atom feeds.
   * Uses regex for performance — a full XML parser is overkill for RSS.
   */
  private parseRssXml(xml: string): RssItem[] {
    const items: RssItem[] = [];

    // Handle both RSS <item> and Atom <entry> formats
    const itemRegex = /<(?:item|entry)>([\s\S]*?)<\/(?:item|entry)>/g;
    let match: RegExpExecArray | null;

    while ((match = itemRegex.exec(xml)) !== null) {
      const block = match[1];

      const item: RssItem = {
        title: this.extractTag(block, "title"),
        link:
          this.extractTag(block, "link") ??
          this.extractAttrFromTag(block, "link", "href"),
        description: this.extractTag(block, "description"),
        content:
          this.extractTag(block, "content:encoded") ??
          this.extractTag(block, "content"),
        author:
          this.extractTag(block, "author") ??
          this.extractTag(block, "dc:creator"),
        pubDate:
          this.extractTag(block, "pubDate") ??
          this.extractTag(block, "published") ??
          this.extractTag(block, "updated"),
      };

      items.push(item);
    }

    return items;
  }

  private extractTag(xml: string, tag: string): string | undefined {
    const match = xml.match(
      new RegExp(`<${tag}[^>]*>(?:<!\\[CDATA\\[)?([\\s\\S]*?)(?:\\]\\]>)?<\\/${tag}>`, "i")
    );
    return match ? match[1].trim() || undefined : undefined;
  }

  private extractAttrFromTag(
    xml: string,
    tag: string,
    attr: string
  ): string | undefined {
    const match = xml.match(
      new RegExp(`<${tag}[^>]*${attr}="([^"]+)"`, "i")
    );
    return match ? match[1] : undefined;
  }
}
