"use client";

import { useState, useMemo, useEffect, useCallback } from "react";
import { Navbar } from "@/components/ui/Navbar";
import { NewsCard, type ArticleItem } from "@/components/news/NewsCard";
import { ModelSpecCard } from "@/components/models/ModelSpecCard";
import { ArticleModal } from "@/components/news/ArticleModal";
import { Footer } from "@/components/ui/Footer";
import { useLanguage } from "@/context/LanguageContext";

interface NewsFeedProps {
  initialArticles: ArticleItem[];
}

const PAGE_SIZE = 12;

/**
 * Precision section resolver: ensures strict, non-overlapping categorization
 * across [AI, ENGINEERING, MODELS, EMPLOYABILITY] based on structured metadata
 * and domain-specific taxonomy.
 */
function resolvePreciseCategory(article: ArticleItem): string {
  // 1. Technical Spec Sheets always belong to MODELS
  if (article.aiModelSpec || article.summary?.category === "MODELS") {
    return "MODELS";
  }

  const text = `${article.summary?.titleEs ?? ""} ${article.summary?.titleEn ?? ""} ${article.summary?.summaryEs ?? ""} ${article.sourceName}`.toLowerCase();
  const dbCategory = article.summary?.category;

  // 2. Strict EMPLOYABILITY detection (Tech Job Market, Salaries, Remote Work, Layoffs, Tech Stocks & Earnings)
  if (
    dbCategory === "EMPLOYABILITY" ||
    /\b(empleabilidad|empleo|empleos|trabajo remoto|remoto|teletrabajo|salari|sueldo|contrataci|vacante|entrevista|despido|layoff|recorte de personal|bolsa|acciones|wall street|nasdaq|ingresos trimestrales| ganancias|adquisici|fusi[oó]n|ipo|mercado laboral|carrera|talento|reclutamiento|headhunter|cnbc)\b/i.test(text)
  ) {
    return "EMPLOYABILITY";
  }

  // 3. Strict MODELS detection (Foundation Model Releases, Benchmarks, Context Windows, Token Pricing, Weights)
  if (
    /\b(gpt-[456]|claude 3|gemini [123]|llama [34]|deepseek-r|deepseek-v|mistral|qwen|mmlu|swe-bench|humaneval|ventana de contexto|context window|mill[oó]n de tokens|pesos abiertos|open weights|cuantizaci[oó]n|fine-tuning|ficha t[eé]cnica)\b/i.test(text)
  ) {
    return "MODELS";
  }

  // 4. Strict ENGINEERING detection (Cybersecurity, CVEs, Cloud, DevOps, Software Architecture, Programming Languages)
  const engineeringSources = [
    "bleepingcomputer",
    "the hacker news",
    "securityweek",
    "aws news blog",
    "github engineering",
    "microsoft azure blog",
    "meta engineering",
    "arxiv cs.se",
  ];
  if (
    engineeringSources.some((src) => article.sourceName.toLowerCase().includes(src)) ||
    /\b(vulnerabilidad|cve-\d|ransomware|malware|phishing|exploit|zero-day|ciberseguridad|parche|botnet|backdoor|arquitectura de software|microservicios|kubernetes|docker|devops|aws|azure|linux|kernel|postgresql|base de datos|rust|python|typescript|php|golang|compilador|protocolo|cortafuegos|firewall|servidor)\b/i.test(text)
  ) {
    return "ENGINEERING";
  }

  // 5. Strict AI detection (Agents, Automation, Multimodal, Robotics, AI Research)
  if (
    dbCategory === "AI" &&
    /\b(inteligencia artificial|agente|agentes|llm|neuronal|aprendizaje autom[aá]tico|machine learning|deep learning|generativ|openai|anthropic|huggingface|hugging face|rob[oó]tica|automatizaci[oó]n|rag|copiloto)\b/i.test(text)
  ) {
    return "AI";
  }

  // Map legacy PROGRAMMING into ENGINEERING
  if (dbCategory === "PROGRAMMING" || dbCategory === "ENGINEERING") {
    return "ENGINEERING";
  }

  return dbCategory || "ENGINEERING";
}

