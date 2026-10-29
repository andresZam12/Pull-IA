"use client";

import { useState, useMemo, useEffect, useCallback } from "react";
import {
  ArrowUpRight,
  ChevronRight,
  Clock3,
  Menu,
  RefreshCw,
  X,
} from "lucide-react";
import { type ArticleItem } from "@/components/news/NewsCard";
import { ArticleModal } from "@/components/news/ArticleModal";
import { useLanguage } from "@/context/LanguageContext";
import { getArticleImage } from "@/lib/utils/images";
import { cleanHtmlText } from "@/lib/utils/text";
import { buildEditorialAnalysis } from "@/lib/utils/editorial-analysis";
import { Category } from "@/types";

interface NewsFeedProps {
  initialArticles: ArticleItem[];
}

interface GrpcStreamFrameUI {
  event: {
    step: number;
    totalSteps: number;
    stage: number;
    stageName: string;
    message: string;
    sourceName?: string;
    articleTitle?: string;
    assignedCategory?: string;
    fetchedCount?: number;
    newCandidates?: number;
    publishedCount?: number;
    purgedCount?: number;
    elapsedMs: number;
  };
  grpcMethod: string;
  protobufBytes: number;
  jsonBytes: number;
  savingsPercent: number;
  wireHexPreview: string;
}

interface GrpcStreamSummaryUI {
  totalProtobufBytes: number;
  totalJsonBytes: number;
  totalSavingsPercent: number;
  durationMs: number;
  fetchedCount: number;
  newCount: number;
  protoSchema?: string;
}

const PAGE_SIZE = 12;

const logoImage =
  "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/logg-oqkIXOIZABorpkRBo39sUEnZROXYxU.png";

const FILTERS = [
  { id: "ALL", labelEs: "Todas", labelEn: "All" },
  { id: "AI", labelEs: "IA", labelEn: "AI" },
  { id: "ENGINEERING", labelEs: "Ingeniería", labelEn: "Engineering" },
  { id: "EMPLOYABILITY", labelEs: "Empleabilidad", labelEn: "Careers" },
  { id: "MODELS", labelEs: "Modelos", labelEn: "Models" },
] as const;

const CATEGORY_DISPLAY_ES: Record<string, string> = {
  AI: "IA",
  ENGINEERING: "Ingeniería",
  EMPLOYABILITY: "Empleabilidad",
  MODELS: "Modelos",
};

const CATEGORY_DISPLAY_EN: Record<string, string> = {
  AI: "AI",
  ENGINEERING: "Engineering",
  EMPLOYABILITY: "Employability",
  MODELS: "Models",
};

/**
 * Precision section resolver: ensures strict, non-overlapping categorization
 * across [AI, ENGINEERING, MODELS, EMPLOYABILITY].
 */
