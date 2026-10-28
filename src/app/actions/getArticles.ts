"use server";

import prisma from "@/lib/db/prisma";
import { ArticleStatus, Category } from "@/types";

export interface GetArticlesParams {
  category?: Category | "ALL" | string;
  cursor?: string;
  limit?: number;
  searchQuery?: string;
}

export async function getArticlesAction({
  category = "ALL",
  cursor,
  limit = 12,
  searchQuery,
}: GetArticlesParams) {
  try {
    const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

    const whereClause: any = {
      status: ArticleStatus.PUBLISHED,
      publishedAt: {
        gte: oneWeekAgo,
      },
    };

    if (category && category !== "ALL") {
      whereClause.summary = {
        category: category as Category,
      };
    }

    if (searchQuery && searchQuery.trim()) {
      const q = searchQuery.trim();
      whereClause.OR = [
        { title: { contains: q, mode: "insensitive" } },
        {
          summary: {
            titleEs: { contains: q, mode: "insensitive" },
          },
        },
        {
          summary: {
            summaryEs: { contains: q, mode: "insensitive" },
          },
        },
      ];
    }

    const items = await prisma.article.findMany({
      where: whereClause,
      take: limit + 1,
      cursor: cursor ? { id: cursor } : undefined,
      skip: cursor ? 1 : 0,
      orderBy: [
        { publishedAt: "desc" },
        { id: "desc" },
      ],
      include: {
        source: {
          select: { name: true, url: true, slug: true },
        },
        summary: true,
        aiModelSpec: true,
      },
    });

    const hasNextPage = items.length > limit;
    const articles = hasNextPage ? items.slice(0, -1) : items;
    const nextCursor = hasNextPage ? articles[articles.length - 1].id : null;

    return {
      success: true,
      articles: articles.map((a) => ({
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
        aiModelSpec: a.aiModelSpec || null,
      })),
      nextCursor,
      hasNextPage,
    };
  } catch (error) {
    console.error("[getArticlesAction] Error fetching paginated articles:", error);
    return {
      success: false,
      articles: [],
      nextCursor: null,
      hasNextPage: false,
    };
  }
}
