"use client";

import Link from "next/link";
import { useState } from "react";
import { Category } from "@/types";
import { useLanguage } from "@/context/LanguageContext";

interface NavbarProps {
  activeCategory?: string;
  onSelectCategory?: (category: string | null) => void;
}

export function Navbar({
  activeCategory = "ALL",
  onSelectCategory,
}: NavbarProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { locale, toggleLocale, t } = useLanguage();

  const categories = [
    { id: "ALL", label: t.categories.ALL },
    { id: Category.AI, label: t.categories[Category.AI] },
    { id: Category.ENGINEERING, label: t.categories[Category.ENGINEERING] },
    { id: Category.PROGRAMMING, label: t.categories[Category.PROGRAMMING] },
    { id: Category.EMPLOYABILITY, label: t.categories[Category.EMPLOYABILITY] },
  ];

  const handleCategoryClick = (id: string) => {
    if (onSelectCategory) {
      onSelectCategory(id === "ALL" ? null : id);
    }
    setMobileMenuOpen(false);
  };

  return (
    <header className="sticky top-0 z-40 w-full border-b border-zinc-800/80 bg-zinc-950/85 backdrop-blur-md">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6 lg:px-8">
        
        {/* Brand Logo & Engine Badge */}
        <div className="flex items-center gap-3">
          <Link
            href="/"
            onClick={() => handleCategoryClick("ALL")}
            className="group flex items-center gap-2 text-2xl font-black tracking-tight text-white transition hover:opacity-90"
          >
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-tr from-indigo-600 via-violet-500 to-cyan-400 font-mono text-lg font-bold text-white shadow-lg shadow-indigo-500/25">
              D
            </span>
            <span className="bg-gradient-to-r from-white via-zinc-100 to-zinc-400 bg-clip-text text-transparent">
              Deplhoy
            </span>
          </Link>

          {/* Infrastructure engine indicator */}
          <span className="hidden items-center gap-1.5 rounded-full border border-violet-500/30 bg-violet-500/10 px-2.5 py-0.5 text-[11px] font-medium text-violet-300 md:inline-flex">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
            {t.brandSubtitle}
          </span>
        </div>

        {/* Desktop Category Navigation */}
        <nav className="hidden items-center gap-1 lg:flex">
          {categories.map((cat) => {
            const isSelected =
              activeCategory === cat.id ||
              (cat.id === "ALL" && !activeCategory);

            return (
              <button
                key={cat.id}
                onClick={() => handleCategoryClick(cat.id)}
                className={`rounded-xl px-3.5 py-2 text-xs font-semibold transition-all ${
                  isSelected
                    ? "bg-zinc-800 text-white shadow-sm ring-1 ring-zinc-700"
                    : "text-zinc-400 hover:bg-zinc-900 hover:text-zinc-200"
                }`}
              >
                {cat.label}
              </button>
            );
          })}
        </nav>

        {/* Actions: Global Language Switch & Newsletter CTA */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Global Language Toggle */}
          <button
            type="button"
            onClick={toggleLocale}
            className="flex items-center gap-1 rounded-xl border border-zinc-800 bg-zinc-900/90 px-3 py-1.5 text-xs font-bold transition hover:border-zinc-700 hover:bg-zinc-800"
            title="Cambiar idioma global / Toggle global language"
          >
            <span className={locale === "es" ? "text-indigo-400" : "text-zinc-500 font-normal"}>
              ES
            </span>
            <span className="text-zinc-600">/</span>
            <span className={locale === "en" ? "text-indigo-400" : "text-zinc-500 font-normal"}>
              EN
            </span>
          </button>

          {/* Newsletter anchor button */}
          <a
            href="#newsletter"
            className="hidden rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 px-4 py-2 text-xs font-bold text-white shadow-md shadow-indigo-600/20 transition hover:from-indigo-500 hover:to-violet-500 sm:inline-block"
          >
            {t.newsletter.badge}
          </a>

          {/* Mobile Menu Button */}
          <button
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="inline-flex items-center justify-center rounded-xl border border-zinc-800 p-2 text-zinc-400 hover:bg-zinc-900 hover:text-white lg:hidden"
            aria-label="Toggle navigation menu"
          >
            <svg
              className="h-5 w-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              {mobileMenuOpen ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              )}
            </svg>
          </button>
        </div>
      </div>

      {/* Mobile Category Navigation Dropdown */}
      {mobileMenuOpen && (
        <div className="border-t border-zinc-800/80 bg-zinc-950 px-4 py-3 lg:hidden">
          <div className="flex flex-col gap-1.5">
            {categories.map((cat) => {
              const isSelected =
                activeCategory === cat.id ||
                (cat.id === "ALL" && !activeCategory);

              return (
                <button
                  key={cat.id}
                  onClick={() => handleCategoryClick(cat.id)}
                  className={`flex w-full items-center justify-between rounded-xl px-3.5 py-2.5 text-left text-xs font-medium transition ${
                    isSelected
                      ? "bg-zinc-800 text-white font-bold"
                      : "text-zinc-400 hover:bg-zinc-900 hover:text-zinc-200"
                  }`}
                >
                  <span>{cat.label}</span>
                  {isSelected && (
                    <span className="h-2 w-2 rounded-full bg-indigo-400" />
                  )}
                </button>
              );
            })}
            <a
              href="#newsletter"
              onClick={() => setMobileMenuOpen(false)}
              className="mt-2 block w-full rounded-xl bg-indigo-600 py-2.5 text-center text-xs font-bold text-white transition hover:bg-indigo-500 sm:hidden"
            >
              {t.newsletter.badge}
            </a>
          </div>
        </div>
      )}
    </header>
  );
}
