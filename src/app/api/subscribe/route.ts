/**
 * PULL-IA / SoftStack — Subscribe API
 *
 * POST /api/subscribe
 * Registers or updates a subscriber in the Weekly SoftStack Tech Digest,
 * immediately activates their subscription, sends the current weekly digest
 * if Resend is configured, and returns the curated digest preview.
 */

import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db/prisma";
import { applyRateLimit } from "@/lib/security/rate-limit";
import { parseBody, subscribeSchema } from "@/lib/security/validators";
import { sendNewsletterEmail } from "@/lib/email/sender";
import {
  buildWeeklyNewsletterDigest,
  buildWeeklyNewsletterHtml,
} from "@/lib/email/newsletter";

export const dynamic = "force-dynamic";

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: CORS_HEADERS,
  });
}

export async function POST(request: NextRequest) {
  try {
    // 1. Rate limiting (if Upstash Redis is configured)
    try {
      const rateLimitResponse = await applyRateLimit(request, "subscribe");
      if (rateLimitResponse) return rateLimitResponse;
    } catch (rlErr) {
      console.warn("[Subscribe] Rate limit check bypassed:", rlErr);
    }

    // 2. Validate input
    const { data, error } = await parseBody(request, subscribeSchema);
    if (error || !data) {
      return NextResponse.json(
        { success: false, error: error || "Por favor ingresa un correo válido." },
        { status: 400, headers: CORS_HEADERS }
      );
    }

    // 3. If this serverless instance has no DATABASE_URL configured, proxy to backend
    if (!process.env.DATABASE_URL) {
      const backendUrl =
        process.env.NEXT_PUBLIC_BACKEND_URL ||
        process.env.BACKEND_URL ||
        "https://pull-ia-back.vercel.app";

      const proxyRes = await fetch(`${backendUrl}/api/subscribe`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      const proxyData = await proxyRes.json();
      return NextResponse.json(proxyData, {
        status: proxyRes.status,
        headers: CORS_HEADERS,
      });
    }

    // 4. Upsert subscriber in Supabase as active/confirmed for the Weekly SoftStack Digest
    const subscriber = await prisma.subscriber.upsert({
      where: { email: data.email },
      update: {
        locale: data.locale,
        interests: data.interests,
        confirmed: true,
        confirmedAt: new Date(),
        status: "CONFIRMED",
        unsubscribedAt: null,
      },
      create: {
        email: data.email,
        name: data.name,
        locale: data.locale,
        interests: data.interests,
        confirmed: true,
        confirmedAt: new Date(),
        status: "CONFIRMED",
      },
    });

    // 5. Build the personalized Weekly Digest for their selected sections
    const digest = await buildWeeklyNewsletterDigest(data.interests);

    // 6. Send Welcome + Current Weekly Digest email (non-blocking / fault-tolerant)
    let emailDispatched = false;
    try {
      const appUrl =
        process.env.NEXT_PUBLIC_APP_URL || "https://deplhoy-zeta.vercel.app";
      const unsubUrl = `${appUrl}/api/subscribe?unsubscribe=${subscriber.unsubscribeToken}`;
      const html = buildWeeklyNewsletterHtml(digest, unsubUrl);
      await sendNewsletterEmail(
        subscriber.email,
        subscriber.unsubscribeToken,
        html,
        `¡Bienvenido a SoftStack! ${digest.titleEs}`
      );
      emailDispatched = true;
    } catch (emailErr) {
      console.warn(
        "[Subscribe] Welcome digest email skipped or provider restricted:",
        emailErr instanceof Error ? emailErr.message : emailErr
      );
    }

    return NextResponse.json(
      {
        success: true,
        emailDispatched,
        message:
          "¡Suscripción exitosa al SoftStack Semanal! Tu correo quedó registrado para recibir cada viernes el resumen ejecutivo con las noticias más relevantes.",
        subscriber: {
          email: subscriber.email,
          interests: subscriber.interests,
        },
        digest,
      },
      {
        status: 201,
        headers: CORS_HEADERS,
      }
    );
  } catch (err) {
    console.error("[Subscribe POST] Error:", err);
    return NextResponse.json(
      {
        success: false,
        error: "No se pudo procesar la suscripción en este momento. Intenta de nuevo.",
      },
      {
        status: 500,
        headers: CORS_HEADERS,
      }
    );
  }
}

// GET /api/subscribe?token=xxx or ?unsubscribe=xxx
export async function GET(request: NextRequest) {
  try {
    const token = request.nextUrl.searchParams.get("token");
    const unsubToken = request.nextUrl.searchParams.get("unsubscribe");

    if (unsubToken) {
      await prisma.subscriber.updateMany({
        where: { unsubscribeToken: unsubToken },
        data: {
          status: "UNSUBSCRIBED",
          confirmed: false,
          unsubscribedAt: new Date(),
        },
      });
      return NextResponse.redirect(new URL("/?newsletter=unsubscribed", request.url));
    }

    if (!token) {
      return NextResponse.redirect(new URL("/?newsletter=missing-token", request.url));
    }

    const subscriber = await prisma.subscriber.findUnique({
      where: { confirmToken: token },
    });

    if (!subscriber) {
      return NextResponse.redirect(new URL("/?newsletter=invalid-token", request.url));
    }

    await prisma.subscriber.update({
      where: { id: subscriber.id },
      data: {
        confirmed: true,
        confirmedAt: new Date(),
        status: "CONFIRMED",
      },
    });

    return NextResponse.redirect(new URL("/?newsletter=confirmed", request.url));
  } catch (err) {
    console.error("[Subscribe GET] Error:", err);
    return NextResponse.redirect(new URL("/", request.url));
  }
}