function resolvePreciseCategory(article: ArticleItem): string {
  if (article.aiModelSpec || article.summary?.category === "MODELS") {
    return "MODELS";
  }

  const text = `${article.summary?.titleEs ?? ""} ${article.summary?.titleEn ?? ""} ${article.summary?.summaryEs ?? ""} ${article.sourceName}`.toLowerCase();
  const dbCategory = article.summary?.category;

  if (
    dbCategory === "EMPLOYABILITY" ||
    /\b(empleabilidad|empleo|empleos|trabajo remoto|remoto|teletrabajo|salari|sueldo|contrataci|vacante|entrevista|despido|layoff|recorte de personal|bolsa|acciones|wall street|nasdaq|ingresos trimestrales|ganancias|adquisici|fusi[oó]n|ipo|mercado laboral|carrera|talento|reclutamiento|headhunter|cnbc)\b/i.test(
      text
    )
  ) {
    return "EMPLOYABILITY";
  }

  if (
    /\b(gpt-[456]|claude 3|gemini [123]|llama [34]|deepseek-r|deepseek-v|mistral|qwen|mmlu|swe-bench|humaneval|ventana de contexto|context window|mill[oó]n de tokens|pesos abiertos|open weights|cuantizaci[oó]n|fine-tuning|ficha t[eé]cnica)\b/i.test(
      text
    )
  ) {
    return "MODELS";
  }

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
    engineeringSources.some((src) =>
      article.sourceName.toLowerCase().includes(src)
    ) ||
    /\b(vulnerabilidad|cve-\d|ransomware|malware|phishing|exploit|zero-day|ciberseguridad|parche|botnet|backdoor|arquitectura de software|microservicios|kubernetes|docker|devops|aws|azure|linux|kernel|postgresql|base de datos|rust|python|typescript|php|golang|compilador|protocolo|cortafuegos|firewall|servidor)\b/i.test(
      text
    )
  ) {
    return "ENGINEERING";
  }

  if (
    dbCategory === "AI" &&
    /\b(inteligencia artificial|agente|agentes|llm|neuronal|aprendizaje autom[aá]tico|machine learning|deep learning|generativ|openai|anthropic|huggingface|hugging face|rob[oó]tica|automatizaci[oó]n|rag|copiloto)\b/i.test(
      text
    )
  ) {
    return "AI";
  }

  if (dbCategory === "PROGRAMMING" || dbCategory === "ENGINEERING") {
    return "ENGINEERING";
  }

  return dbCategory || "ENGINEERING";
}

function formatRelativeTime(
  publishedAt: Date | string | null,
  locale: "es" | "en"
): string {
  if (!publishedAt) return locale === "es" ? "Reciente" : "Recent";
  const pubTime = new Date(publishedAt).getTime();
  if (Number.isNaN(pubTime)) return locale === "es" ? "Reciente" : "Recent";

  const diffMin = Math.max(1, Math.floor((Date.now() - pubTime) / 60000));
  if (diffMin < 60) {
    return locale === "es" ? `Hace ${diffMin} min` : `${diffMin}m ago`;
  }
  const diffHours = Math.floor(diffMin / 60);
  if (diffHours < 24) {
    return locale === "es" ? `Hace ${diffHours} h` : `${diffHours}h ago`;
  }
  const diffDays = Math.floor(diffHours / 24);
  return locale === "es" ? `Hace ${diffDays} d` : `${diffDays}d ago`;
}

