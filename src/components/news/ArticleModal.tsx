"use client";

import { useEffect } from "react";
import { ArrowUpRight, Clock3, X } from "lucide-react";
import { type ArticleItem } from "@/components/news/NewsCard";
import { useLanguage } from "@/context/LanguageContext";
import { Category } from "@/types";
import { getArticleImage } from "@/lib/utils/images";
import { cleanHtmlText } from "@/lib/utils/text";

interface ArticleModalProps {
  article: ArticleItem | null;
  onClose: () => void;
}

export function ArticleModal({ article, onClose }: ArticleModalProps) {
  const { locale, t } = useLanguage();

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
  const category = (summary.category as Category) || Category.ENGINEERING;
  const categoryLabel =
    t.categories[category as keyof typeof t.categories] ||
    t.categories.ENGINEERING;

  const rawTitle = locale === "es" ? summary.titleEs : summary.titleEn;
  const rawDetailedSummary =
    locale === "es" ? summary.summaryEs : summary.summaryEn;
  const title = cleanHtmlText(rawTitle);
  const detailedSummary = cleanHtmlText(rawDetailedSummary);
  const contextText = `${summary.titleEs} ${summary.titleEn} ${summary.summaryEs} ${article.sourceName}`;
  const imageUrl =
    article.imageUrl && article.imageUrl.startsWith("http")
      ? article.imageUrl
      : getArticleImage(article.id, category, article.imageUrl, contextText);

  const totalWords = (
    detailedSummary +
    " " +
    (summary.keyPoints ?? []).join(" ")
  ).split(/\s+/).length;
  const readingTimeMin = Math.max(1, Math.ceil(totalWords / 160));

  const dateStr = article.publishedAt
    ? new Date(article.publishedAt).toLocaleDateString(
        locale === "es" ? "es-CO" : "en-US",
        {
          weekday: "long",
          year: "numeric",
          month: "long",
          day: "numeric",
        }
      )
    : null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6"
      role="dialog"
      aria-modal="true"
    >
      {/* Newspaper Ink Backdrop */}
      <div
        className="fixed inset-0 bg-[#191817]/75 backdrop-blur-sm transition-opacity"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Editorial Broadsheet Dialog */}
      <div
        style={{
          background: "var(--paper)",
          color: "var(--ink)",
          border: "2px solid var(--ink)",
          boxShadow: "14px 14px 0 rgba(25,24,23,.45)",
        }}
        className="relative z-10 flex max-h-[90vh] w-full max-w-3xl flex-col overflow-hidden"
      >
        {/* Top Masthead Bar */}
        <div
          style={{
            borderBottom: "3px double var(--ink)",
            background: "var(--paper-light)",
          }}
          className="flex items-center justify-between px-6 py-4"
        >
          <div className="flex items-center gap-3">
            <span className="category">{categoryLabel}</span>
            <span style={{ color: "var(--line)" }}>•</span>
            <span
              style={{ color: "var(--ink)" }}
              className="text-xs font-extrabold uppercase tracking-wider"
            >
              {article.sourceName}
            </span>
          </div>

          <button
            onClick={onClose}
            className="icon-button"
            aria-label={t.closeModal}
          >
            <X size={17} />
          </button>
        </div>

        {/* Scrollable Editorial Article Content */}
        <div className="overflow-y-auto p-6 sm:p-8 space-y-6">
          {/* Newspaper Image Frame */}
          <div
            style={{
              borderTop: "1px solid var(--ink)",
              borderBottom: "1px solid var(--ink)",
              background: "#cfc8bb",
            }}
            className="relative aspect-[16/9] w-full overflow-hidden"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={imageUrl}
              alt={title}
              style={{
                filter: "grayscale(.45) sepia(.12) contrast(1.06)",
              }}
              className="h-full w-full object-cover"
            />
            <span className="story-number">DEPLHOY</span>
          </div>

          {/* Byline & Timestamp */}
          <div
            style={{
              borderBottom: "1px solid var(--line)",
              color: "var(--muted)",
            }}
            className="flex flex-wrap items-center justify-between gap-3 pb-3 text-xs font-bold uppercase tracking-wider"
          >
            <span className="inline-flex items-center gap-1.5">
              <Clock3 size={13} />
              {readingTimeMin} {t.readingTime}
            </span>
            {dateStr && <span>{dateStr}</span>}
            <span style={{ color: "var(--red)" }}>{t.verifiedAi}</span>
          </div>

          {/* Serif Headline */}
          <h2
            style={{
              fontFamily: "Georgia, 'Times New Roman', serif",
              color: "var(--ink)",
              letterSpacing: "-0.04em",
              lineHeight: 1.02,
            }}
            className="text-3xl sm:text-4xl font-black"
          >
            {title}
          </h2>

          {/* Detailed Summary */}
          <div
            style={{
              background: "var(--paper-light)",
              border: "1px solid var(--line)",
            }}
            className="p-5 sm:p-6 space-y-4"
          >
            <p className="eyebrow" style={{ color: "var(--red)", margin: 0 }}>
              {t.fullSummaryTitle}
            </p>
            <div
              style={{ color: "#262320" }}
              className="space-y-3.5 text-sm sm:text-base leading-relaxed font-medium"
            >
              {detailedSummary
                .split(/\n+/)
                .filter(Boolean)
                .map((para, idx) => (
                  <p key={idx}>{para.trim()}</p>
                ))}
            </div>
          </div>

          {/* Key Points */}
          {summary.keyPoints && summary.keyPoints.length > 0 && (
            <div
              style={{
                borderTop: "2px solid var(--ink)",
                paddingTop: "18px",
              }}
            >
              <p
                className="eyebrow"
                style={{ color: "var(--ink)", marginBottom: "12px" }}
              >
                {t.keyPointsTitle}
              </p>
              <ul className="space-y-2.5">
                {summary.keyPoints.map((point, index) => (
                  <li
                    key={index}
                    style={{
                      background: "rgba(248,244,236,.75)",
                      border: "1px solid var(--line)",
                    }}
                    className="flex items-start gap-3 p-3 text-sm font-medium"
                  >
                    <span
                      style={{
                        background: "var(--red)",
                        color: "#fff",
                        fontFamily: "Georgia, serif",
                      }}
                      className="px-2 py-0.5 text-xs font-bold shrink-0"
                    >
                      0{index + 1}
                    </span>
                    <span style={{ color: "var(--ink)" }}>{point}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div
          style={{
            borderTop: "3px double var(--ink)",
            background: "var(--paper-light)",
          }}
          className="flex flex-wrap items-center justify-between gap-3 px-6 py-4"
        >
          <button onClick={onClose} className="filter">
            {t.closeModal}
          </button>

          <a
            href={article.url}
            target="_blank"
            rel="noopener noreferrer"
            className="newsletter-button"
          >
            <span>
              {t.originalSource} ({article.sourceName})
            </span>
            <ArrowUpRight size={15} />
          </a>
        </div>
      </div>
    </div>
  );
}
