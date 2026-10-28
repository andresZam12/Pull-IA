"use client";

import { useEffect } from "react";
import { type ArticleItem } from "@/components/news/NewsCard";
import { useLanguage } from "@/context/LanguageContext";
import { Category } from "@/types";
import { getArticleImage } from "@/lib/utils/images";
import { cleanHtmlText } from "@/lib/utils/text";

interface ArticleModalProps {
  article: ArticleItem | null;
  onClose: () => void;
}

const categoryBadgeStyles: Record<Category, { bg: string; text: string }> = {
  [Category.AI]: { bg: "bg-purple-500/20 border-purple-500/40 text-purple-300", text: "text-purple-400" },
  [Category.ENGINEERING]: { bg: "bg-blue-500/20 border-blue-500/40 text-blue-300", text: "text-blue-400" },
  [Category.PROGRAMMING]: { bg: "bg-emerald-500/20 border-emerald-500/40 text-emerald-300", text: "text-emerald-400" },
  [Category.MODELS]: { bg: "bg-emerald-500/20 border-emerald-500/40 text-emerald-300", text: "text-emerald-400" },
  [Category.EMPLOYABILITY]: { bg: "bg-amber-500/20 border-amber-500/40 text-amber-300", text: "text-amber-400" },
};

export function ArticleModal({ article, onClose }: ArticleModalProps) {
  const { locale, t } = useLanguage();

  // Close on ESC key and freeze body scroll while modal is open
  useEffect(() => {
    if (!article) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };

    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = "unset";
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [article, onClose]);

  if (!article || !article.summary) return null;

  const summary = article.summary;
  const category = (summary.category as Category) in categoryBadgeStyles ? (summary.category as Category) : Category.ENGINEERING;
  const badgeStyle = categoryBadgeStyles[category];
  const categoryLabel = t.categories[category] || t.categories.ENGINEERING;

  const rawTitle = locale === "es" ? summary.titleEs : summary.titleEn;
  const rawDetailedSummary = locale === "es" ? summary.summaryEs : summary.summaryEn;
  const title = cleanHtmlText(rawTitle);
  const detailedSummary = cleanHtmlText(rawDetailedSummary);
  const imageUrl = getArticleImage(article.id, category, article.imageUrl);

  // Calculate estimated reading time
  const totalWords = (detailedSummary + " " + summary.keyPoints.join(" ")).split(/\s+/).length;
  const readingTimeMin = Math.max(1, Math.ceil(totalWords / 160));

  const dateStr = article.publishedAt
    ? new Date(article.publishedAt).toLocaleDateString(locale === "es" ? "es-CO" : "en-US", {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
      })
    : null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 md:p-6"
      role="dialog"
      aria-modal="true"
    >
      {/* Backdrop with blur */}
      <div
        className="fixed inset-0 bg-black/80 backdrop-blur-md transition-opacity animate-in fade-in duration-200"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Modal Dialog Content */}
      <div className="relative z-10 flex max-h-[92vh] w-full max-w-3xl flex-col overflow-hidden rounded-3xl border border-zinc-700/80 bg-zinc-900 shadow-2xl shadow-indigo-950/40 animate-in zoom-in-95 duration-200">
        
        {/* Sticky Header with Close Button */}
        <div className="flex items-center justify-between border-b border-zinc-800/80 bg-zinc-900/90 px-6 py-4 backdrop-blur-md">
          <div className="flex items-center gap-2 text-xs">
            <span className={`rounded-full border px-3 py-0.5 font-semibold ${badgeStyle.bg}`}>
              {categoryLabel}
            </span>
            <span className="text-zinc-400">•</span>
            <span className="font-semibold text-zinc-300">{article.sourceName}</span>
          </div>

          <button
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-full bg-zinc-800 text-zinc-400 transition hover:bg-zinc-700 hover:text-white"
            aria-label={t.closeModal}
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Scrollable Modal Body */}
        <div className="overflow-y-auto p-6 sm:p-8 space-y-6">
          
          {/* Featured Hero Image */}
          <div className="relative aspect-video w-full overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-950 shadow-md">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={imageUrl}
              alt={title}
              onError={(e) => {
                e.currentTarget.src = "https://images.unsplash.com/photo-1485827404703-89b55fcc595e?auto=format&fit=crop&w=1200&q=80";
              }}
              className="h-full w-full object-cover transition duration-500 hover:scale-105"
            />
          </div>

          {/* Metadata bar: Reading time & Date */}
          <div className="flex flex-wrap items-center gap-4 text-xs text-zinc-400">
            <div className="flex items-center gap-1.5">
              <svg className="h-4 w-4 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>{readingTimeMin} {t.readingTime}</span>
            </div>

            {dateStr && (
              <div className="flex items-center gap-1.5 capitalize">
                <svg className="h-4 w-4 text-zinc-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <span>{dateStr}</span>
              </div>
            )}

            <div className="flex items-center gap-1 text-emerald-400 font-medium ml-auto">
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              <span>{t.verifiedAi}</span>
            </div>
          </div>

          {/* Full Title */}
          <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-white leading-snug">
            {title}
          </h2>

          {/* Structured Detailed Summary */}
          <div className="rounded-2xl border border-zinc-800/90 bg-zinc-950/70 p-6 sm:p-7 shadow-inner">
            <div className="mb-4 flex items-center justify-between">
              <h4 className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-indigo-400">
                <span className="h-2 w-2 rounded-full bg-indigo-500 animate-pulse" />
                {t.fullSummaryTitle}
              </h4>
              <span className="text-[11px] font-medium text-zinc-400 bg-zinc-900 border border-zinc-800 px-3 py-1 rounded-full">
                Análisis Ejecutivo
              </span>
            </div>
            <div className="space-y-3.5 text-sm sm:text-base leading-relaxed text-zinc-200">
              {detailedSummary.split(/\n+/).filter(Boolean).map((para, idx) => (
                <p key={idx} className="leading-relaxed text-zinc-200/95">
                  {para.trim()}
                </p>
              ))}
            </div>
          </div>

          {/* Key Points / Bullets */}
          {summary.keyPoints && summary.keyPoints.length > 0 && (
            <div className="rounded-2xl border border-zinc-800/80 bg-zinc-900/60 p-6 sm:p-7">
              <h4 className="mb-4 flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-violet-400">
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
                {t.keyPointsTitle}
              </h4>
              <ul className="space-y-3 text-sm text-zinc-300">
                {summary.keyPoints.map((point, index) => (
                  <li key={index} className="flex items-start gap-3 rounded-xl bg-zinc-950/50 border border-zinc-800/60 p-3.5">
                    <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-lg bg-violet-500/20 text-xs font-bold text-violet-300">
                      {index + 1}
                    </span>
                    <span className="leading-relaxed text-zinc-200">{point}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        {/* Modal Footer with Direct Source Link Action */}
        <div className="flex flex-col-reverse sm:flex-row items-center justify-between gap-3 border-t border-zinc-800 bg-zinc-950 px-6 py-4">
          <button
            onClick={onClose}
            className="w-full sm:w-auto rounded-xl border border-zinc-700 bg-zinc-900 px-5 py-2.5 text-xs font-semibold text-zinc-300 transition hover:bg-zinc-800 hover:text-white"
          >
            {t.closeModal}
          </button>

          <a
            href={article.url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex w-full sm:w-auto items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 px-6 py-2.5 text-xs font-bold text-white shadow-lg shadow-indigo-600/30 transition hover:from-indigo-500 hover:to-violet-500"
          >
            <span>{t.originalSource} ({article.sourceName})</span>
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
            </svg>
          </a>
        </div>

      </div>
    </div>
  );
}
