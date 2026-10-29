/**
 * PULL-IA — Ingestion Pipeline Orchestrator
 *
 * Coordinates the full pipeline:
 * 1. FETCH     → get articles from all sources
 * 2. DEDUPE    → skip already-seen URLs (hash-based)
 * 3. CLASSIFY  → AI categorization + scoring
 * 4. SUMMARIZE → AI bilingual summaries
 * 5. PUBLISH   → save to database
 * 6. RETENTION → 30-day window & 150-article cap
 *
 * Supports gRPC Server-Side Streaming (`StreamSyncProgress`) via optional
 * `onProgress` callback while remaining 100% backwards-compatible.
 */

import { createHash } from "crypto";
import prisma from "@/lib/db/prisma";
import { getAllFetchers } from "@/lib/fetchers/source-registry";
import { ArticleClassifier } from "@/lib/ai/classifier";
import { ArticleSummarizer } from "@/lib/ai/summarizer";
import type { RawArticle, PipelineResult, PipelineError } from "@/types";
import { ArticleStatus } from "@/types";
import {
  SyncStageEnum,
  type SyncProgressEventPayload,
} from "@/lib/grpc/proto-schema";

const FINAL_SCORE_WEIGHTS = {
  relevance: 0.5,  // AI relevance score
  reputation: 0.3, // Source reputation score
  freshness: 0.2,  // Recency bonus
};

export type PipelineProgressCallback = (
  event: SyncProgressEventPayload
) => void | Promise<void>;

export class IngestionPipeline {
  private classifier = new ArticleClassifier();
  private summarizer = new ArticleSummarizer();
  private errors: PipelineError[] = [];

