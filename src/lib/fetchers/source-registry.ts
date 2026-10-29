/**
 * PULL-IA — Source Registry
 *
 * Central registry of all configured news sources.
 * Adding a new source only requires adding an entry here.
 */

import { RssFetcher } from "./rss-fetcher";
import { HackerNewsFetcher } from "./hackernews-fetcher";
import { DevtoFetcher } from "./devto-fetcher";
import { BaseFetcher } from "./base-fetcher";
import { SourceType, Category } from "@/types";

/**
 * Returns all active fetcher instances.
 * Each fetcher knows its own config (name, url, categories, reputation).
 */
export function getAllFetchers(): BaseFetcher[] {
  return [
    // ── Official Tech Company Blogs ──────────────────────
    new RssFetcher({
      name: "Anthropic Blog",
      slug: "anthropic-blog",
      url: "https://www.anthropic.com",
      feedUrl: "https://www.anthropic.com/rss.xml",
      type: SourceType.RSS,
      categories: [Category.AI],
      language: "en",
      reputationScore: 0.95,
    }),
    new RssFetcher({
      name: "OpenAI Blog",
      slug: "openai-blog",
      url: "https://openai.com",
      feedUrl: "https://openai.com/blog/rss.xml",
      type: SourceType.RSS,
      categories: [Category.AI],
      language: "en",
      reputationScore: 0.95,
    }),
    new RssFetcher({
      name: "Google AI Blog",
      slug: "google-ai-blog",
      url: "https://blog.google/technology/ai",
      feedUrl: "https://blog.google/technology/ai/rss",
      type: SourceType.RSS,
      categories: [Category.AI, Category.ENGINEERING],
      language: "en",
      reputationScore: 0.9,
    }),
    new RssFetcher({
      name: "Apple Newsroom",
      slug: "apple-newsroom",
      url: "https://www.apple.com/newsroom",
      feedUrl: "https://www.apple.com/newsroom/rss-feed.rss",
      type: SourceType.RSS,
      categories: [Category.ENGINEERING, Category.AI],
      language: "en",
      reputationScore: 0.9,
    }),

    // ── Major Tech Publications ──────────────────────────
    new RssFetcher({
      name: "TechCrunch",
      slug: "techcrunch",
      url: "https://techcrunch.com",
      feedUrl: "https://techcrunch.com/feed",
      type: SourceType.RSS,
      categories: [Category.AI, Category.ENGINEERING, Category.EMPLOYABILITY],
      language: "en",
      reputationScore: 0.85,
    }),
    new RssFetcher({
      name: "The Verge",
      slug: "the-verge",
      url: "https://www.theverge.com",
      feedUrl: "https://www.theverge.com/rss/index.xml",
      type: SourceType.RSS,
      categories: [Category.AI, Category.ENGINEERING],
      language: "en",
      reputationScore: 0.85,
    }),
    new RssFetcher({
      name: "Wired",
      slug: "wired",
      url: "https://www.wired.com",
      feedUrl: "https://www.wired.com/feed/rss",
      type: SourceType.RSS,
      categories: [Category.AI, Category.ENGINEERING, Category.PROGRAMMING],
      language: "en",
      reputationScore: 0.88,
    }),
    new RssFetcher({
      name: "Ars Technica",
      slug: "ars-technica",
      url: "https://arstechnica.com",
      feedUrl: "https://feeds.arstechnica.com/arstechnica/index",
      type: SourceType.RSS,
      categories: [Category.ENGINEERING, Category.AI, Category.PROGRAMMING],
      language: "en",
      reputationScore: 0.87,
    }),

    // ── AI Research & Academic ──────────────────────────
    new RssFetcher({
      name: "arXiv CS.AI",
      slug: "arxiv-cs-ai",
      url: "https://arxiv.org",
      feedUrl: "https://rss.arxiv.org/rss/cs.AI",
      type: SourceType.RSS,
      categories: [Category.AI],
      language: "en",
      reputationScore: 0.95,
    }),
    new RssFetcher({
      name: "arXiv CS.SE",
      slug: "arxiv-cs-se",
      url: "https://arxiv.org",
      feedUrl: "https://rss.arxiv.org/rss/cs.SE",
      type: SourceType.RSS,
      categories: [Category.ENGINEERING, Category.PROGRAMMING],
      language: "en",
      reputationScore: 0.95,
    }),
    new RssFetcher({
      name: "MIT Technology Review",
      slug: "mit-technology-review",
      url: "https://www.technologyreview.com",
      feedUrl: "https://www.technologyreview.com/feed/",
      type: SourceType.RSS,
      categories: [Category.AI, Category.EMPLOYABILITY],
      language: "en",
      reputationScore: 0.95,
    }),

    // ── Major Engineering & Infrastructure Blogs ─────────
    new RssFetcher({
      name: "GitHub Engineering",
      slug: "github-engineering",
      url: "https://github.blog/category/engineering/",
      feedUrl: "https://github.blog/category/engineering/feed/",
      type: SourceType.RSS,
      categories: [Category.PROGRAMMING, Category.ENGINEERING],
      language: "en",
      reputationScore: 0.96,
    }),
    new RssFetcher({
      name: "AWS News Blog",
      slug: "aws-news-blog",
      url: "https://aws.amazon.com/blogs/aws/",
      feedUrl: "https://aws.amazon.com/blogs/aws/feed/",
      type: SourceType.RSS,
      categories: [Category.ENGINEERING],
      language: "en",
      reputationScore: 0.94,
    }),
    new RssFetcher({
      name: "Meta Engineering",
      slug: "meta-engineering",
      url: "https://engineering.fb.com",
      feedUrl: "https://engineering.fb.com/feed/",
      type: SourceType.RSS,
      categories: [Category.ENGINEERING, Category.AI],
      language: "en",
      reputationScore: 0.93,
    }),
    new RssFetcher({
      name: "Microsoft Azure Blog",
      slug: "microsoft-azure-blog",
      url: "https://azure.microsoft.com/en-us/blog/",
      feedUrl: "https://azure.microsoft.com/en-us/blog/feed/",
      type: SourceType.RSS,
      categories: [Category.ENGINEERING, Category.PROGRAMMING],
      language: "en",
      reputationScore: 0.93,
    }),

    // ── Cybersecurity & Vulnerabilities ─────────────────
    new RssFetcher({
      name: "The Hacker News",
      slug: "the-hacker-news",
      url: "https://thehackernews.com",
      feedUrl: "https://feeds.feedburner.com/TheHackersNews",
      type: SourceType.RSS,
      categories: [Category.ENGINEERING, Category.PROGRAMMING],
      language: "en",
      reputationScore: 0.95,
    }),
    new RssFetcher({
      name: "BleepingComputer",
      slug: "bleeping-computer",
      url: "https://www.bleepingcomputer.com",
      feedUrl: "https://www.bleepingcomputer.com/feed/",
      type: SourceType.RSS,
      categories: [Category.ENGINEERING],
      language: "en",
      reputationScore: 0.93,
    }),
    new RssFetcher({
      name: "SecurityWeek",
      slug: "securityweek",
      url: "https://www.securityweek.com",
      feedUrl: "https://www.securityweek.com/feed/",
      type: SourceType.RSS,
      categories: [Category.ENGINEERING, Category.PROGRAMMING],
      language: "en",
      reputationScore: 0.92,
    }),

    // ── AI Agents & Frontier Research ────────────────────
    new RssFetcher({
      name: "Hugging Face Blog",
      slug: "huggingface-blog",
      url: "https://huggingface.co/blog",
      feedUrl: "https://huggingface.co/blog/feed.xml",
      type: SourceType.RSS,
      categories: [Category.AI, Category.PROGRAMMING],
      language: "en",
      reputationScore: 0.96,
    }),
    new RssFetcher({
      name: "MarkTechPost AI",
      slug: "marktechpost-ai",
      url: "https://www.marktechpost.com",
      feedUrl: "https://www.marktechpost.com/feed/",
      type: SourceType.RSS,
      categories: [Category.AI],
      language: "en",
      reputationScore: 0.90,
    }),
    new RssFetcher({
      name: "Simon Willison Weblog",
      slug: "simon-willison",
      url: "https://simonwillison.net",
      feedUrl: "https://simonwillison.net/atom/everything/",
      type: SourceType.RSS,
      categories: [Category.AI, Category.PROGRAMMING],
      language: "en",
      reputationScore: 0.94,
    }),

    // ── Tech Markets, Software Business & Big Tech ───────
    new RssFetcher({
      name: "ZDNet Tech & Enterprise",
      slug: "zdnet-tech",
      url: "https://www.zdnet.com",
      feedUrl: "https://www.zdnet.com/news/rss.xml",
      type: SourceType.RSS,
      categories: [Category.EMPLOYABILITY, Category.ENGINEERING],
      language: "en",
      reputationScore: 0.91,
    }),
    new RssFetcher({
      name: "New York Times Tech",
      slug: "nyt-tech",
      url: "https://www.nytimes.com/section/technology",
      feedUrl: "https://rss.nytimes.com/services/xml/rss/nyt/Technology.xml",
      type: SourceType.RSS,
      categories: [Category.EMPLOYABILITY, Category.AI],
      language: "en",
      reputationScore: 0.94,
    }),
    new RssFetcher({
      name: "CNBC Tech & Markets",
      slug: "cnbc-tech-markets",
      url: "https://www.cnbc.com/technology/",
      feedUrl: "https://search.cnbc.com/rs/search/combinedcms/view.xml?partnerId=wrss01&id=19854910",
      type: SourceType.RSS,
      categories: [Category.EMPLOYABILITY],
      language: "en",
      reputationScore: 0.93,
    }),
    new RssFetcher({
      name: "Stack Overflow Blog",
      slug: "stackoverflow-blog",
      url: "https://stackoverflow.blog",
      feedUrl: "https://stackoverflow.blog/feed/",
      type: SourceType.RSS,
      categories: [Category.EMPLOYABILITY, Category.ENGINEERING],
      language: "en",
      reputationScore: 0.92,
    }),

    // ── Developer Communities ────────────────────────────
    new HackerNewsFetcher(),
    new DevtoFetcher(),
  ];
}

/**
 * Get the config objects for seeding the database sources table.
 */
export function getSourceConfigs() {
  return getAllFetchers().map((f) => f.sourceConfig);
}
