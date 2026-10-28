import { NextRequest, NextResponse } from "next/server";
import { IngestionPipeline } from "@/lib/pipeline/ingest";

export const dynamic = "force-dynamic";

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization",
    },
  });
}

export async function POST(request: NextRequest) {
  try {
    console.log("[Sync] User triggered manual news sync at", new Date().toISOString());

    const pipeline = new IngestionPipeline();
    // Process fresh articles quickly so it completes well within HTTP limits
    const result = await pipeline.run();

    const newCount = result.published;

    return NextResponse.json(
      {
        success: true,
        newCount,
        message:
          newCount > 0
            ? `Se encontraron y publicaron ${newCount} noticias nuevas en español.`
            : "Todo al día. No hay noticias nuevas en las fuentes oficiales en este momento.",
        fetchedCount: result.fetched,
        deduplicatedCount: result.deduplicated,
      },
      {
        headers: {
          "Access-Control-Allow-Origin": "*",
        },
      }
    );
  } catch (error) {
    const errMessage = error instanceof Error ? error.message : "Error desconocido";
    console.error("[Sync] Error during manual sync:", errMessage);

    return NextResponse.json(
      {
        success: false,
        newCount: 0,
        message: "No se pudo completar la sincronización en este momento.",
        error: errMessage,
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

export async function GET(request: NextRequest) {
  return POST(request);
}