export function NewsFeed({ initialArticles }: NewsFeedProps) {
  const { locale, toggleLocale, t } = useLanguage();
  const [articles, setArticles] = useState<ArticleItem[]>(initialArticles);
  const [activeFilter, setActiveFilter] = useState<string>("ALL");
  const [timeRange, setTimeRange] = useState<"7d" | "30d">("7d");
  const [visibleCount, setVisibleCount] = useState<number>(PAGE_SIZE);
  const [menuOpen, setMenuOpen] = useState(false);
  const [selectedArticle, setSelectedArticle] = useState<ArticleItem | null>(
    null
  );

  // Live on-demand gRPC Server-Side Streaming sync state
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncFeedback, setSyncFeedback] = useState<{
    type: "info" | "success" | "error";
    message: string;
  } | null>(null);
  const [grpcFrames, setGrpcFrames] = useState<GrpcStreamFrameUI[]>([]);
  const [grpcSummary, setGrpcSummary] = useState<GrpcStreamSummaryUI | null>(
    null
  );
  const [showGrpcPanel, setShowGrpcPanel] = useState(false);
  const [showProtoModal, setShowProtoModal] = useState(false);

  // SoftStack Newsletter form state
  const [email, setEmail] = useState("");
  const [subStatus, setSubStatus] = useState<
    "idle" | "loading" | "success" | "error"
  >("idle");
  const [subMessage, setSubMessage] = useState("");

  useEffect(() => {
    if (initialArticles && initialArticles.length > 0) {
      setArticles(initialArticles);
    }
  }, [initialArticles]);

  useEffect(() => {
    setVisibleCount(PAGE_SIZE);
  }, [activeFilter, timeRange]);

  useEffect(() => {
    if (syncFeedback) {
      const timer = setTimeout(() => {
        setSyncFeedback(null);
      }, 10000);
      return () => clearTimeout(timer);
    }
  }, [syncFeedback]);

  // Handle on-demand news search via gRPC Server-Side Streaming (`NewsPipelineService.StreamSyncProgress`)
  const handleRefresh = useCallback(async () => {
    if (isSyncing) return;
    setIsSyncing(true);
    setSyncFeedback(null);
    setGrpcFrames([]);
    setGrpcSummary(null);
    setShowGrpcPanel(true);

    const backendUrl =
      process.env.NEXT_PUBLIC_BACKEND_URL || "https://pull-ia-back.vercel.app";

    try {
      let res = await fetch("/api/grpc/sync-stream", {
        method: "POST",
      }).catch(() => null);

      if (!res || !res.ok || !res.body) {
        res = await fetch(`${backendUrl}/api/grpc/sync-stream`, {
          method: "POST",
        }).catch(() => null);
      }

      if (res && res.ok && res.body) {
        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        let buffer = "";

        while (true) {
          const { value, done } = await reader.read();
          if (done) break;
          buffer += decoder.decode(value, { stream: true });

          const lines = buffer.split("\n");
          buffer = lines.pop() ?? "";

          for (const line of lines) {
            if (!line.trim()) continue;
            try {
              const parsed = JSON.parse(line);
              if (parsed.type === "GRPC_STREAM_FRAME" && parsed.frame) {
                setGrpcFrames((prev) => [...prev.slice(-6), parsed.frame]);
              } else if (parsed.type === "GRPC_STREAM_SUMMARY") {
                setGrpcSummary({
                  totalProtobufBytes: parsed.totalProtobufBytes ?? 0,
                  totalJsonBytes: parsed.totalJsonBytes ?? 0,
                  totalSavingsPercent: parsed.totalSavingsPercent ?? 0,
                  durationMs: parsed.durationMs ?? 0,
                  fetchedCount: parsed.fetchedCount ?? 0,
                  newCount: parsed.newCount ?? 0,
                  protoSchema: parsed.protoSchema,
                });

                setSyncFeedback({
                  type: parsed.newCount > 0 ? "success" : "info",
                  message: parsed.message || t.syncUpToDate,
                });

                if (parsed.newCount > 0) {
                  const fetchRes = await fetch(
                    `/api/articles?days=30&limit=100`
                  ).catch(() =>
                    fetch(`${backendUrl}/api/articles?days=30&limit=100`)
                  );
                  if (fetchRes && fetchRes.ok) {
                    const freshData = await fetchRes.json();
                    if (
                      freshData.success &&
                      Array.isArray(freshData.articles)
                    ) {
                      setArticles(freshData.articles);
                    }
                  }
                }
              }
            } catch {
              // Ignore partial chunk JSON error
            }
          }
        }
        return;
      }

      let fallbackRes = await fetch("/api/articles/sync", {
        method: "POST",
      }).catch(() => null);

      if (!fallbackRes || !fallbackRes.ok) {
        fallbackRes = await fetch(`${backendUrl}/api/articles/sync`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
        });
      }

      if (fallbackRes && fallbackRes.ok) {
        const data = await fallbackRes.json();
        setSyncFeedback({
          type: data.newCount > 0 ? "success" : "info",
          message: data.message || t.syncUpToDate,
        });
      }
    } catch (err) {
      console.error("[NewsFeed] Error in gRPC live refresh:", err);
      setSyncFeedback({
        type: "info",
        message: t.syncUpToDate,
      });
    } finally {
      setIsSyncing(false);
    }
  }, [isSyncing, t]);

  // Handle SoftStack Newsletter Subscription (`POST /api/subscribe`)
  const handleSubscribe = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || subStatus === "loading") return;

    setSubStatus("loading");
    setSubMessage("");

    try {
      const backendUrl =
        process.env.NEXT_PUBLIC_BACKEND_URL || "https://pull-ia-back.vercel.app";
      const payload = JSON.stringify({
        email: email.trim(),
        locale,
        interests: [
          Category.AI,
          Category.ENGINEERING,
          Category.MODELS,
          Category.EMPLOYABILITY,
        ],
      });

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
        setSubStatus("success");
        setSubMessage(
          data.message ||
            "¡Suscripción confirmada! Te enviamos la edición de esta semana a tu correo."
        );
        setEmail("");
      } else {
        setSubStatus("error");
        setSubMessage(data.error || t.newsletter.error);
      }
    } catch {
      setSubStatus("error");
      setSubMessage(t.newsletter.error);
    }
  };

  // Filter articles and guarantee unique, contextually accurate tech images
  const filteredArticles = useMemo(() => {
    const now = Date.now();
    const sevenDaysMs = 7 * 24 * 60 * 60 * 1000;
    const thirtyDaysMs = 30 * 24 * 60 * 60 * 1000;
    const maxAgeMs = timeRange === "7d" ? sevenDaysMs : thirtyDaysMs;
    const usedImages = new Set<string>();

    return articles
      .filter((a) => a.summary !== null)
      .map((article) => {
        const preciseCat = resolvePreciseCategory(article);
        const contextText = `${article.summary?.titleEs ?? ""} ${article.summary?.titleEn ?? ""} ${article.summary?.summaryEs ?? ""} ${article.sourceName}`;
        const uniqueImageUrl = getArticleImage(
          article.id,
          preciseCat,
          article.imageUrl,
          contextText,
          usedImages
        );

        return {
          ...article,
          imageUrl: uniqueImageUrl,
          summary: article.summary
            ? { ...article.summary, category: preciseCat }
            : null,
        };
      })
      .filter((article) => {
        if (activeFilter !== "ALL") {
          if (article.summary?.category !== activeFilter) {
            return false;
          }
        }

        if (!article.aiModelSpec && article.publishedAt) {
          const pubTime = new Date(article.publishedAt).getTime();
          if (!Number.isNaN(pubTime) && now - pubTime > maxAgeMs) {
            return false;
          }
        }

        return true;
      });
  }, [articles, activeFilter, timeRange]);

  const visibleArticles = useMemo(() => {
    return filteredArticles.slice(0, visibleCount);
  }, [filteredArticles, visibleCount]);

  const latestFrame = grpcFrames[grpcFrames.length - 1];

  const todayFormatted = useMemo(() => {
    return new Date().toLocaleDateString(
      locale === "es" ? "es-CO" : "en-US",
      {
        day: "numeric",
        month: "long",
        year: "numeric",
      }
    );
  }, [locale]);

  return (
    <div className="site-shell">
      {/* Masthead */}
      <header className="masthead">
        <div className="header-inner">
          <a
            href="#inicio"
            onClick={() => setActiveFilter("ALL")}
            className="brand"
            aria-label="DeplHoy, inicio"
          >
            <span className="brand-crop">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={logoImage}
                alt="Logotipo DeplHoy sobre periódico"
              />
            </span>
            <span className="brand-name">DeplHoy</span>
          </a>

          <nav
            className={menuOpen ? "main-nav is-open" : "main-nav"}
            aria-label="Secciones"
          >
            {FILTERS.map((filter) => (
              <button
                key={filter.id}
                className={
                  activeFilter === filter.id ? "nav-link active" : "nav-link"
                }
                onClick={() => {
                  setActiveFilter(filter.id);
                  setMenuOpen(false);
                }}
              >
                {locale === "es" ? filter.labelEs : filter.labelEn}
              </button>
            ))}
          </nav>

          <div className="header-actions">
            <button
              className="language-button"
              aria-label="Cambiar idioma"
              onClick={toggleLocale}
            >
              <span className={locale === "es" ? "language-active" : ""}>
                ES
              </span>
              <span>/</span>
              <span className={locale === "en" ? "language-active" : ""}>
                EN
              </span>
            </button>

            <a className="newsletter-button" href="#boletin">
              {locale === "es" ? "Suscríbete" : "Subscribe"}{" "}
              <ArrowUpRight size={15} />
            </a>

            <button
              className="menu-button"
              aria-label={menuOpen ? "Cerrar menú" : "Abrir menú"}
              onClick={() => setMenuOpen(!menuOpen)}
            >
              {menuOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main id="inicio">
        {/* Editorial Hero Section */}
        <section className="hero-section">
          <div className="hero-kicker">
            <span className="live-dot" />{" "}
            {locale === "es"
              ? "Las noticias de hoy, sin ruido"
              : "Today's news, without the noise"}
          </div>
          <h1>
            {locale === "es" ? (
              <>
                La información que
                <br />
                <em>mueve el futuro.</em>
              </>
            ) : (
              <>
                The information that
                <br />
                <em>moves the future.</em>
              </>
            )}
          </h1>
          <p className="hero-copy">
            {locale === "es"
              ? "Una mirada clara a la tecnología, la inteligencia artificial y las ideas que están cambiando el mundo."
              : "A clear look at technology, artificial intelligence, and the ideas changing the world."}
          </p>
          <a href="#noticias" className="hero-cta">
            {locale === "es" ? "Leer las noticias" : "Read the news"}{" "}
            <ChevronRight size={17} />
          </a>
        </section>

        {/* News Section */}
        <section className="news-section" id="noticias">
          <div className="section-heading">
            <div>
              <p className="eyebrow">
                {locale === "es"
                  ? `Edición digital · ${todayFormatted}`
                  : `Digital edition · ${todayFormatted}`}
              </p>
              <h2>
                {locale === "es" ? "Últimas noticias" : "Latest news"}
              </h2>
            </div>

            <div className="section-meta">
              <span>
                {String(filteredArticles.length).padStart(2, "0")}{" "}
                {locale === "es" ? "historias" : "stories"}
              </span>
              <span className="rule" />
              <span>
                {isSyncing
                  ? locale === "es"
                    ? "Actualizando..."
                    : "Refreshing..."
                  : locale === "es"
                  ? "Actualizado ahora"
                  : "Updated just now"}
              </span>
            </div>
          </div>

          {/* Filter Bar + Time Window (7d/30d) + Live gRPC Sync Button */}
          <div
            className="filter-bar"
            role="group"
            aria-label="Filtrar noticias"
          >
            <div className="filter-group">
              {FILTERS.map((filter) => (
                <button
                  key={filter.id}
                  className={
                    activeFilter === filter.id ? "filter active" : "filter"
                  }
                  onClick={() => setActiveFilter(filter.id)}
                >
                  {locale === "es" ? filter.labelEs : filter.labelEn}
                </button>
              ))}
            </div>

            <div className="filter-group">
              <button
                type="button"
                className={timeRange === "7d" ? "filter active" : "filter"}
                onClick={() => setTimeRange("7d")}
              >
                {locale === "es" ? "Recientes (7d)" : "Recent (7d)"}
              </button>
              <button
                type="button"
                className={timeRange === "30d" ? "filter active" : "filter"}
                onClick={() => setTimeRange("30d")}
              >
                {locale === "es" ? "Archivo (30d)" : "Archive (30d)"}
              </button>
              <button
                type="button"
                onClick={handleRefresh}
                disabled={isSyncing}
                className="filter red-accent"
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "6px",
                }}
              >
                <RefreshCw
                  size={13}
                  className={isSyncing ? "animate-spin" : ""}
                />
                <span>
                  {isSyncing
                    ? locale === "es"
                      ? "Actualizando..."
                      : "Refreshing..."
                    : locale === "es"
                    ? "Actualizar"
                    : "Refresh"}
                </span>
              </button>
            </div>
          </div>

          {/* Editorial gRPC Server-Side Streaming Live Console */}
          {showGrpcPanel && (grpcFrames.length > 0 || isSyncing) && (
            <div
              style={{
                marginTop: "20px",
                background: "var(--paper-light)",
                border: "2px solid var(--ink)",
                boxShadow: "8px 8px 0 rgba(25,24,23,.22)",
                padding: "18px 22px",
              }}
            >
              <div
                style={{
                  display: "flex",
                  flexWrap: "wrap",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: "10px",
                  borderBottom: "2px solid var(--ink)",
                  paddingBottom: "10px",
                  marginBottom: "12px",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "10px",
                  }}
                >
                  <span className="live-dot" />
                  <span
                    style={{
                      fontSize: "11px",
                      fontWeight: 900,
                      textTransform: "uppercase",
                      letterSpacing: ".12em",
                      color: "var(--red)",
                    }}
                  >
                    gRPC Server-Side Stream · NewsPipelineService/StreamSyncProgress
                  </span>
                </div>

                <div style={{ display: "flex", gap: "8px" }}>
                  {grpcSummary?.protoSchema && (
                    <button
                      type="button"
                      onClick={() => setShowProtoModal((prev) => !prev)}
                      className="filter"
                      style={{ padding: "5px 12px", fontSize: "10px" }}
                    >
                      {showProtoModal
                        ? "Ocultar pullia.proto"
                        : "Ver Contrato pullia.proto"}
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => setShowGrpcPanel(false)}
                    className="icon-button"
                    style={{ width: "26px", height: "26px" }}
                    aria-label="Cerrar panel gRPC"
                  >
                    <X size={14} />
                  </button>
                </div>
              </div>

              <div style={{ display: "grid", gap: "6px" }}>
                {grpcFrames.map((frame, idx) => (
                  <div
                    key={idx}
                    style={{
                      display: "flex",
                      flexWrap: "wrap",
                      justifyContent: "space-between",
                      alignItems: "center",
                      gap: "8px",
                      padding: "6px 10px",
                      background: "var(--paper)",
                      border: "1px solid var(--line)",
                      fontFamily: "monospace",
                      fontSize: "11px",
                    }}
                  >
                    <div>
                      <strong style={{ color: "var(--red)" }}>
                        [{frame.event.stageName}]
                      </strong>{" "}
                      <span>{frame.event.message}</span>
                    </div>
                    <div style={{ color: "var(--muted)", fontWeight: 700 }}>
                      Protobuf: {frame.protobufBytes}B vs JSON:{" "}
                      {frame.jsonBytes}B (-{frame.savingsPercent}%)
                    </div>
                  </div>
                ))}
              </div>

              {latestFrame && (
                <div
                  style={{
                    marginTop: "10px",
                    paddingTop: "10px",
                    borderTop: "1px solid var(--line)",
                    display: "flex",
                    flexWrap: "wrap",
                    justifyContent: "space-between",
                    gap: "10px",
                    fontFamily: "monospace",
                    fontSize: "11px",
                    color: "var(--muted)",
                  }}
                >
                  <span>Wire Frame (Hex): {latestFrame.wireHexPreview}</span>
                  {grpcSummary && (
                    <strong style={{ color: "var(--ink)" }}>
                      Total Protobuf: {grpcSummary.totalProtobufBytes}B vs JSON:{" "}
                      {grpcSummary.totalJsonBytes}B (Ahorro:{" "}
                      {grpcSummary.totalSavingsPercent}%)
                    </strong>
                  )}
                </div>
              )}

              {showProtoModal && grpcSummary?.protoSchema && (
                <pre
                  style={{
                    marginTop: "12px",
                    maxHeight: "220px",
                    overflow: "auto",
                    padding: "12px",
                    background: "#191817",
                    color: "#eee9df",
                    fontSize: "11px",
                  }}
                >
                  {grpcSummary.protoSchema}
                </pre>
              )}
            </div>
          )}

          {/* Sync Feedback Notice */}
          {syncFeedback && (
            <div
              style={{
                marginTop: "16px",
                padding: "12px 18px",
                background: "var(--paper-light)",
                border: "1.5px solid var(--ink)",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                fontSize: "12px",
                fontWeight: 800,
              }}
            >
              <span>{syncFeedback.message}</span>
              <button
                onClick={() => setSyncFeedback(null)}
                style={{
                  border: 0,
                  background: "transparent",
                  cursor: "pointer",
                  fontWeight: 900,
                }}
              >
                ✕
              </button>
            </div>
          )}

          {/* Editorial Story Grid */}
          {visibleArticles.length > 0 ? (
            <>
              <div className="story-grid">
                {visibleArticles.map((article, index) => {
                  const summary = article.summary;
                  const catKey = summary?.category || "ENGINEERING";
                  const categoryLabel =
                    locale === "es"
                      ? CATEGORY_DISPLAY_ES[catKey] || catKey
                      : CATEGORY_DISPLAY_EN[catKey] || catKey;

                  const rawTitle =
                    locale === "es"
                      ? summary?.titleEs || ""
                      : summary?.titleEn || summary?.titleEs || "";
                  const rawSummary =
                    locale === "es"
                      ? summary?.summaryEs || ""
                      : summary?.summaryEn || summary?.summaryEs || "";

                  const title = cleanHtmlText(rawTitle);
                  const cleanExcerpt = cleanHtmlText(rawSummary);
                  const baseExcerpt =
                    cleanExcerpt.length < 35 ||
                    cleanExcerpt.toLowerCase() === title.toLowerCase()
                      ? buildEditorialAnalysis({
                          titleEs: summary?.titleEs || title,
                          titleEn: summary?.titleEn || title,
                          summaryEs: summary?.summaryEs || "",
                          summaryEn: summary?.summaryEn || "",
                          category: String(catKey),
                          sourceName: article.sourceName,
                          locale,
                        }).paragraphs[1]
                      : cleanExcerpt;
                  const excerpt =
                    baseExcerpt.split(". ").slice(0, 2).join(". ") +
                    (baseExcerpt.endsWith(".") ? "" : ".");

                  const storyNumber = String(index + 1).padStart(2, "0");
                  const timeLabel = formatRelativeTime(
                    article.publishedAt,
                    locale
                  );

                  return (
                    <article
                      className={
                        index === 0 ? "story-card featured" : "story-card"
                      }
                      key={article.id}
                      onClick={() => setSelectedArticle(article)}
                    >
                      <div className="story-image-wrap">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={article.imageUrl || ""}
                          alt={title}
                          className="story-image"
                          loading="lazy"
                        />
                        <span className="story-number">{storyNumber}</span>
                      </div>

                      <div className="story-content">
                        <div className="story-topline">
                          <span className="category">{categoryLabel}</span>
                          <span className="story-time">
                            <Clock3 size={13} />
                            {timeLabel}
                          </span>
                        </div>

                        <h3>{title}</h3>
                        <p>{excerpt}</p>

                        <div className="story-footer">
                          <span>{article.sourceName}</span>
                          <div
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: "6px",
                            }}
                          >
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedArticle(article);
                              }}
                              aria-label={`Leer ${title}`}
                              title={
                                locale === "es"
                                  ? "Leer resumen completo"
                                  : "Read full summary"
                              }
                            >
                              <ArrowUpRight size={17} />
                            </button>
                          </div>
                        </div>
                      </div>
                    </article>
                  );
                })}
              </div>

              {/* Progressive Pagination Controls */}
              <div
                style={{
                  marginTop: "36px",
                  paddingTop: "24px",
                  borderTop: "3px double var(--ink)",
                  display: "flex",
                  flexWrap: "wrap",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: "16px",
                }}
              >
                <span
                  style={{
                    fontSize: "11px",
                    fontWeight: 800,
                    textTransform: "uppercase",
                    letterSpacing: ".08em",
                    color: "var(--muted)",
                  }}
                >
                  {t.showingCount} {visibleArticles.length} {t.ofCount}{" "}
                  {filteredArticles.length} (
                  {timeRange === "7d" ? t.filterRecent7d : t.filterArchive30d})
                </span>

                <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                  {visibleCount < filteredArticles.length && (
                    <button
                      type="button"
                      onClick={() =>
                        setVisibleCount((prev) => prev + PAGE_SIZE)
                      }
                      className="filter active"
                    >
                      {t.loadMore} (+
                      {Math.min(
                        PAGE_SIZE,
                        filteredArticles.length - visibleCount
                      )}
                      )
                    </button>
                  )}

                  {visibleCount > PAGE_SIZE && (
                    <button
                      type="button"
                      onClick={() => setVisibleCount(PAGE_SIZE)}
                      className="filter"
                    >
                      {t.showLess}
                    </button>
                  )}

                  {timeRange === "7d" && (
                    <button
                      type="button"
                      onClick={() => setTimeRange("30d")}
                      className="filter"
                    >
                      {t.searchInArchiveCta}
                    </button>
                  )}
                </div>
              </div>
            </>
          ) : (
            <div
              style={{
                marginTop: "28px",
                padding: "64px 24px",
                textAlign: "center",
                border: "1px solid var(--line)",
                background: "rgba(248,244,236,.6)",
              }}
            >
              <h3
                style={{
                  fontFamily: "Georgia, serif",
                  fontSize: "28px",
                  margin: "0 0 8px",
                }}
              >
                {t.noArticlesFound}
              </h3>
              <p
                style={{
                  color: "var(--muted)",
                  fontSize: "13px",
                  marginBottom: "18px",
                }}
              >
                {t.noArticlesDesc}
              </p>
              {timeRange === "7d" && (
                <button
                  type="button"
                  onClick={() => setTimeRange("30d")}
                  className="filter active"
                >
                  {t.searchInArchiveCta}
                </button>
              )}
            </div>
          )}
        </section>

        {/* SoftStack Red Editorial Newsletter Panel */}
        <section className="newsletter-panel" id="boletin">
          <div>
            <p className="eyebrow">
              {locale === "es"
                ? "El resumen de la semana"
                : "The weekly digest"}
            </p>
            <h2>
              {locale === "es" ? (
                <>
                  Tu semana empieza aquí,
                  <br />
                  únete a mi SoftStack.
                </>
              ) : (
                <>
                  Your week starts here,
                  <br />
                  join my SoftStack.
                </>
              )}
            </h2>
            <p className="newsletter-lead">
              {locale === "es" ? (
                <>
                  Las noticias tech que importan, resumidas y en tu correo cada
                  lunes a las <strong>8:00 AM</strong>.
                </>
              ) : (
                <>
                  The tech news that matters, summarized in your inbox every
                  Monday at <strong>8:00 AM</strong>.
                </>
              )}
            </p>
            <p className="newsletter-note">
              {locale === "es"
                ? "Sin ruido. Sin spam. Solo una selección inteligente de lo que está moviendo el mundo."
                : "No noise. No spam. Just a smart selection of what is moving the world."}
            </p>
          </div>

          <form className="signup-form" onSubmit={handleSubscribe}>
            <label className="sr-only" htmlFor="email">
              Tu correo electrónico
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="tu@email.com"
              required
            />
            <button type="submit" disabled={subStatus === "loading"}>
              {subStatus === "loading"
                ? locale === "es"
                  ? "Enviando..."
                  : "Sending..."
                : locale === "es"
                ? "Quiero SoftStack"
                : "Join SoftStack"}{" "}
              <ArrowUpRight size={15} />
            </button>
            <span className="form-note">
              {subMessage
                ? subMessage
                : locale === "es"
                ? "Gratis · Directo a tu inbox"
                : "Free · Straight to your inbox"}
            </span>
          </form>
        </section>
      </main>

      {/* Editorial Article Modal */}
      <ArticleModal
        article={selectedArticle}
        onClose={() => setSelectedArticle(null)}
      />

      {/* Footer */}
      <footer className="footer">
        <span>© 2026 DeplHoy</span>
        <span>
          {locale === "es"
            ? "Hecho para quienes construyen lo que viene."
            : "Built for those who build what's next."}
        </span>
        <a href="#inicio">
          {locale === "es" ? "Volver arriba ↑" : "Back to top ↑"}
        </a>
      </footer>
    </div>
  );
}
