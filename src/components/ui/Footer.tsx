"use client";

import { useState } from "react";

interface FooterProps {
  locale?: "es" | "en";
}

export function Footer({ locale = "es" }: FooterProps) {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [message, setMessage] = useState("");

  const handleSubscribe = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;

    setStatus("loading");
    setMessage("");

    try {
      const res = await fetch("/api/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, locale }),
      });

      const data = await res.json();

      if (res.ok && data.success) {
        setStatus("success");
        setMessage(
          locale === "es"
            ? "¡Listo! Te enviamos un correo para confirmar tu suscripción."
            : "Awesome! We sent you an email to confirm your subscription."
        );
        setEmail("");
      } else {
        setStatus("error");
        setMessage(data.error || (locale === "es" ? "Hubo un error al suscribirte." : "Failed to subscribe."));
      }
    } catch {
      setStatus("error");
      setMessage(locale === "es" ? "Error de conexión. Intenta de nuevo." : "Network error. Please try again.");
    }
  };

  return (
    <footer id="newsletter" className="mt-20 border-t border-zinc-800/80 bg-zinc-950 text-zinc-400">
      <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        
        {/* Newsletter Section */}
        <div className="rounded-3xl border border-indigo-500/20 bg-gradient-to-b from-indigo-950/30 via-zinc-900/40 to-zinc-950 p-8 sm:p-12 lg:p-16">
          <div className="mx-auto max-w-2xl text-center">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-indigo-500/30 bg-indigo-500/10 px-3 py-1 text-xs font-semibold text-indigo-300">
              {locale === "es" ? "Boletín Semanal Gratuito" : "Free Weekly Newsletter"}
            </span>

            <h2 className="mt-4 text-3xl font-extrabold tracking-tight text-white sm:text-4xl">
              {locale === "es"
                ? "Las noticias tech más importantes, cada viernes"
                : "The most important tech news, every Friday"}
            </h2>

            <p className="mt-4 text-sm leading-relaxed text-zinc-300 sm:text-base">
              {locale === "es"
                ? "Sin spam ni relleno. Solo resúmenes de alto impacto sobre IA, ingeniería de software y mercado laboral, verificados por la arquitectura PULL-IA."
                : "Zero spam. Only high-impact summaries on AI, software engineering, and the tech job market, powered by PULL-IA."}
            </p>

            <form onSubmit={handleSubscribe} className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder={locale === "es" ? "tu.correo@empresa.com" : "your.email@company.com"}
                required
                className="w-full rounded-xl border border-zinc-700 bg-zinc-900/90 px-4 py-3 text-sm text-white placeholder-zinc-500 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 sm:max-w-md"
              />
              <button
                type="submit"
                disabled={status === "loading"}
                className="inline-flex shrink-0 items-center justify-center rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-indigo-600/25 transition hover:from-indigo-500 hover:to-violet-500 disabled:opacity-50"
              >
                {status === "loading"
                  ? locale === "es" ? "Enviando..." : "Subscribing..."
                  : locale === "es" ? "Suscribirme" : "Subscribe"}
              </button>
            </form>

            {message && (
              <p
                className={`mt-4 text-xs font-medium ${
                  status === "success" ? "text-emerald-400" : "text-rose-400"
                }`}
              >
                {message}
              </p>
            )}

            <p className="mt-3 text-xs text-zinc-400">
              {locale === "es"
                ? "Doble confirmación (Double opt-in). Puedes cancelar tu suscripción en cualquier momento."
                : "Double opt-in. You can unsubscribe at any time with one click."}
            </p>
          </div>
        </div>

        {/* Footer Meta & Brand */}
        <div className="mt-16 flex flex-col items-center justify-between gap-6 border-t border-zinc-800/60 pt-8 sm:flex-row">
          <div className="flex items-center gap-3">
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-indigo-600 font-mono text-sm font-bold text-white">
              D
            </span>
            <span className="text-base font-black text-white">Deplhoy</span>
            <span className="text-xs text-zinc-400">
              • Engine: <span className="font-semibold text-zinc-300">PULL-IA</span>
            </span>
          </div>

          <div className="text-center text-xs text-zinc-400 sm:text-right">
            <p>
              Programación Orientada a la Web • Semestre 7
            </p>
            <p className="mt-1 text-zinc-400">
              Next.js 16 • Supabase PostgreSQL • Google Gemini • Vercel
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}
