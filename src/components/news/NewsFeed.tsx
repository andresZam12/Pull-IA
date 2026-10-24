"use client";

import { useState, useMemo } from "react";
import { Navbar } from "@/components/ui/Navbar";
import { NewsCard, type ArticleItem } from "@/components/news/NewsCard";
import { Footer } from "@/components/ui/Footer";

interface NewsFeedProps {
  initialArticles: ArticleItem[];
}

export function NewsFeed({ initialArticles }: NewsFeedProps) {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [locale, setLocale] = useState<"es" | "en">("es");
  const [searchQuery, setSearchQuery] = useState("");

  const toggleLocale = () => {
    setLocale((prev) => (prev === "es" ? "en" : "es"));
  };

  const filteredArticles = useMemo(() => {
    return initialArticles.filter((article) => {
      // Category filter
      if (selectedCategory && article.summary?.category !== selectedCategory) {
        return false;
      }

      // Search query filter
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const title = (locale === "es" ? article.summary?.titleEs : article.summary?.titleEn) || "";
        const summary = (locale === "es" ? article.summary?.summaryEs : article.summary?.summaryEn) || "";
        const source = article.sourceName.toLowerCase();
        return (
          title.toLowerCase().includes(query) ||
          summary.toLowerCase().includes(query) ||
          source.includes(query)
        );
      }

      return true;
    });
  }, [initialArticles, selectedCategory, searchQuery, locale]);

  return (
    <div className="flex min-h-screen flex-col bg-zinc-950 text-zinc-100 selection:bg-indigo-500 selection:text-white">
      {/* Navbar with Category & Locale triggers */}
      <Navbar
        activeCategory={selectedCategory ?? "ALL"}
        onSelectCategory={setSelectedCategory}
        locale={locale}
        onToggleLocale={toggleLocale}
      />

      {/* Hero Section */}
      <section className="relative overflow-hidden border-b border-zinc-800/80 bg-gradient-to-b from-indigo-950/20 via-zinc-950 to-zinc-950 px-4 py-16 sm:px-6 sm:py-24 lg:px-8">
        <div className="mx-auto max-w-5xl text-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-violet-500/30 bg-violet-500/10 px-3.5 py-1 text-xs font-semibold text-violet-300">
            <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
            {locale === "es" ? "Noticias globales curadas con IA" : "Global tech news curated with AI"}
          </div>

          <h1 className="mt-6 text-4xl font-black tracking-tight text-white sm:text-6xl sm:leading-none">
            {locale === "es" ? (
              <>
                Todo lo que importa en tech,{" "}
                <span className="bg-gradient-to-r from-indigo-400 via-violet-400 to-cyan-300 bg-clip-text text-transparent">
                  sin el ruido.
                </span>
              </>
            ) : (
              <>
                Everything that matters in tech,{" "}
                <span className="bg-gradient-to-r from-indigo-400 via-violet-400 to-cyan-300 bg-clip-text text-transparent">
                  zero noise.
                </span>
              </>
            )}
          </h1>

          <p className="mx-auto mt-6 max-w-2xl text-base leading-relaxed text-zinc-300 sm:text-lg">
            {locale === "es"
              ? "Deplhoy rastrea fuentes oficiales (OpenAI, Anthropic, TechCrunch, Wired, Dev.to) y genera resúmenes concisos con la arquitectura PULL-IA para programadores y líderes tecnológicos."
              : "Deplhoy monitors world-class sources (OpenAI, Anthropic, TechCrunch, Wired, Dev.to) and delivers concise summaries powered by PULL-IA."}
          </p>

          {/* Quick Search Input */}
          <div className="mx-auto mt-8 max-w-md">
            <div className="relative">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={
                  locale === "es"
                    ? "Buscar por palabra clave, fuente o tema..."
                    : "Search by keyword, source, or topic..."
                }
                className="w-full rounded-2xl border border-zinc-800 bg-zinc-900/90 py-3.5 pl-11 pr-4 text-sm text-white placeholder-zinc-500 shadow-inner focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
              />
              <svg
                className="absolute left-4 top-4 h-4 w-4 text-zinc-500"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
            </div>
          </div>
        </div>
      </section>

      {/* Main Content Area */}
      <main className="mx-auto flex-1 max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        {/* Results Header */}
        <div className="mb-8 flex items-center justify-between border-b border-zinc-800/80 pb-4">
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold text-white">
              {selectedCategory
                ? `${locale === "es" ? "Categoría:" : "Category:"} ${selectedCategory}`
                : locale === "es" ? "Últimas publicaciones" : "Latest updates"}
            </h2>
            <span className="rounded-full bg-zinc-800 px-2.5 py-0.5 text-xs font-semibold text-zinc-300">
              {filteredArticles.length}
            </span>
          </div>

          {selectedCategory && (
            <button
              onClick={() => setSelectedCategory(null)}
              className="text-xs font-medium text-indigo-400 hover:text-indigo-300"
            >
              {locale === "es" ? "Mostrar todas" : "Show all"}
            </button>
          )}
        </div>

        {/* Articles Grid */}
        {filteredArticles.length > 0 ? (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {filteredArticles.map((article) => (
              <NewsCard key={article.id} article={article} locale={locale} />
            ))}
          </div>
        ) : (
          <div className="rounded-2xl border border-dashed border-zinc-800 py-20 text-center">
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
            <h3 className="mt-4 text-sm font-semibold text-white">
              {locale === "es" ? "No se encontraron noticias" : "No articles found"}
            </h3>
            <p className="mt-1 text-xs text-zinc-500">
              {locale === "es"
                ? "Prueba cambiando de categoría o usando otros términos de búsqueda."
                : "Try selecting a different category or search term."}
            </p>
          </div>
        )}
      </main>

      {/* Footer with Newsletter subscription */}
      <Footer locale={locale} />
    </div>
  );
}
