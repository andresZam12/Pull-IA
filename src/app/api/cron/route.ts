/**
 * PULL-IA — Cron: News Ingestion
 *
 * Triggered by Vercel Cron every 2 hours.
 * Protected by CRON_SECRET bearer token.
 *
 * Schedule is defined in vercel.json (path "/api/cron", every 2 hours).
 * Note: the cron expression is not written here because its "*" + "/"
 * characters would close this block comment early.
 */

import { NextRequest, NextResponse } from "next/server";
import { IngestionPipeline } from "@/lib/pipeline/ingest";
import { verifyCronSecret } from "@/lib/security/rate-limit";

export const runtime = "nodejs";
export const maxDuration = 300; // 5 minutes max (Vercel Pro limit)

export async function GET(request: NextRequest) {
  // Security: only Vercel Cron or authorized callers can trigger this
  if (!verifyCronSecret(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  console.log("[Cron] Ingestion triggered at", new Date().toISOString());

  try {
    const pipeline = new IngestionPipeline();
    const result = await pipeline.run();

    return NextResponse.json({
      success: true,
      message: "Ingestion completed",
      result,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("[Cron] Ingestion failed:", message);

    return NextResponse.json(
      { success: false, error: message },
      { status: 500 }
    );
  }
}
