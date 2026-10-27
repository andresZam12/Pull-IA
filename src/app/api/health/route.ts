import { NextResponse } from "next/server";
import prisma from "@/lib/db/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const totalArticles = await prisma.article.count();
    const publishedArticles = await prisma.article.count({
      where: { status: "PUBLISHED" },
    });
    const sourcesCount = await prisma.source.count();

    return NextResponse.json(
      {
        status: "healthy",
        engine: "PULL-IA Backend Intelligence Core",
        database: "Supabase PostgreSQL (Connected)",
        timestamp: new Date().toISOString(),
        metrics: {
          totalArticles,
          publishedArticles,
          sourcesCount,
        },
      },
      {
        headers: {
          "Access-Control-Allow-Origin": "*",
        },
      }
    );
  } catch (error) {
    return NextResponse.json(
      {
        status: "degraded",
        engine: "PULL-IA Backend Intelligence Core",
        error: error instanceof Error ? error.message : "Database connection issue",
      },
      {
        status: 500,
        headers: {
          "Access-Control-Allow-Origin": "*",
        },
      }
    );
  }
}