  /**
   * Run the full ingestion pipeline.
   * Emits real-time gRPC `SyncProgressEvent` messages when `onProgress` is provided.
   */
  async run(
    maxBatch = 3,
    onProgress?: PipelineProgressCallback
  ): Promise<PipelineResult> {
    const startTime = Date.now();
    const totalSteps = 5;
    console.log("[Pipeline] Starting ingestion run...");

    const emit = async (
      partial: Omit<SyncProgressEventPayload, "totalSteps" | "elapsedMs">
    ) => {
      if (!onProgress) return;
      await onProgress({
        ...partial,
        totalSteps,
        elapsedMs: Date.now() - startTime,
      });
    };

    await emit({
      step: 1,
      stage: SyncStageEnum.STAGE_INIT,
      stageName: "STAGE_INIT",
      message:
        "Iniciando canal gRPC Server-Side Streaming (NewsPipelineService.StreamSyncProgress)...",
    });

    // Step 1: Fetch from all sources in parallel (with per-source streaming events)
    const rawArticles = await this.fetchAll(async (sourceName, countSoFar) => {
      await emit({
        step: 2,
        stage: SyncStageEnum.STAGE_FETCHING,
        stageName: "STAGE_FETCHING",
        sourceName,
        fetchedCount: countSoFar,
        message: `Fuente sincronizada vía gRPC: ${sourceName} (${countSoFar} artículos recolectados)`,
      });
    });
    console.log(`[Pipeline] Fetched ${rawArticles.length} raw articles`);

    // Step 2: Deduplicate against database
    const newArticles = await this.deduplicate(rawArticles);
    console.log(`[Pipeline] ${newArticles.length} new articles after deduplication`);

    await emit({
      step: 3,
      stage: SyncStageEnum.STAGE_DEDUPLICATING,
      stageName: "STAGE_DEDUPLICATING",
      fetchedCount: rawArticles.length,
      newCandidates: newArticles.length,
      message: `Deduplicación SHA-256 completada: ${rawArticles.length} escaneados → ${newArticles.length} candidatos nuevos`,
    });

    let published = 0;
    let rejected = 0;

    // Process in batches
    const batch = newArticles.slice(0, maxBatch);
    console.log(`[Pipeline] Processing batch of ${batch.length} articles...`);

    if (batch.length === 0) {
      await emit({
        step: 4,
        stage: SyncStageEnum.STAGE_CLASSIFYING,
        stageName: "STAGE_CLASSIFYING",
        fetchedCount: rawArticles.length,
        newCandidates: 0,
        publishedCount: 0,
        message:
          "Todas las noticias de las fuentes ya están sincronizadas en Supabase.",
      });
    }

    // Step 3-5: Process each article in the batch
    for (const article of batch) {
      try {
        const assignedCategory = await this.processArticle(article);
        if (assignedCategory) {
          published++;
          await emit({
            step: 4,
            stage: SyncStageEnum.STAGE_CLASSIFYING,
            stageName: "STAGE_CLASSIFYING",
            sourceName: article.sourceName,
            articleTitle: article.title,
            assignedCategory,
            fetchedCount: rawArticles.length,
            newCandidates: newArticles.length,
            publishedCount: published,
            message: `Clasificado en [${assignedCategory}]: "${article.title.slice(0, 68)}..."`,
          });
        } else {
          rejected++;
        }
        // Small delay between articles to avoid rate limits
        await new Promise((resolve) => setTimeout(resolve, 900));
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

    // Step 6: Manage 30-day retention lifecycle and purge expired/excess articles to free DB space
    const purgedCount = await this.manageRetentionAndPurge();

    await emit({
      step: 5,
      stage: SyncStageEnum.STAGE_RETENTION,
      stageName: "STAGE_RETENTION",
      fetchedCount: rawArticles.length,
      newCandidates: newArticles.length,
      publishedCount: published,
      purgedCount,
      message: `Política de retención 30 días aplicada (${purgedCount} antiguos depurados, máx. 150 en almacenamiento)`,
    });

    const duration = Date.now() - startTime;
    console.log(`[Pipeline] Done in ${duration}ms — published: ${published}, rejected: ${rejected}`);

    await emit({
      step: 5,
      stage: SyncStageEnum.STAGE_COMPLETED,
      stageName: "STAGE_COMPLETED",
      fetchedCount: rawArticles.length,
      newCandidates: newArticles.length,
      publishedCount: published,
      purgedCount,
      message:
        published > 0
          ? `Stream gRPC finalizado en ${(duration / 1000).toFixed(1)}s: ¡${published} nuevas noticias publicadas!`
          : `Stream gRPC finalizado en ${(duration / 1000).toFixed(1)}s: Todo está al día (${rawArticles.length} fuentes verificadas).`,
    });

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

  private async fetchAll(
    onSourceFetched?: (sourceName: string, totalSoFar: number) => Promise<void>
  ): Promise<RawArticle[]> {
    const fetchers = getAllFetchers();
    const articles: RawArticle[] = [];

    await Promise.allSettled(
      fetchers.map(async (fetcher) => {
        const res = await fetcher.safeFetch();
        if (res.length > 0) {
          articles.push(...res);
          if (onSourceFetched) {
            await onSourceFetched(res[0].sourceName, articles.length);
          }
        }
        return res;
      })
    );

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

  private async processArticle(article: RawArticle): Promise<string | null> {
    // Find or create the source in DB.
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
        data: { status: ArticleStatus.REJECTED, rawContent: "" },
      });
      return null;
    }

    // Summarize
    const summary = await this.summarizer.summarize(article);

    // Calculate final score
    const freshness = this.freshnessScore(article.publishedAt);
    const finalScore =
      classification.relevanceScore * FINAL_SCORE_WEIGHTS.relevance +
      source.reputationScore * FINAL_SCORE_WEIGHTS.reputation +
      freshness * FINAL_SCORE_WEIGHTS.freshness;

    // Save summary and mark as published (compact rawContent to save DB storage)
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
        data: {
          status: ArticleStatus.PUBLISHED,
          rawContent: (article.rawContent ?? "").slice(0, 300),
        },
      }),
    ]);

    return classification.category;
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

  /**
   * 3-Tier Retention & Storage Optimization:
   * - Keep published articles up to 30 days (7d Hot Feed + 30d Monthly Searchable Archive).
   * - Hard-delete articles older than 30 days (cascade deletes summaries to free disk space).
   * - Hard-delete rejected/stale articles older than 7 days.
   * - Enforce a maximum cap of 150 stored articles (preserving AI Model Spec sheets).
   */
  private async manageRetentionAndPurge(): Promise<number> {
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const MAX_STORED_ARTICLES = 150;

    // 1. Restore any summarized articles within the 30-day window that were previously hidden
    await prisma.article.updateMany({
      where: {
        status: ArticleStatus.REJECTED,
        summary: { isNot: null },
        publishedAt: { gte: thirtyDaysAgo },
      },
      data: {
        status: ArticleStatus.PUBLISHED,
      },
    });

    // 2. Hard-delete articles older than 30 days (except AI Model Spec cards)
    const expiredDeleted = await prisma.article.deleteMany({
      where: {
        publishedAt: { lt: thirtyDaysAgo },
        aiModelSpec: { is: null },
      },
    });

    // 3. Hard-delete rejected or stuck processing articles older than 7 days
    const rejectedDeleted = await prisma.article.deleteMany({
      where: {
        status: { in: [ArticleStatus.REJECTED, ArticleStatus.PROCESSING] },
        fetchedAt: { lt: sevenDaysAgo },
        aiModelSpec: { is: null },
      },
    });

    // 4. Enforce maximum capacity cap (keep newest 150 articles, purge oldest excess)
    let excessDeletedCount = 0;
    const overflowArticles = await prisma.article.findMany({
      where: {
        status: ArticleStatus.PUBLISHED,
        aiModelSpec: { is: null },
      },
      orderBy: [{ publishedAt: "desc" }, { createdAt: "desc" }],
      skip: MAX_STORED_ARTICLES,
      select: { id: true },
    });

    if (overflowArticles.length > 0) {
      const overflowRes = await prisma.article.deleteMany({
        where: { id: { in: overflowArticles.map((a) => a.id) } },
      });
      excessDeletedCount = overflowRes.count;
    }

    const totalPurged = expiredDeleted.count + rejectedDeleted.count + excessDeletedCount;
    if (totalPurged > 0) {
      console.log(
        `[Pipeline] Purged ${totalPurged} articles from DB (expired >30d: ${expiredDeleted.count}, old rejected: ${rejectedDeleted.count}, overflow >${MAX_STORED_ARTICLES}: ${excessDeletedCount})`
      );
    }
    return totalPurged;
  }
}
