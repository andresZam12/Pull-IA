"use client";

import { Category } from "@/types";
import { useLanguage } from "@/context/LanguageContext";
import { getArticleImage } from "@/lib/utils/images";

export interface ArticleItem {
  id: string;
  url: string;
  sourceName: string;
  sourceUrl?: string;
  imageUrl?: string | null;
  publishedAt: Date | string | null;
  summary: {
    titleEs: string;
    titleEn: string;
    summaryEs: string;
    summaryEn: string;
    category: Category | string;
    keyPoints: string[];
    relevanceScore: number;
    aiModel: string;
  } | null;
}

interface NewsCardProps {
  article: ArticleItem;
  onOpenModal: (article: ArticleItem) => void;
}

const categoryPillStyles: Record<Category, { bg: string; text: string }> = {
  [Category.AI]: { bg: "bg-purple-950/80 border-purple-500/50 text-purple-300", text: "text-purple-400" },
  [Category.ENGINEERING]: { bg: "bg-blue-950/80 border-blue-500/50 text-blue-300", text: "text-blue-400" },
  [Category.PROGRAMMING]: { bg: "bg-emerald-950/80 border-emerald-500/50 text-emerald-300", text: "text-emerald-400" },
  [Category.EMPLOYABILITY]: { bg: "bg-amber-950/80 border-amber-500/50 text-amber-300", text: "text-amber-400" },
};

export function NewsCard({ article, onOpenModal }: NewsCardProps) {
  const { locale, t } = useLanguage();
  const summary = article.summary;

  if (!summary) return null;

  const category = (summary.category as Category) in categoryPillStyles ? (summary.category as Category) : Category.ENGINEERING;
  const pillStyle = categoryPillStyles[category];
  const categoryLabel = t.categories[category] || t.categories.ENGINEERING;

  const title = locale === "es" ? summary.titleEs : summary.titleEn;
  const fullSummary = locale === "es" ? summary.summaryEs : summary.summaryEn;
  
  // Extract a brief, engaging hook (first sentence or max 120 chars)
  const shortHook = fullSummary.split(". ")[0].concat(".").slice(0, 140);
  const imageUrl = getArticleImage(article.id, category, article.imageUrl);

  return (
    <div className="group flex flex-col overflow-hidden rounded-3xl border border-zinc-800/90 bg-zinc-900/60 shadow-lg backdrop-blur-sm transition-all duration-300 hover:-translate-y-1 hover:border-zinc-700 hover:bg-zinc-900 hover:shadow-2xl hover:shadow-indigo-500/10">
      
      {/* 1. Featured Image with Overlay Badges */}
      <div
        onClick={() => onOpenModal(article)}
        className="relative aspect-[16/10] w-full overflow-hidden bg-zinc-950 cursor-pointer"
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={imageUrl}
          alt={title}
          loading="lazy"
          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-zinc-950/90 via-zinc-950/20 to-transparent" />

        {/* Top Floating Badge: Category */}
        <div className="absolute top-3 left-3">
          <span className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold backdrop-blur-md shadow-sm ${pillStyle.bg}`}>
            {categoryLabel}
          </span>
        </div>

        {/* Bottom Floating Pill: AI Verification */}
        <div className="absolute bottom-3 left-3 flex items-center text-xs text-zinc-300">
          <span className="flex items-center gap-1 rounded-lg bg-zinc-900/80 px-2.5 py-1 font-semibold backdrop-blur-md text-[11px] text-emerald-400">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
            {t.verifiedAi}
          </span>
        </div>
      </div>

      {/* 2. Content: Title + Short Hook Excerpt */}
      <div className="flex flex-1 flex-col justify-between p-6">
        <div
          onClick={() => onOpenModal(article)}
          className="cursor-pointer"
        >
          <h3 className="line-clamp-2 text-lg font-extrabold tracking-tight text-white transition group-hover:text-indigo-300 sm:text-xl">
            {title}
          </h3>
          <p className="mt-3 line-clamp-2 text-sm leading-relaxed text-zinc-400">
            {shortHook}
          </p>
        </div>

        {/* 3. Action Buttons: "Ir a Fuente" + "Ver más" */}
        <div className="mt-6 pt-4 border-t border-zinc-800/60 flex items-center justify-between gap-2">
          {/* Direct Source Link */}
          <a
            href={article.url}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()}
            className="inline-flex items-center gap-1.5 rounded-xl border border-zinc-800 bg-zinc-900/90 px-3 py-2 text-xs font-semibold text-zinc-400 transition hover:border-zinc-700 hover:text-white"
            title={`${t.originalSource}: ${article.sourceName}`}
          >
            <span className="truncate max-w-[110px]">{article.sourceName}</span>
            <svg className="h-3.5 w-3.5 text-zinc-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
            </svg>
          </a>

          {/* Expanded Modal Trigger */}
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onOpenModal(article);
            }}
            className="inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 px-4 py-2 text-xs font-bold text-white shadow-md shadow-indigo-600/20 transition-all hover:from-indigo-500 hover:to-violet-500 hover:shadow-indigo-600/40"
          >
            <span>{t.readMore}</span>
            <svg
              className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>
      </div>

    </div>
  );
}
