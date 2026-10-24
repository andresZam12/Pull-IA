"use client";

import { useState } from "react";
import { useLanguage } from "@/context/LanguageContext";

export function Footer() {
  const { locale, t } = useLanguage();
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
        setMessage(t.newsletter.success);
        setEmail("");
      } else {
        setStatus("error");
        setMessage(data.error || t.newsletter.error);
      }
    } catch {
      setStatus("error");
      setMessage(t.newsletter.error);
    }
  };

  return (
    <footer id="newsletter" className="mt-20 border-t border-zinc-800/80 bg-zinc-950 text-zinc-400">
      <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        
        {/* Newsletter Section */}
        <div className="rounded-3xl border border-indigo-500/20 bg-gradient-to-b from-indigo-950/40 via-zinc-900/40 to-zinc-950 p-8 sm:p-12 lg:p-16 shadow-2xl shadow-indigo-950/20">
          <div className="mx-auto max-w-2xl text-center">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-indigo-500/30 bg-indigo-500/10 px-3.5 py-1 text-xs font-bold text-indigo-300">
              {t.newsletter.badge}
            </span>

            <h2 className="mt-4 text-3xl font-extrabold tracking-tight text-white sm:text-4xl">
              {t.newsletter.title}
            </h2>

            <p className="mt-4 text-sm leading-relaxed text-zinc-300 sm:text-base">
              {t.newsletter.description}
            </p>

            <form onSubmit={handleSubscribe} className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder={t.newsletter.placeholder}
                required
                className="w-full rounded-2xl border border-zinc-700 bg-zinc-900/90 px-4 py-3.5 text-sm text-white placeholder-zinc-500 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 sm:max-w-md shadow-inner"
              />
              <button
                type="submit"
                disabled={status === "loading"}
                className="inline-flex shrink-0 items-center justify-center rounded-2xl bg-gradient-to-r from-indigo-600 to-violet-600 px-7 py-3.5 text-sm font-bold text-white shadow-lg shadow-indigo-600/30 transition hover:from-indigo-500 hover:to-violet-500 disabled:opacity-50"
              >
                {status === "loading" ? t.newsletter.subscribing : t.newsletter.button}
              </button>
            </form>

            {message && (
              <p
                className={`mt-4 text-xs font-semibold ${
                  status === "success" ? "text-emerald-400" : "text-rose-400"
                }`}
              >
                {message}
              </p>
            )}

            <p className="mt-3 text-xs text-zinc-500">
              {t.newsletter.disclaimer}
            </p>
          </div>
        </div>

        {/* Footer Meta & Brand */}
        <div className="mt-16 flex flex-col items-center justify-between gap-6 border-t border-zinc-800/60 pt-8 sm:flex-row">
          <div className="flex items-center gap-3">
            <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-500 font-mono text-sm font-bold text-white shadow-md shadow-indigo-500/20">
              D
            </span>
            <span className="text-base font-black text-white">Deplhoy</span>
            <span className="text-xs text-zinc-500">
              • Engine: <span className="font-semibold text-zinc-400">PULL-IA</span>
            </span>
          </div>

          <div className="text-center text-xs text-zinc-500 sm:text-right">
            <p className="font-medium text-zinc-400">
              {t.footerAcademic}
            </p>
            <p className="mt-1 text-zinc-500">
              {t.footerStack}
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}
