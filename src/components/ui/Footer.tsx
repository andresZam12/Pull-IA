"use client";

import { useState } from "react";
import { useLanguage } from "@/context/LanguageContext";
import { Category } from "@/types";

interface DigestArticle {
  id: string;
  titleEs: string;
  summaryEs: string;
  category: string;
  keyPoints: string[];
  sourceName: string;
  url: string;
  relevanceScore: number;
  publishedAt: string;
}

interface WeeklyDigest {
  titleEs: string;
  weekLabel: string;
  totalSelected: number;
  sections: {
    AI: DigestArticle[];
    ENGINEERING: DigestArticle[];
    MODELS: DigestArticle[];
    EMPLOYABILITY: DigestArticle[];
  };
  flatArticles: DigestArticle[];
}

const NEWSLETTER_SECTIONS: { id: Category; labelEs: string; labelEn: string }[] = [
  { id: Category.AI, labelEs: "Inteligencia Artificial", labelEn: "Artificial Intelligence" },
  { id: Category.ENGINEERING, labelEs: "Ingeniería & Seguridad", labelEn: "Engineering & Security" },
  { id: Category.MODELS, labelEs: "Modelos & Benchmarks", labelEn: "Models & Benchmarks" },
  { id: Category.EMPLOYABILITY, labelEs: "Empleabilidad & Mercado", labelEn: "Employability & Market" },
];