export function NewsFeed({ initialArticles }: NewsFeedProps) {
  const { locale, t } = useLanguage();
  const [articles, setArticles] = useState<ArticleItem[]>(initialArticles);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [timeRange, setTimeRange] = useState<"7d" | "30d">("7d");
  const [visibleCount, setVisibleCount] = useState<number>(PAGE_SIZE);
  const [selectedArticle, setSelectedArticle] = useState<ArticleItem | null>(null);

  // Live on-demand sync state
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncFeedback, setSyncFeedback] = useState<{
    type: "info" | "success" | "error";
    message: string;
  } | null>(null);

  // Sync state if initialArticles updates from SSR
  useEffect(() => {
    if (initialArticles && initialArticles.length > 0) {
      setArticles(initialArticles);
    }
  }, [initialArticles]);

  // Reset pagination batch to 12 whenever filters change
  useEffect(() => {
    setVisibleCount(PAGE_SIZE);
  }, [selectedCategory, timeRange]);

  // Auto-dismiss feedback banner after 8 seconds
  useEffect(() => {
    if (syncFeedback) {
      const timer = setTimeout(() => {
        setSyncFeedback(null);
      }, 8000);
      return () => clearTimeout(timer);
    }
  }, [syncFeedback]);

  // Handle on-demand news search across all verified RSS sources
  const handleRefresh = useCallback(async () => {
    if (isSyncing) return;
    setIsSyncing(true);
    setSyncFeedback(null);

    try {
      const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || "https://pull-ia-back.vercel.app";

      // Attempt local route first if running unified or proxy, fallback to backend URL
      let res = await fetch("/api/articles/sync", { method: "POST" }).catch(() => null);

      if (!res || !res.ok) {
        res = await fetch(`${backendUrl}/api/articles/sync`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
        });
      }

      if (!res.ok) {
        throw new Error(`Servidor respondió con código ${res.status}`);
      }

      const data = await res.json();

      if (data.success) {
        if (data.newCount > 0) {
          setSyncFeedback({
            type: "success",
            message: data.message || t.syncSuccess,
          });

          // Fetch fresh articles directly to render them without page reload
          try {
            const fetchRes = await fetch(`${backendUrl}/api/articles?days=30&limit=100`);
            if (fetchRes.ok) {
              const freshData = await fetchRes.json();
              if (freshData.success && Array.isArray(freshData.articles)) {
                setArticles(freshData.articles);
              }
            }
          } catch (fetchErr) {
            console.warn("[NewsFeed] Could not auto-refresh article cards:", fetchErr);
          }
        } else {
          setSyncFeedback({
            type: "info",
            message: data.message || t.syncUpToDate,
          });
        }
      } else {
        setSyncFeedback({
          type: "error",
          message: data.message || t.syncError,
        });
      }
    } catch (err) {
      console.error("[NewsFeed] Error in live refresh:", err);
      setSyncFeedback({
        type: "info",
        message: t.syncUpToDate,
      });
    } finally {
      setIsSyncing(false);
    }
  }, [isSyncing, t]);

  // Filter articles smoothly in memory by strict category and time window (7d vs 30d)
  const filteredArticles = useMemo(() => {
    const now = Date.now();
    const sevenDaysMs = 7 * 24 * 60 * 60 * 1000;
    const thirtyDaysMs = 30 * 24 * 60 * 60 * 1000;
    const maxAgeMs = timeRange === "7d" ? sevenDaysMs : thirtyDaysMs;

    return articles
      .map((article) => {
        const preciseCat = resolvePreciseCategory(article);
        return {
          ...article,
          summary: article.summary
            ? { ...article.summary, category: preciseCat }
            : null,
        };
      })
      .filter((article) => {
        // 1. Strict Category filter
        if (selectedCategory && selectedCategory !== "ALL") {
          if (article.summary?.category !== selectedCategory) {
            return false;
          }
        }

        // 2. Time range filter (7d Hot Feed vs 30d Monthly Archive)
        // Always allow AI Model Spec sheets so the Models catalog remains complete
        if (!article.aiModelSpec && article.publishedAt) {
          const pubTime = new Date(article.publishedAt).getTime();
          if (!Number.isNaN(pubTime) && now - pubTime > maxAgeMs) {
            return false;
          }
        }

        return true;
      });
  }, [articles, selectedCategory, timeRange, locale]);

  // Slice articles into organized batches of 12 to avoid overwhelming the screen
  const visibleArticles = useMemo(() => {
    return filteredArticles.slice(0, visibleCount);
  }, [filteredArticles, visibleCount]);

  return (
    <div className="flex min-h-screen flex-col bg-zinc-950 text-zinc-100 selection:bg-indigo-500 selection:text-white">
      {/* Navbar with Category & Global Language triggers */}
      <Navbar
        activeCategory={selectedCategory ?? "ALL"}
        onSelectCategory={setSelectedCategory}
      />

      {/* Hero Section */}
      <section className="relative overflow-hidden border-b border-zinc-800/80 bg-gradient-to-b from-indigo-950/25 via-zinc-950 to-zinc-950 px-4 py-14 sm:px-6 sm:py-20 lg:px-8">
        <div className="mx-auto max-w-5xl text-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-violet-500/30 bg-violet-500/10 px-4 py-1.5 text-xs font-semibold text-violet-300 shadow-inner">
            <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
            {t.heroBadge}
          </div>

          <h1 className="mt-6 text-4xl font-black tracking-tight text-white sm:text-6xl sm:leading-none">
            {t.heroTitlePrefix}
            <span className="bg-gradient-to-r from-indigo-400 via-violet-400 to-cyan-300 bg-clip-text text-transparent">
              {t.heroTitleHighlight}
            </span>
          </h1>

          <p className="mx-auto mt-6 max-w-2xl text-base leading-relaxed text-zinc-300 sm:text-lg">
            {t.heroDescription}
          </p>
        </div>
      </section>

      {/* Main Content Area */}
      <main className="mx-auto flex-1 max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        
        {/* Results Header with Category Label, Count, Time Filter & Live Refresh Button */}
        <div className="mb-6 flex flex-wrap items-center justify-between gap-4 border-b border-zinc-800/80 pb-4">
          <div className="flex items-center gap-3">
            <h2 className="text-xl font-bold text-white">
              {selectedCategory && selectedCategory !== "ALL"
                ? `${t.categoryPrefix} ${t.categories[selectedCategory as keyof typeof t.categories] || selectedCategory}`
                : t.latestUpdates}
            </h2>
            <span className="rounded-full bg-zinc-800 px-3 py-0.5 text-xs font-bold text-zinc-300">
              {visibleArticles.length} / {filteredArticles.length}
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {selectedCategory && selectedCategory !== "ALL" && (
              <button
                onClick={() => setSelectedCategory(null)}
                className="text-xs font-semibold text-indigo-400 hover:text-indigo-300 transition"
              >
                {t.showAll}
              </button>
            )}

            {/* 7-Day Hot Feed vs 30-Day Monthly Archive Filter */}
            <div className="inline-flex items-center gap-1 rounded-xl border border-zinc-800/90 bg-zinc-900/80 p-1">
              <button
                type="button"
                onClick={() => setTimeRange("7d")}
                className={`inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-semibold transition ${
                  timeRange === "7d"
                    ? "bg-indigo-600 text-white shadow-sm"
                    : "text-zinc-400 hover:text-zinc-200"
                }`}
              >
                <span>🔥</span>
                <span>{t.filterRecent7d}</span>
              </button>
              <button
                type="button"
                onClick={() => setTimeRange("30d")}
                className={`inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-semibold transition ${
                  timeRange === "30d"
                    ? "bg-indigo-600 text-white shadow-sm"
                    : "text-zinc-400 hover:text-zinc-200"
                }`}
              >
                <span>📅</span>
                <span>{t.filterArchive30d}</span>
              </button>
            </div>

            {/* Live Refresh / Sync Button */}
            <button
              onClick={handleRefresh}
              disabled={isSyncing}
              title="Consultar fuentes oficiales globales en busca de nuevas noticias"
              className="inline-flex items-center gap-2 rounded-xl border border-indigo-500/30 bg-indigo-500/10 hover:bg-indigo-500/20 active:scale-95 px-3.5 py-1.5 text-xs font-semibold text-indigo-300 transition duration-150 hover:border-indigo-500/60 disabled:cursor-not-allowed disabled:opacity-50 shadow-sm"
            >
              <svg
                className={`h-3.5 w-3.5 ${isSyncing ? "animate-spin text-indigo-400" : "text-indigo-300"}`}
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                />
              </svg>
              <span>{isSyncing ? t.refreshing : t.refreshButton}</span>
            </button>
          </div>
        </div>

        {/* Live Sync Status Feedback Banner */}
        {syncFeedback && (
          <div
            role="status"
            className={`mb-6 flex items-center justify-between gap-3 rounded-2xl border px-4 py-3 text-xs sm:text-sm font-medium shadow-lg transition-all animate-in fade-in slide-in-from-top-2 duration-300 ${
              syncFeedback.type === "success"
                ? "border-emerald-500/40 bg-emerald-950/40 text-emerald-200"
                : syncFeedback.type === "error"
                ? "border-amber-500/40 bg-amber-950/40 text-amber-200"
                : "border-indigo-500/40 bg-indigo-950/40 text-indigo-200"
            }`}
          >
            <div className="flex items-center gap-2.5">
              {syncFeedback.type === "success" ? (
                <svg className="h-5 w-5 text-emerald-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              ) : syncFeedback.type === "error" ? (
                <svg className="h-5 w-5 text-amber-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              ) : (
                <svg className="h-5 w-5 text-cyan-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              )}
              <span>{syncFeedback.message}</span>
            </div>

            <button
              onClick={() => setSyncFeedback(null)}
              className="text-zinc-400 hover:text-white transition p-1"
              aria-label="Cerrar notificación"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        )}

        {/* Visual Articles Grid (Capped to 12 per batch) */}
        {visibleArticles.length > 0 ? (
          <>
            <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
              {visibleArticles.map((article) =>
                article.aiModelSpec ? (
                  <ModelSpecCard
                    key={article.id}
                    specs={article.aiModelSpec}
                    articleUrl={article.url}
                  />
                ) : (
                  <NewsCard
                    key={article.id}
                    article={article}
                    onOpenModal={setSelectedArticle}
                  />
                )
              )}
            </div>

            {/* Progressive Pagination & Monthly Retention Bar */}
            <div className="mt-12 flex flex-col items-center justify-center gap-4 border-t border-zinc-800/80 pt-8 text-center">
              <p className="text-xs font-medium text-zinc-400">
                {t.showingCount}{" "}
                <span className="font-bold text-white">{visibleArticles.length}</span>{" "}
                {t.ofCount}{" "}
                <span className="font-bold text-white">{filteredArticles.length}</span>{" "}
                ({timeRange === "7d" ? t.filterRecent7d : t.filterArchive30d})
              </p>

              <div className="flex flex-wrap items-center justify-center gap-3">
                {visibleCount < filteredArticles.length && (
                  <button
                    type="button"
                    onClick={() => setVisibleCount((prev) => prev + PAGE_SIZE)}
                    className="inline-flex items-center gap-2 rounded-2xl border border-indigo-500/40 bg-indigo-600/20 hover:bg-indigo-600/30 px-6 py-2.5 text-xs font-bold text-indigo-200 transition shadow-sm"
                  >
                    <span>{t.loadMore} (+{Math.min(PAGE_SIZE, filteredArticles.length - visibleCount)})</span>
                  </button>
                )}

                {visibleCount > PAGE_SIZE && (
                  <button
                    type="button"
                    onClick={() => setVisibleCount(PAGE_SIZE)}
                    className="inline-flex items-center gap-2 rounded-2xl border border-zinc-700 bg-zinc-900 hover:bg-zinc-800 px-5 py-2.5 text-xs font-semibold text-zinc-300 transition"
                  >
                    <span>{t.showLess}</span>
                  </button>
                )}

                {timeRange === "7d" && (
                  <button
                    type="button"
                    onClick={() => setTimeRange("30d")}
                    className="inline-flex items-center gap-2 rounded-2xl border border-zinc-800 bg-zinc-900/80 hover:border-indigo-500/40 hover:text-indigo-300 px-5 py-2.5 text-xs font-semibold text-zinc-400 transition"
                  >
                    <span>📅</span>
                    <span>{t.searchInArchiveCta}</span>
                  </button>
                )}
              </div>

              <p className="text-[11px] text-zinc-500">
                {t.retentionNotice}
              </p>
            </div>
          </>
        ) : (
          <div className="rounded-3xl border border-dashed border-zinc-800 py-20 text-center">
            <svg
              className="mx-auto h-12 w-12 text-zinc-600"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z"
              />
            </svg>
            <h3 className="mt-4 text-base font-bold text-white">
              {t.noArticlesFound}
            </h3>
            <p className="mt-1 text-xs text-zinc-500">
              {t.noArticlesDesc}
            </p>
            {timeRange === "7d" && (
              <button
                type="button"
                onClick={() => setTimeRange("30d")}
                className="mt-5 inline-flex items-center gap-2 rounded-xl border border-indigo-500/40 bg-indigo-500/10 hover:bg-indigo-500/20 px-4 py-2 text-xs font-semibold text-indigo-300 transition"
              >
                <span>📅</span>
                <span>{t.searchInArchiveCta}</span>
              </button>
            )}
          </div>
        )}
      </main>

      {/* Floating Detailed Article Modal / Giant Card */}
      <ArticleModal
        article={selectedArticle}
        onClose={() => setSelectedArticle(null)}
      />

      {/* Footer */}
      <Footer />
    </div>
  );
}
