import { NextRequest, NextResponse } from "next/server";
import {
  buildWeeklyNewsletterDigest,
  dispatchWeeklyNewsletterIssue,
} from "@/lib/email/newsletter";

export const dynamic = "force-dynamic";

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: CORS_HEADERS });
}

/**
 * GET /api/newsletter/weekly
 * - When invoked by Vercel Cron (`vercel-cron` User-Agent or `?dispatch=true`),
 *   dispatches the Weekly Newsletter Issue to all confirmed subscribers.
 * - Otherwise returns a preview of the curated Weekly Digest across the 4 sections.
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const isCron =
      searchParams.get("dispatch") === "true" ||
      (request.headers.get("user-agent") ?? "").includes("vercel-cron");

    if (isCron) {
      const result = await dispatchWeeklyNewsletterIssue();
      return NextResponse.json(
        {
          success: true,
          cronTriggered: true,
          message: `Boletín semanal enviado automáticamente (${result.articlesCount} noticias clave para ${result.subscribersCount} suscriptores activos).`,
          ...result,
        },
        { headers: CORS_HEADERS }
      );
    }

    const digest = await buildWeeklyNewsletterDigest();
    return NextResponse.json(
      {
        success: true,
        digest,
      },
      { headers: CORS_HEADERS }
    );
  } catch (error) {
    console.error("[Newsletter Weekly GET] Error:", error);
    return NextResponse.json(
      {
        success: false,
        error: "No se pudo procesar el boletín semanal.",
      },
      { status: 500, headers: CORS_HEADERS }
    );
  }
}

/**
 * POST /api/newsletter/weekly
 * Dispatches the Weekly Newsletter Issue to all confirmed subscribers.
 */
export async function POST(request: NextRequest) {
  try {
    const result = await dispatchWeeklyNewsletterIssue();
    return NextResponse.json(
      {
        success: true,
        message: `Boletín semanal generado con ${result.articlesCount} noticias clave para ${result.subscribersCount} suscriptores activos.`,
        ...result,
      },
      { headers: CORS_HEADERS }
    );
  } catch (error) {
    console.error("[Newsletter Weekly POST] Error:", error);
    return NextResponse.json(
      {
        success: false,
        error: "No se pudo procesar el envío del boletín semanal.",
      },
      { status: 500, headers: CORS_HEADERS }
    );
  }
}
