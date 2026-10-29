/**
 * PULL-IA / SoftStack — Hybrid Email Sender (Gmail SMTP + Resend SDK)
 *
 * Supports two zero-cost delivery modes:
 * 1. Gmail SMTP (`GMAIL_USER` + `GMAIL_APP_PASSWORD`): Can send to ANY recipient email
 *    address without requiring a custom domain.
 * 2. Resend API (`RESEND_API_KEY`): Uses `onboarding@resend.dev` by default (or a custom
 *    verified domain via `RESEND_FROM_EMAIL`).
 */

import { Resend } from "resend";
import nodemailer from "nodemailer";

const resend = process.env.RESEND_API_KEY
  ? new Resend(process.env.RESEND_API_KEY)
  : null;

const gmailUser = process.env.GMAIL_USER?.trim();
const gmailPass = process.env.GMAIL_APP_PASSWORD?.trim();

const smtpTransporter =
  gmailUser && gmailPass
    ? nodemailer.createTransport({
        service: "gmail",
        auth: {
          user: gmailUser,
          pass: gmailPass,
        },
      })
    : null;

const FROM_NAME = process.env.RESEND_FROM_NAME ?? "SoftStack • Deplhoy";
const RESEND_FROM = `${FROM_NAME} <${process.env.RESEND_FROM_EMAIL ?? "onboarding@resend.dev"}>`;
const SMTP_FROM = `${FROM_NAME} <${gmailUser ?? "no-reply@deplhoy.com"}>`;
const APP_URL =
  process.env.NEXT_PUBLIC_APP_URL ?? "https://deplhoy-zeta.vercel.app";

/**
 * Unified helper that sends an HTML email via Gmail SMTP (preferred for all recipients)
 * or Resend API fallback. Returns true if actually dispatched over the network.
 */
async function dispatchEmail(params: {
  to: string;
  subject: string;
  html: string;
  headers?: Record<string, string>;
}): Promise<boolean> {
  // 1. Try Gmail SMTP first (can deliver to any email address without domain restrictions)
  if (smtpTransporter) {
    await smtpTransporter.sendMail({
      from: SMTP_FROM,
      to: params.to,
      subject: params.subject,
      html: params.html,
      headers: params.headers,
    });
    return true;
  }

  // 2. Fallback to Resend API
  if (resend) {
    const { error } = await resend.emails.send({
      from: RESEND_FROM,
      to: params.to,
      subject: params.subject,
      html: params.html,
      headers: params.headers,
    });

    if (error) {
      throw new Error(`Resend error: ${error.message}`);
    }
    return true;
  }

  console.warn(
    "[Email] Neither GMAIL_USER/GMAIL_APP_PASSWORD nor RESEND_API_KEY is configured. Skipping email dispatch."
  );
  return false;
}

/**
 * Send double opt-in confirmation email.
 */
export async function sendConfirmationEmail(
  email: string,
  token: string,
  locale: "es" | "en" = "es"
): Promise<boolean> {
  const confirmUrl = `${APP_URL}/api/subscribe?token=${token}`;

  const subject =
    locale === "es"
      ? "Confirma tu suscripción a SoftStack • Deplhoy"
      : "Confirm your SoftStack • Deplhoy subscription";

  const html =
    locale === "es"
      ? buildConfirmationHtmlEs(confirmUrl)
      : buildConfirmationHtmlEn(confirmUrl);

  return dispatchEmail({ to: email, subject, html });
}

/**
 * Send weekly newsletter issue to a subscriber.
 */
export async function sendNewsletterEmail(
  email: string,
  unsubscribeToken: string,
  html: string,
  subject: string
): Promise<boolean> {
  const unsubscribeUrl = `${APP_URL}/api/subscribe?unsubscribe=${unsubscribeToken}`;

  return dispatchEmail({
    to: email,
    subject,
    html,
    headers: {
      "List-Unsubscribe": `<${unsubscribeUrl}>`,
      "List-Unsubscribe-Post": "List-Unsubscribe=One-Click",
    },
  });
}

function buildConfirmationHtmlEs(confirmUrl: string): string {
  return `
<!DOCTYPE html>
<html lang="es">
<head><meta charset="UTF-8"><title>Confirma tu suscripción</title></head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; background: #0a0a0a; color: #e5e5e5; margin: 0; padding: 40px 20px;">
  <div style="max-width: 560px; margin: 0 auto; background: #111; border: 1px solid #222; border-radius: 12px; padding: 40px;">
    <div style="margin-bottom: 32px;">
      <span style="font-size: 24px; font-weight: 700; color: #6366f1;">SoftStack • Deplhoy</span>
    </div>
    <h1 style="font-size: 22px; font-weight: 600; color: #fff; margin: 0 0 16px;">Confirma tu suscripción</h1>
    <p style="color: #aaa; line-height: 1.6; margin: 0 0 24px;">
      Un clic para empezar a recibir las noticias tech más relevantes de IA, ingeniería, modelos y empleabilidad — cada semana, en español.
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
      <span style="font-size: 24px; font-weight: 700; color: #6366f1;">SoftStack • Deplhoy</span>
    </div>
    <h1 style="font-size: 22px; font-weight: 600; color: #fff; margin: 0 0 16px;">Confirm your subscription</h1>
    <p style="color: #aaa; line-height: 1.6; margin: 0 0 24px;">
      One click to start receiving the most relevant tech news on AI, engineering, models, and careers — every week.
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
