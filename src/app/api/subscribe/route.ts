/**
 * PULL-IA — Subscribe API
 *
 * POST /api/subscribe
 * Handles new newsletter subscriptions with double opt-in.
 *
 * Flow:
 * 1. Validate input
 * 2. Rate limit check
 * 3. Check if email already exists
 * 4. Create subscriber record (unconfirmed)
 * 5. Send confirmation email
 */

import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db/prisma";
import { applyRateLimit } from "@/lib/security/rate-limit";
import { parseBody, subscribeSchema } from "@/lib/security/validators";
import { sendConfirmationEmail } from "@/lib/email/sender";

export async function POST(request: NextRequest) {
  // 1. Rate limiting (5 attempts per IP per hour)
  const rateLimitResponse = await applyRateLimit(request, "subscribe");
  if (rateLimitResponse) return rateLimitResponse;

  // 2. Validate input
  const { data, error } = await parseBody(request, subscribeSchema);
  if (error || !data) {
    return NextResponse.json({ success: false, error }, { status: 400 });
  }

  // 3. Check for existing subscriber
  const existing = await prisma.subscriber.findUnique({
    where: { email: data.email },
    select: { id: true, status: true, confirmed: true },
  });

  if (existing) {
    if (existing.confirmed) {
      // Already confirmed — don't reveal this to prevent enumeration
      return NextResponse.json({
        success: true,
        message: "Check your inbox for the confirmation email.",
      });
    }
    // Pending: resend confirmation
    const subscriber = await prisma.subscriber.findUnique({
      where: { email: data.email },
    });
    if (subscriber) {
      await sendConfirmationEmail(subscriber.email, subscriber.confirmToken, data.locale);
    }
    return NextResponse.json({
      success: true,
      message: "Check your inbox for the confirmation email.",
    });
  }

  // 4. Create new subscriber
  const subscriber = await prisma.subscriber.create({
    data: {
      email: data.email,
      name: data.name,
      locale: data.locale,
      interests: data.interests,
    },
  });

  // 5. Send double opt-in confirmation email
  await sendConfirmationEmail(subscriber.email, subscriber.confirmToken, data.locale);

  return NextResponse.json(
    {
      success: true,
      message: "¡Gracias! Revisa tu correo para confirmar tu suscripción.",
    },
    { status: 201 }
  );
}

// GET /api/subscribe?token=xxx — confirm subscription
export async function GET(request: NextRequest) {
  const token = request.nextUrl.searchParams.get("token");

  if (!token) {
    return NextResponse.redirect(
      new URL("/subscribe?error=missing-token", request.url)
    );
  }

  const subscriber = await prisma.subscriber.findUnique({
    where: { confirmToken: token },
  });

  if (!subscriber) {
    return NextResponse.redirect(
      new URL("/subscribe?error=invalid-token", request.url)
    );
  }

  if (subscriber.confirmed) {
    return NextResponse.redirect(
      new URL("/subscribe?status=already-confirmed", request.url)
    );
  }

  await prisma.subscriber.update({
    where: { id: subscriber.id },
    data: {
      confirmed: true,
      confirmedAt: new Date(),
      status: "CONFIRMED",
    },
  });

  return NextResponse.redirect(
    new URL("/subscribe?status=confirmed", request.url)
  );
}
