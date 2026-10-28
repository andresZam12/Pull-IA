import prisma from "@/lib/db/prisma";
import { ArticleStatus } from "@/types";
import { NewsFeed } from "@/components/news/NewsFeed";
import { LanguageProvider } from "@/context/LanguageContext";
import type { ArticleItem } from "@/components/news/NewsCard";

// Revalidate page data every 60 seconds (Incremental Static Regeneration)
export const revalidate = 60;

export default async function HomePage() {
  let articles: ArticleItem[] = [];

  // 1. Try fetching from Pull-IA-back API if BACKEND_URL or NEXT_PUBLIC_BACKEND_URL is set
  const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || process.env.BACKEND_URL;

  if (backendUrl) {
    try {
      const res = await fetch(`${backendUrl}/api/articles?limit=40`, {
        next: { revalidate: 60 },
      });
      if (res.ok) {
        const data = await res.json();
        if (data.success && Array.isArray(data.articles)) {
          articles = data.articles;
        }
      }
    } catch (apiErr) {
      console.warn("[HomePage] Could not reach external backend API, checking database:", apiErr);
    }
  }

  // 2. Direct database query fallback
  if (articles.length === 0) {
    try {
      const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
      const rawArticles = await prisma.article.findMany({
        where: {
          status: ArticleStatus.PUBLISHED,
          publishedAt: {
            gte: oneWeekAgo,
          },
        },
        include: {
          source: true,
          summary: true,
          aiModelSpec: true,
        },
        orderBy: [
          { publishedAt: "desc" },
          { createdAt: "desc" },
        ],
        take: 40,
      });

      // Transform data to match NewsCard interface
      articles = rawArticles.map((a) => ({
        id: a.id,
        url: a.url,
        sourceName: a.source.name,
        sourceUrl: a.source.url,
        imageUrl: a.imageUrl,
        publishedAt: (a.publishedAt ?? a.fetchedAt).toISOString(),
        summary: a.summary
          ? {
              titleEs: a.summary.titleEs,
              titleEn: a.summary.titleEn,
              summaryEs: a.summary.summaryEs,
              summaryEn: a.summary.summaryEn,
              category: a.summary.category,
              keyPoints: a.summary.keyPoints,
              relevanceScore: a.summary.relevanceScore,
              aiModel: a.summary.aiModel,
            }
          : null,
        aiModelSpec: a.aiModelSpec
          ? {
              modelName: a.aiModelSpec.name,
              provider: a.aiModelSpec.provider,
              licenseType: a.aiModelSpec.licenseType,
              contextWindowTokens: a.aiModelSpec.contextWindowTokens,
              avgLatencyMs: a.aiModelSpec.avgLatencyMs || undefined,
              costInputPerM: a.aiModelSpec.costInputPerM,
              costOutputPerM: a.aiModelSpec.costOutputPerM,
              mmluScore: a.aiModelSpec.mmluScore || undefined,
              tokensPerSecond: a.aiModelSpec.tokensPerSecond || undefined,
              technicalAdvantages: a.aiModelSpec.technicalAdvantages,
              criticalLimitations: a.aiModelSpec.criticalLimitations,
              idealArchitecturalUsecases: a.aiModelSpec.idealArchitecturalUsecases,
            }
          : null,
      }));
    } catch (error) {
      console.error("[HomePage] Error loading articles from database:", error);
    }
  }

  return (
    <LanguageProvider>
      <NewsFeed initialArticles={articles} />
    </LanguageProvider>
  );
}
