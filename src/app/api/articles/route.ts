import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db/prisma";
import { ArticleStatus, Category } from "@/types";

export const dynamic = "force-dynamic";

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization",
    },
  });
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get("category");
    const search = searchParams.get("search");
    const days = Math.min(Math.max(Number(searchParams.get("days") || 30), 1), 30);
    const limit = Math.min(Number(searchParams.get("limit") || 100), 150);

    const cutoffDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

    const whereClause: any = {
      status: ArticleStatus.PUBLISHED,
      OR: [
        { publishedAt: { gte: cutoffDate } },
        { aiModelSpec: { isNot: null } },
      ],
    };

    if (category && category !== "ALL" && Object.values(Category).includes(category as Category)) {
      whereClause.summary = {
        category: category as Category,
      };
    }

    const rawArticles = await prisma.article.findMany({
      where: whereClause,
      include: {
        source: {
          select: { name: true, url: true, slug: true },
        },
        summary: true,
        aiModelSpec: true,
      },
      orderBy: [
        { publishedAt: "desc" },
        { createdAt: "desc" },
      ],
      take: limit,
    });

    let articles = rawArticles.map((a) => ({
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

    // Optional search filter if provided via query param
    if (search && search.trim()) {
      const q = search.toLowerCase().trim();
      articles = articles.filter((art) => {
        const titleEs = art.summary?.titleEs.toLowerCase() || "";
        const titleEn = art.summary?.titleEn.toLowerCase() || "";
        const summaryEs = art.summary?.summaryEs.toLowerCase() || "";
        const summaryEn = art.summary?.summaryEn.toLowerCase() || "";
        return (
          titleEs.includes(q) ||
          titleEn.includes(q) ||
          summaryEs.includes(q) ||
          summaryEn.includes(q) ||
          art.sourceName.toLowerCase().includes(q)
        );
      });
    }

    return NextResponse.json(
      {
        success: true,
        total: articles.length,
        articles,
      },
      {
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods": "GET, OPTIONS",
          "Access-Control-Allow-Headers": "Content-Type, Authorization",
        },
      }
    );
  } catch (error) {
    console.error("[API Articles] Error fetching articles from Supabase:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch articles from database" },
      {
        status: 500,
        headers: {
          "Access-Control-Allow-Origin": "*",
        },
      }
    );
  }
}