export function Footer() {
  const { locale, t } = useLanguage();
  const [email, setEmail] = useState("");
  const [selectedInterests, setSelectedInterests] = useState<Category[]>([
    Category.AI,
    Category.ENGINEERING,
    Category.MODELS,
    Category.EMPLOYABILITY,
  ]);
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [message, setMessage] = useState("");
  const [digestPreview, setDigestPreview] = useState<WeeklyDigest | null>(null);
  const [showDigestPreview, setShowDigestPreview] = useState(false);
  const [isLoadingPreview, setIsLoadingPreview] = useState(false);

  const toggleInterest = (cat: Category) => {
    setSelectedInterests((prev) => {
      if (prev.includes(cat)) {
        // Keep at least 1 section selected
        return prev.length > 1 ? prev.filter((c) => c !== cat) : prev;
      }
      return [...prev, cat];
    });
  };

  const handleLoadPreview = async () => {
    if (digestPreview) {
      setShowDigestPreview((prev) => !prev);
      return;
    }
    setIsLoadingPreview(true);
    try {
      const backendUrl =
        process.env.NEXT_PUBLIC_BACKEND_URL || "https://pull-ia-back.vercel.app";
      let res = await fetch("/api/newsletter/weekly").catch(() => null);
      if (!res || !res.ok) {
        res = await fetch(`${backendUrl}/api/newsletter/weekly`);
      }
      if (res && res.ok) {
        const data = await res.json();
        if (data.success && data.digest) {
          setDigestPreview(data.digest);
          setShowDigestPreview(true);
        }
      }
    } catch (err) {
      console.warn("[Footer] Could not load weekly digest preview:", err);
    } finally {
      setIsLoadingPreview(false);
    }
  };

  const handleSubscribe = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;

    setStatus("loading");
    setMessage("");

    try {
      const backendUrl =
        process.env.NEXT_PUBLIC_BACKEND_URL || "https://pull-ia-back.vercel.app";
      const payload = JSON.stringify({
        email: email.trim(),
        locale,
        interests: selectedInterests,
      });

      // Try local route first, automatically fall back to backend URL
      let res = await fetch("/api/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: payload,
      }).catch(() => null);

      if (!res || !res.ok) {
        res = await fetch(`${backendUrl}/api/subscribe`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: payload,
        });
      }

      const data = await res.json();

      if (res.ok && data.success) {
        setStatus("success");
        setMessage(data.message || t.newsletter.success);
        setEmail("");
        if (data.digest) {
          setDigestPreview(data.digest);
          setShowDigestPreview(true);
        }
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
        {/* SoftStack Weekly Newsletter Section */}
        <div className="rounded-3xl border border-indigo-500/20 bg-gradient-to-b from-indigo-950/40 via-zinc-900/40 to-zinc-950 p-8 sm:p-12 lg:p-16 shadow-2xl shadow-indigo-950/20">
          <div className="mx-auto max-w-2xl text-center">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-indigo-500/30 bg-indigo-500/10 px-3.5 py-1 text-xs font-bold text-indigo-300">
              📬 SoftStack • {t.newsletter.badge}
            </span>

            <h2 className="mt-4 text-3xl font-extrabold tracking-tight text-white sm:text-4xl">
              {t.newsletter.title}
            </h2>

            <p className="mt-4 text-sm leading-relaxed text-zinc-300 sm:text-base">
              {t.newsletter.description}
            </p>

            {/* Section Interest Selector */}
            <div className="mt-6">
              <p className="mb-2.5 text-xs font-semibold uppercase tracking-wider text-zinc-400">
                {locale === "es"
                  ? "Elige las secciones que deseas recibir en tu SoftStack semanal:"
                  : "Select the sections for your weekly SoftStack digest:"}
              </p>
              <div className="flex flex-wrap items-center justify-center gap-2">
                {NEWSLETTER_SECTIONS.map((sec) => {
                  const active = selectedInterests.includes(sec.id);
                  return (
                    <button
                      key={sec.id}
                      type="button"
                      onClick={() => toggleInterest(sec.id)}
                      className={`inline-flex items-center gap-1.5 rounded-xl border px-3 py-1.5 text-xs font-semibold transition ${
                        active
                          ? "border-indigo-500/50 bg-indigo-600/20 text-indigo-200 shadow-sm"
                          : "border-zinc-800 bg-zinc-900/60 text-zinc-500 hover:text-zinc-300"
                      }`}
                    >
                      <span>{active ? "✓" : "+"}</span>
                      <span>{locale === "es" ? sec.labelEs : sec.labelEn}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            <form onSubmit={handleSubscribe} className="mt-7 flex flex-col gap-3 sm:flex-row sm:justify-center">
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
              <div
                className={`mt-5 rounded-2xl border px-4 py-3 text-xs sm:text-sm font-semibold ${
                  status === "success"
                    ? "border-emerald-500/40 bg-emerald-950/40 text-emerald-200"
                    : "border-rose-500/40 bg-rose-950/40 text-rose-200"
                }`}
              >
                {message}
              </div>
            )}

            <div className="mt-4 flex flex-wrap items-center justify-center gap-4">
              <p className="text-xs text-zinc-500">
                {t.newsletter.disclaimer}
              </p>
              <button
                type="button"
                onClick={handleLoadPreview}
                disabled={isLoadingPreview}
                className="text-xs font-semibold text-indigo-400 hover:text-indigo-300 underline underline-offset-4 transition"
              >
                {isLoadingPreview
                  ? "Generando edición semanal..."
                  : showDigestPreview
                  ? "Ocultar edición semanal"
                  : "Ver edición semanal actual (SoftStack Top News)"}
              </button>
            </div>
          </div>

          {/* Curated Weekly Digest Preview Drawer */}
          {showDigestPreview && digestPreview && (
            <div className="mx-auto mt-10 max-w-4xl rounded-2xl border border-zinc-800 bg-zinc-950/90 p-6 sm:p-8 text-left shadow-xl">
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-zinc-800 pb-4">
                <div>
                  <span className="text-[11px] font-bold uppercase tracking-wider text-indigo-400">
                    Edición Semanal Curada • SoftStack
                  </span>
                  <h3 className="mt-1 text-lg font-bold text-white">
                    {digestPreview.titleEs}
                  </h3>
                </div>
                <span className="rounded-full bg-indigo-500/10 border border-indigo-500/30 px-3 py-1 text-xs font-semibold text-indigo-300">
                  {digestPreview.totalSelected} noticias más relevantes
                </span>
              </div>

              <div className="mt-6 grid gap-4 sm:grid-cols-2">
                {digestPreview.flatArticles.map((art) => (
                  <div
                    key={art.id}
                    className="flex flex-col justify-between rounded-xl border border-zinc-800/90 bg-zinc-900/60 p-4 hover:border-indigo-500/40 transition"
                  >
                    <div>
                      <div className="flex items-center justify-between gap-2 text-[11px] font-bold text-indigo-400">
                        <span>{art.sourceName}</span>
                        <span className="rounded bg-zinc-800 px-2 py-0.5 text-zinc-300">
                          {t.categories[art.category as keyof typeof t.categories] || art.category}
                        </span>
                      </div>
                      <h4 className="mt-2 text-sm font-bold text-white line-clamp-2">
                        {art.titleEs}
                      </h4>
                      <p className="mt-1.5 text-xs text-zinc-400 line-clamp-3">
                        {art.summaryEs}
                      </p>
                    </div>
                    <div className="mt-3 pt-2 border-t border-zinc-800/60 flex items-center justify-between">
                      <span className="text-[11px] text-emerald-400 font-semibold">
                        Impacto: {Math.round(art.relevanceScore * 100)}%
                      </span>
                      <a
                        href={art.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs font-semibold text-indigo-400 hover:text-indigo-300"
                      >
                        Leer noticia →
                      </a>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer Meta & Brand */}
        <div className="mt-16 flex flex-col items-center justify-between gap-6 border-t border-zinc-800/60 pt-8 sm:flex-row">
          <div className="flex items-center gap-3">
            <img
              src="/deplhoy-logo.png?v=2"
              alt="Deplhoy Logo"
              className="h-9 w-9 rounded-xl object-cover ring-1 ring-zinc-700/80 shadow-md"
            />
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
