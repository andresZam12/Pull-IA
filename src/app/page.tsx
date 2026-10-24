import prisma from "@/lib/db/prisma";
import { ArticleStatus } from "@/types";
import { NewsFeed } from "@/components/news/NewsFeed";
import { LanguageProvider } from "@/context/LanguageContext";
import type { ArticleItem } from "@/components/news/NewsCard";

// Revalidate page data every 60 seconds (Incremental Static Regeneration)
export const revalidate = 60;

export default async function HomePage() {
  let articles: ArticleItem[] = [];

  try {
    // Fetch published articles with their AI summaries and sources
    const rawArticles = await prisma.article.findMany({
      where: {
        status: ArticleStatus.PUBLISHED,
      },
      include: {
        source: true,
        summary: true,
      },
      orderBy: {
        fetchedAt: "desc",
      },
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
    }));
  } catch (error) {
    console.error("[HomePage] Error loading articles from database:", error);
  }

  return (
    <LanguageProvider>
      <NewsFeed initialArticles={articles} />
    </LanguageProvider>
  );
}
