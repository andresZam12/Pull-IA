/**
 * PULL-IA — Email Sender
 *
 * Thin wrapper around the Resend SDK.
 * All transactional emails go through this module.
 */

import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

const FROM = `${process.env.RESEND_FROM_NAME ?? "PULL-IA"} <${process.env.RESEND_FROM_EMAIL ?? "newsletter@pull-ia.com"}>`;
const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "https://pull-ia.com";

/**
 * Send double opt-in confirmation email.
 */
export async function sendConfirmationEmail(
  email: string,
  token: string,
  locale: "es" | "en" = "es"
): Promise<void> {
  const confirmUrl = `${APP_URL}/api/subscribe?token=${token}`;

  const subject =
    locale === "es"
      ? "Confirma tu suscripción a PULL-IA"
      : "Confirm your PULL-IA subscription";

  const html =
    locale === "es"
      ? buildConfirmationHtmlEs(confirmUrl)
      : buildConfirmationHtmlEn(confirmUrl);

  const { error } = await resend.emails.send({
    from: FROM,
    to: email,
    subject,
    html,
  });

  if (error) {
    throw new Error(`Failed to send confirmation email: ${error.message}`);
  }
}

/**
 * Send weekly newsletter issue to a subscriber.
 */
export async function sendNewsletterEmail(
  email: string,
  unsubscribeToken: string,
  html: string,
  subject: string
): Promise<void> {
  const unsubscribeUrl = `${APP_URL}/unsubscribe?token=${unsubscribeToken}`;

  const { error } = await resend.emails.send({
    from: FROM,
    to: email,
    subject,
    html,
    headers: {
      "List-Unsubscribe": `<${unsubscribeUrl}>`,
      "List-Unsubscribe-Post": "List-Unsubscribe=One-Click",
    },
  });

  if (error) {
    throw new Error(`Failed to send newsletter: ${error.message}`);
  }
}

// ── Email Templates (inline HTML — no external deps) ──────────────────

function buildConfirmationHtmlEs(confirmUrl: string): string {
  return `
<!DOCTYPE html>
<html lang="es">
<head><meta charset="UTF-8"><title>Confirma tu suscripción</title></head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; background: #0a0a0a; color: #e5e5e5; margin: 0; padding: 40px 20px;">
  <div style="max-width: 560px; margin: 0 auto; background: #111; border: 1px solid #222; border-radius: 12px; padding: 40px;">
    <div style="margin-bottom: 32px;">
      <span style="font-size: 24px; font-weight: 700; color: #6366f1;">PULL-IA</span>
      <span style="font-size: 14px; color: #666; margin-left: 8px;">Tech News</span>
    </div>
    <h1 style="font-size: 22px; font-weight: 600; color: #fff; margin: 0 0 16px;">Confirma tu suscripción</h1>
    <p style="color: #aaa; line-height: 1.6; margin: 0 0 24px;">
      Un clic para empezar a recibir las noticias tech más relevantes de IA, ingeniería y empleabilidad tech — cada semana, en español.
    </p>
    <a href="${confirmUrl}" style="display: inline-block; background: #6366f1; color: #fff; text-decoration: none; padding: 14px 28px; border-radius: 8px; font-weight: 600; font-size: 15px;">
      Confirmar suscripción →
    </a>
    <p style="color: #555; font-size: 13px; margin-top: 32px;">
      Si no solicitaste esta suscripción, ignora este correo.
    </p>
  </div>
</body>
</html>`;
}

function buildConfirmationHtmlEn(confirmUrl: string): string {
  return `
<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><title>Confirm your subscription</title></head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; background: #0a0a0a; color: #e5e5e5; margin: 0; padding: 40px 20px;">
  <div style="max-width: 560px; margin: 0 auto; background: #111; border: 1px solid #222; border-radius: 12px; padding: 40px;">
    <div style="margin-bottom: 32px;">
      <span style="font-size: 24px; font-weight: 700; color: #6366f1;">PULL-IA</span>
      <span style="font-size: 14px; color: #666; margin-left: 8px;">Tech News</span>
    </div>
    <h1 style="font-size: 22px; font-weight: 600; color: #fff; margin: 0 0 16px;">Confirm your subscription</h1>
    <p style="color: #aaa; line-height: 1.6; margin: 0 0 24px;">
      One click to start receiving the most relevant tech news on AI, engineering and careers — every week.
    </p>
    <a href="${confirmUrl}" style="display: inline-block; background: #6366f1; color: #fff; text-decoration: none; padding: 14px 28px; border-radius: 8px; font-weight: 600; font-size: 15px;">
      Confirm subscription →
    </a>
    <p style="color: #555; font-size: 13px; margin-top: 32px;">
      If you didn't request this, you can safely ignore this email.
    </p>
  </div>
</body>
</html>`;
}
