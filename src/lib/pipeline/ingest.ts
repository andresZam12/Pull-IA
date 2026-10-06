/**
 * PULL-IA — Ingestion Pipeline Orchestrator
 *
 * Coordinates the full pipeline:
 * 1. FETCH    → get articles from all sources
 * 2. DEDUPE   → skip already-seen URLs (hash-based)
 * 3. CLASSIFY → AI categorization + scoring
 * 4. SUMMARIZE → AI bilingual summaries
 * 5. PUBLISH  → save to database
 *
 * Designed to run as a Vercel Cron job every 2 hours.
 */

import { createHash } from "crypto";
import prisma from "@/lib/db/prisma";
import { getAllFetchers } from "@/lib/fetchers/source-registry";
import { ArticleClassifier } from "@/lib/ai/classifier";
import { ArticleSummarizer } from "@/lib/ai/summarizer";
import type { RawArticle, PipelineResult, PipelineError } from "@/types";
import { ArticleStatus } from "@/types";

const FINAL_SCORE_WEIGHTS = {
  relevance: 0.5,  // AI relevance score
  reputation: 0.3, // Source reputation score
  freshness: 0.2,  // Recency bonus
};

export class IngestionPipeline {
  private classifier = new ArticleClassifier();
  private summarizer = new ArticleSummarizer();
  private errors: PipelineError[] = [];

  /**
   * Run the full ingestion pipeline.
   * Returns a summary of what happened.
   */
  async run(): Promise<PipelineResult> {
    const startTime = Date.now();
    console.log("[Pipeline] Starting ingestion run...");

    // Step 1: Fetch from all sources in parallel
    const rawArticles = await this.fetchAll();
    console.log(`[Pipeline] Fetched ${rawArticles.length} raw articles`);

    // Step 2: Deduplicate against database
    const newArticles = await this.deduplicate(rawArticles);
    console.log(`[Pipeline] ${newArticles.length} new articles after deduplication`);

    let published = 0;
    let rejected = 0;

    // Process in small batches of 5 articles with delay to respect Gemini free-tier rate limits (15 RPM)
    const batch = newArticles.slice(0, 5);
    console.log(`[Pipeline] Processing batch of ${batch.length} articles...`);

    // Step 3-5: Process each article in the batch
    for (const article of batch) {
      try {
        await this.processArticle(article);
        published++;
        // Small delay between articles to avoid rate limits
        await new Promise((resolve) => setTimeout(resolve, 1500));
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        this.errors.push({
          source: article.sourceName,
          message,
          timestamp: new Date(),
        });
        rejected++;
      }
    }

    const duration = Date.now() - startTime;
    console.log(`[Pipeline] Done in ${duration}ms — published: ${published}, rejected: ${rejected}`);

    return {
      fetched: rawArticles.length,
      deduplicated: rawArticles.length - newArticles.length,
      classified: newArticles.length,
      published,
      rejected,
      errors: this.errors,
      duration,
    };
  }

  // ─────────────────────────────────────────────
  // STEP 1: FETCH
  // ─────────────────────────────────────────────

  private async fetchAll(): Promise<RawArticle[]> {
    const fetchers = getAllFetchers();
    const results = await Promise.allSettled(
      fetchers.map((fetcher) => fetcher.safeFetch())
    );

    const articles: RawArticle[] = [];
    for (const result of results) {
      if (result.status === "fulfilled") {
        articles.push(...result.value);
      }
    }
    return articles;
  }

  // ─────────────────────────────────────────────
  // STEP 2: DEDUPLICATE
  // ─────────────────────────────────────────────

  private async deduplicate(articles: RawArticle[]): Promise<RawArticle[]> {
    // Compute URL hashes for incoming articles
    const hashes = articles.map((a) => this.hashUrl(a.url));

    // Check which hashes already exist in DB
    const existing = await prisma.article.findMany({
      where: { urlHash: { in: hashes } },
      select: { urlHash: true },
    });

    const existingHashes = new Set(existing.map((a) => a.urlHash));

    // Also deduplicate within the batch (same source may return same URL twice)
    const seenInBatch = new Set<string>();

    return articles.filter((article) => {
      const hash = this.hashUrl(article.url);
      if (existingHashes.has(hash) || seenInBatch.has(hash)) return false;
      seenInBatch.add(hash);
      return true;
    });
  }

  // ─────────────────────────────────────────────
  // STEP 3-5: CLASSIFY + SUMMARIZE + PUBLISH
  // ─────────────────────────────────────────────

  private async processArticle(article: RawArticle): Promise<void> {
    // Find or create the source in DB.
    // We match by `name` (unique) because the seed already saved each source
    // with its official slug (e.g. "devto"), which slugify() would not reproduce.
    const source = await prisma.source.upsert({
      where: { name: article.sourceName },
      update: { lastFetchedAt: new Date() },
      create: {
        name: article.sourceName,
        slug: this.slugify(article.sourceName),
        url: article.sourceUrl,
        type: "RSS",
        language: "en",
        reputationScore: 0.7,
        lastFetchedAt: new Date(),
      },
    });

    // Save raw article with PROCESSING status
    const saved = await prisma.article.create({
      data: {
        title: article.title,
        url: article.url,
        urlHash: this.hashUrl(article.url),
        rawContent: article.rawContent,
        author: article.author,
        imageUrl: article.imageUrl,
        publishedAt: article.publishedAt,
        status: ArticleStatus.PROCESSING,
        sourceId: source.id,
      },
    });

    // Classify
    const classification = await this.classifier.classify(article);

    if (!classification || !classification.isRelevant) {
      await prisma.article.update({
        where: { id: saved.id },
        data: { status: ArticleStatus.REJECTED },
      });
      return;
    }

    // Summarize
    const summary = await this.summarizer.summarize(article);

    // Calculate final score
    const freshness = this.freshnessScore(article.publishedAt);
    const finalScore =
      classification.relevanceScore * FINAL_SCORE_WEIGHTS.relevance +
      source.reputationScore * FINAL_SCORE_WEIGHTS.reputation +
      freshness * FINAL_SCORE_WEIGHTS.freshness;

    // Save summary and mark as published
    await prisma.$transaction([
      prisma.articleSummary.create({
        data: {
          articleId: saved.id,
          summaryEs: summary.summaryEs,
          summaryEn: summary.summaryEn,
          titleEs: summary.titleEs,
          titleEn: summary.titleEn,
          category: classification.category,
          relevanceScore: classification.relevanceScore,
          finalScore,
          keyPoints: summary.keyPoints,
          sourceUrls: summary.sourceUrls,
          aiModel: summary.aiModel,
        },
      }),
      prisma.article.update({
        where: { id: saved.id },
        data: { status: ArticleStatus.PUBLISHED },
      }),
    ]);
  }

  // ─────────────────────────────────────────────
  // HELPERS
  // ─────────────────────────────────────────────

  private hashUrl(url: string): string {
    return createHash("sha256").update(url.toLowerCase().trim()).digest("hex");
  }

  private slugify(name: string): string {
    return name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
  }

  private freshnessScore(publishedAt?: Date): number {
    if (!publishedAt) return 0.5;
    const ageHours = (Date.now() - publishedAt.getTime()) / (1000 * 60 * 60);
    if (ageHours < 2) return 1.0;
    if (ageHours < 6) return 0.9;
    if (ageHours < 24) return 0.75;
    if (ageHours < 48) return 0.5;
    return 0.25;
  }
}
