"use client";

import { useEffect } from "react";
import {
  AlertTriangle,
  ArrowUpRight,
  CheckCircle2,
  Clock3,
  ExternalLink,
  X,
} from "lucide-react";
import { type ArticleItem } from "@/components/news/NewsCard";
import { useLanguage } from "@/context/LanguageContext";
import { Category } from "@/types";
import { getArticleImage } from "@/lib/utils/images";
import { cleanHtmlText } from "@/lib/utils/text";
import { buildEditorialAnalysis } from "@/lib/utils/editorial-analysis";

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
  const title = cleanHtmlText(rawTitle);
  const contextText = `${summary.titleEs} ${summary.titleEn} ${summary.summaryEs} ${article.sourceName}`;
  const imageUrl =
    article.imageUrl && article.imageUrl.startsWith("http")
      ? article.imageUrl
      : getArticleImage(article.id, category, article.imageUrl, contextText);

  const analysis = buildEditorialAnalysis({
    titleEs: summary.titleEs,
    titleEn: summary.titleEn || summary.titleEs,
    summaryEs: summary.summaryEs,
    summaryEn: summary.summaryEn || summary.summaryEs,
    category: String(category),
    sourceName: article.sourceName,
    keyPoints: summary.keyPoints,
    relevanceScore: summary.relevanceScore,
    locale,
  });

  const totalWords = (
    analysis.paragraphs.join(" ") +
    " " +
    analysis.keyPoints.join(" ")
  ).split(/\s+/).length;
  const readingTimeMin = Math.max(2, Math.ceil(totalWords / 150));

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

  let hostname = article.sourceName;
  try {
    hostname = new URL(article.url).hostname.replace(/^www\./, "");
  } catch {
    // Keep sourceName if URL parsing fails
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-5"
      role="dialog"
      aria-modal="true"
    >
      {/* Newspaper Ink Backdrop */}
      <div
        className="fixed inset-0 bg-[#191817]/80 backdrop-blur-sm transition-opacity"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Editorial Broadsheet Dialog */}
      <div
        style={{
          background: "var(--paper)",
          color: "var(--ink)",
          border: "2px solid var(--ink)",
          boxShadow: "16px 16px 0 rgba(25,24,23,.5)",
        }}
        className="relative z-10 flex max-h-[92vh] w-full max-w-4xl flex-col overflow-hidden"
      >
        {/* Top Masthead Bar */}
        <div
          style={{
            borderBottom: "3px double var(--ink)",
            background: "var(--paper-light)",
          }}
          className="flex items-center justify-between gap-3 px-5 py-3.5 sm:px-7"
        >
          <div className="flex flex-wrap items-center gap-2.5">
            <span className="category">{categoryLabel}</span>
            <span style={{ color: "var(--line)" }}>•</span>
            <span
              style={{ color: "var(--ink)" }}
              className="text-xs font-extrabold uppercase tracking-wider"
            >
              {article.sourceName}
            </span>
            <span style={{ color: "var(--line)" }} className="hidden sm:inline">
              •
            </span>
            <span
              style={{ color: "var(--muted)" }}
              className="hidden sm:inline text-[11px] font-bold uppercase tracking-wider"
            >
              {locale === "es" ? analysis.domainTagEs : analysis.domainTagEn}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <a
              href={article.url}
              target="_blank"
              rel="noopener noreferrer"
              className="newsletter-button"
              style={{ padding: "7px 12px", fontSize: "10px" }}
              title={
                locale === "es"
                  ? "Abrir noticia original en nueva pestaña"
                  : "Open original article in new tab"
              }
            >
              <span>
                {locale === "es" ? "Ir a la fuente" : "Go to source"}
              </span>
              <ArrowUpRight size={14} />
            </a>

            <button
              onClick={onClose}
              className="icon-button"
              aria-label={t.closeModal}
            >
              <X size={17} />
            </button>
          </div>
        </div>

        {/* Scrollable Editorial Dossier Body */}
        <div className="overflow-y-auto p-5 sm:p-8 space-y-7">
          {/* Headline + Metadata Header */}
          <div className="space-y-4">
            <div
              style={{
                borderBottom: "1px solid var(--line)",
                color: "var(--muted)",
              }}
              className="flex flex-wrap items-center justify-between gap-3 pb-2.5 text-[11px] font-extrabold uppercase tracking-wider"
            >
              <span className="inline-flex items-center gap-1.5">
                <Clock3 size={13} />
                {readingTimeMin} {t.readingTime}
              </span>
              {dateStr && <span>{dateStr}</span>}
              <span style={{ color: "var(--red)" }}>
                {locale === "es"
                  ? `Relevancia Técnica · ${analysis.impactScore}%`
                  : `Technical Relevance · ${analysis.impactScore}%`}
              </span>
            </div>

            <h2
              style={{
                fontFamily: "Georgia, 'Times New Roman', serif",
                color: "var(--ink)",
                letterSpacing: "-0.04em",
                lineHeight: 1.03,
              }}
              className="text-2xl sm:text-4xl font-black"
            >
              {title}
            </h2>

            {/* Prominent Direct Source Access Bar */}
            <div
              style={{
                background: "var(--paper-light)",
                border: "1.5px solid var(--ink)",
                boxShadow: "5px 5px 0 rgba(25,24,23,.16)",
              }}
              className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 sm:px-5"
            >
              <div className="min-w-0">
                <p
                  style={{ color: "var(--red)", margin: 0 }}
                  className="text-[10px] font-black uppercase tracking-widest"
                >
                  {locale === "es"
                    ? "Enlace directo verificado · Fuente original"
                    : "Verified Direct Link · Original Source"}
                </p>
                <p
                  style={{ color: "var(--ink)" }}
                  className="truncate text-xs sm:text-sm font-bold mt-0.5"
                >
                  {article.sourceName}{" "}
                  <span style={{ color: "var(--muted)", fontWeight: 500 }}>
                    ({hostname})
                  </span>
                </p>
              </div>

              <a
                href={article.url}
                target="_blank"
                rel="noopener noreferrer"
                className="newsletter-button shrink-0 justify-center"
                style={{ padding: "10px 16px", fontSize: "11px" }}
              >
                <ExternalLink size={14} />
                <span>
                  {locale === "es"
                    ? `Leer noticia completa en ${article.sourceName}`
                    : `Read full article on ${article.sourceName}`}
                </span>
                <ArrowUpRight size={15} />
              </a>
            </div>
          </div>

          {/* Newspaper Image Frame */}
          <div
            style={{
              borderTop: "1px solid var(--ink)",
              borderBottom: "1px solid var(--ink)",
              background: "#cfc8bb",
            }}
            className="relative aspect-[16/8] w-full overflow-hidden"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={imageUrl}
              alt={title}
              style={{
                filter: "grayscale(.35) sepia(.10) contrast(1.06)",
              }}
              className="h-full w-full object-cover"
            />
            <span className="story-number">DEPLHOY · INFORME</span>
          </div>

          {/* SECTION 01: Executive Summary (3 Structured Paragraphs) */}
          <div
            style={{
              background: "var(--paper-light)",
              border: "1px solid var(--ink)",
            }}
            className="p-5 sm:p-7 space-y-4"
          >
            <div
              style={{
                borderBottom: "2px solid var(--ink)",
                paddingBottom: "10px",
              }}
              className="flex items-center justify-between"
            >
              <p className="eyebrow" style={{ color: "var(--red)", margin: 0 }}>
                {locale === "es"
                  ? "01 / Resumen Ejecutivo y Contexto Técnico"
                  : "01 / Executive Summary & Technical Context"}
              </p>
              <span
                style={{ color: "var(--muted)" }}
                className="text-[10px] font-extrabold uppercase tracking-wider"
              >
                {locale === "es" ? "Síntesis Estructurada" : "Structured Briefing"}
              </span>
            </div>

            <div
              style={{ color: "#221f1c" }}
              className="space-y-4 text-sm sm:text-[15px] leading-relaxed font-medium"
            >
              {analysis.paragraphs.map((para, idx) => (
                <p
                  key={idx}
                  style={
                    idx === 0
                      ? {
                          fontFamily: "Georgia, 'Times New Roman', serif",
                          fontSize: "17px",
                          lineHeight: 1.55,
                          color: "var(--ink)",
                        }
                      : undefined
                  }
                >
                  {para}
                </p>
              ))}
            </div>
          </div>

          {/* SECTION 02: Actionable Key Points */}
          <div
            style={{
              borderTop: "3px double var(--ink)",
              paddingTop: "20px",
            }}
          >
            <p
              className="eyebrow"
              style={{ color: "var(--ink)", marginBottom: "14px" }}
            >
              {locale === "es"
                ? "02 / Puntos Clave de la Noticia"
                : "02 / Key Takeaways"}
            </p>
            <div className="grid gap-3 sm:grid-cols-2">
              {analysis.keyPoints.map((point, index) => (
                <div
                  key={index}
                  style={{
                    background: "rgba(248,244,236,.85)",
                    border: "1px solid var(--line)",
                  }}
                  className="flex items-start gap-3 p-3.5 text-xs sm:text-sm font-medium leading-relaxed"
                >
                  <span
                    style={{
                      background: "var(--ink)",
                      color: "#fff",
                      fontFamily: "Georgia, serif",
                    }}
                    className="px-2 py-0.5 text-xs font-bold shrink-0 mt-0.5"
                  >
                    0{index + 1}
                  </span>
                  <span style={{ color: "var(--ink)" }}>{point}</span>
                </div>
              ))}
            </div>
          </div>

          {/* SECTION 03: Advantages vs. Disadvantages */}
          <div
            style={{
              borderTop: "3px double var(--ink)",
              paddingTop: "20px",
            }}
          >
            <p
              className="eyebrow"
              style={{ color: "var(--ink)", marginBottom: "14px" }}
            >
              {locale === "es"
                ? "03 / Balance Técnico: Ventajas y Desventajas"
                : "03 / Technical Trade-offs: Pros & Cons"}
            </p>

            <div className="grid gap-4 sm:grid-cols-2">
              {/* Advantages Box */}
              <div
                style={{
                  background: "var(--paper-light)",
                  border: "1.5px solid var(--ink)",
                }}
                className="p-4 sm:p-5 space-y-3"
              >
                <div
                  style={{
                    borderBottom: "1px solid var(--line)",
                    paddingBottom: "8px",
                  }}
                  className="flex items-center gap-2"
                >
                  <CheckCircle2 size={16} style={{ color: "#15803d" }} />
                  <h4
                    style={{ color: "#15803d" }}
                    className="text-xs font-black uppercase tracking-wider m-0"
                  >
                    {locale === "es"
                      ? "Ventajas y Aportes Clave"
                      : "Advantages & Key Benefits"}
                  </h4>
                </div>
                <ul className="space-y-2.5 text-xs sm:text-[13px] leading-relaxed font-medium">
                  {analysis.advantages.map((adv, idx) => (
                    <li key={idx} className="flex items-start gap-2">
                      <span
                        style={{ color: "#15803d" }}
                        className="font-black shrink-0"
                      >
                        +
                      </span>
                      <span style={{ color: "var(--ink)" }}>{adv}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Disadvantages / Risks Box */}
              <div
                style={{
                  background: "var(--paper-light)",
                  border: "1.5px solid var(--ink)",
                }}
                className="p-4 sm:p-5 space-y-3"
              >
                <div
                  style={{
                    borderBottom: "1px solid var(--line)",
                    paddingBottom: "8px",
                  }}
                  className="flex items-center gap-2"
                >
                  <AlertTriangle size={16} style={{ color: "var(--red)" }} />
                  <h4
                    style={{ color: "var(--red)" }}
                    className="text-xs font-black uppercase tracking-wider m-0"
                  >
                    {locale === "es"
                      ? "Desventajas y Retos a Considerar"
                      : "Disadvantages & Challenges"}
                  </h4>
                </div>
                <ul className="space-y-2.5 text-xs sm:text-[13px] leading-relaxed font-medium">
                  {analysis.disadvantages.map((dis, idx) => (
                    <li key={idx} className="flex items-start gap-2">
                      <span
                        style={{ color: "var(--red)" }}
                        className="font-black shrink-0"
                      >
                        −
                      </span>
                      <span style={{ color: "var(--ink)" }}>{dis}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>

        {/* Sticky Footer with Direct Link to Original News Source */}
        <div
          style={{
            borderTop: "3px double var(--ink)",
            background: "var(--paper-light)",
          }}
          className="flex flex-wrap items-center justify-between gap-3 px-5 py-4 sm:px-7"
        >
          <button onClick={onClose} className="filter">
            {t.closeModal}
          </button>

          <a
            href={article.url}
            target="_blank"
            rel="noopener noreferrer"
            className="newsletter-button"
            style={{ padding: "11px 18px", fontSize: "12px" }}
          >
            <span>
              {locale === "es"
                ? `Ir al artículo oficial en ${article.sourceName}`
                : `Go to official article on ${article.sourceName}`}
            </span>
            <ArrowUpRight size={16} />
          </a>
        </div>
      </div>
    </div>
  );
}
