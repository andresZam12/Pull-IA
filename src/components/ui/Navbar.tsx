"use client";

import Link from "next/link";
import { useState } from "react";
import { Category } from "@/types";

interface NavbarProps {
  activeCategory?: string;
  onSelectCategory?: (category: string | null) => void;
  locale?: "es" | "en";
  onToggleLocale?: () => void;
}

export function Navbar({
  activeCategory = "ALL",
  onSelectCategory,
  locale = "es",
  onToggleLocale,
}: NavbarProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const categories = [
    { id: "ALL", labelEs: "Todas", labelEn: "All" },
    { id: Category.AI, labelEs: "Inteligencia Artificial", labelEn: "AI" },
    { id: Category.ENGINEERING, labelEs: "Ingeniería", labelEn: "Engineering" },
    { id: Category.PROGRAMMING, labelEs: "Programación", labelEn: "Programming" },
    { id: Category.EMPLOYABILITY, labelEs: "Empleabilidad", labelEn: "Careers" },
  ];

  const handleCategoryClick = (id: string) => {
    if (onSelectCategory) {
      onSelectCategory(id === "ALL" ? null : id);
    }
    setMobileMenuOpen(false);
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b border-zinc-800/80 bg-zinc-950/85 backdrop-blur-md">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6 lg:px-8">
        
        {/* Brand Logo & Engine Badge */}
        <div className="flex items-center gap-3">
          <Link
            href="/"
            onClick={() => handleCategoryClick("ALL")}
            className="group flex items-center gap-2 text-2xl font-black tracking-tight text-white transition hover:opacity-90"
          >
            <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-tr from-indigo-600 via-violet-500 to-cyan-400 font-mono text-lg font-bold text-white shadow-lg shadow-indigo-500/25">
              D
            </span>
            <span className="bg-gradient-to-r from-white via-zinc-100 to-zinc-400 bg-clip-text text-transparent">
              Deplhoy
            </span>
          </Link>

          {/* Infrastructure engine indicator */}
          <span className="hidden items-center gap-1.5 rounded-full border border-violet-500/30 bg-violet-500/10 px-2.5 py-0.5 text-[11px] font-medium text-violet-300 md:inline-flex">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
            powered by PULL-IA
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
                className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-all ${
                  isSelected
                    ? "bg-zinc-800 text-white shadow-sm ring-1 ring-zinc-700"
                    : "text-zinc-400 hover:bg-zinc-900 hover:text-zinc-200"
                }`}
              >
                {locale === "es" ? cat.labelEs : cat.labelEn}
              </button>
            );
          })}
        </nav>

        {/* Actions: Locale Toggle & Subscribe CTA */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Language Toggle */}
          <button
            type="button"
            onClick={onToggleLocale}
            className="flex items-center gap-1 rounded-lg border border-zinc-800 bg-zinc-900/80 px-2.5 py-1.5 text-xs font-semibold text-zinc-300 transition hover:border-zinc-700 hover:bg-zinc-800 hover:text-white"
            title="Cambiar idioma / Toggle language"
          >
            <span className={locale === "es" ? "text-indigo-400 font-bold" : "text-zinc-500"}>ES</span>
            <span className="text-zinc-600">/</span>
            <span className={locale === "en" ? "text-indigo-400 font-bold" : "text-zinc-500"}>EN</span>
          </button>

          {/* Newsletter anchor button */}
          <a
            href="#newsletter"
            className="hidden rounded-lg bg-indigo-600 px-3.5 py-1.5 text-xs font-semibold text-white shadow-sm transition hover:bg-indigo-500 sm:inline-block"
          >
            {locale === "es" ? "Boletín semanal" : "Weekly Newsletter"}
          </a>

          {/* Mobile Menu Button */}
          <button
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="inline-flex items-center justify-center rounded-lg border border-zinc-800 p-1.5 text-zinc-400 hover:bg-zinc-900 hover:text-white lg:hidden"
            aria-label="Toggle navigation menu"
          >
            <svg
              className="h-5 w-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              {mobileMenuOpen ? (
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              ) : (
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 6h16M4 12h16M4 18h16"
                />
              )}
            </svg>
          </button>
        </div>
      </div>

      {/* Mobile Category Navigation Dropdown */}
      {mobileMenuOpen && (
        <div className="border-t border-zinc-800/80 bg-zinc-950 px-4 py-3 lg:hidden">
          <div className="flex flex-col gap-1">
            {categories.map((cat) => {
              const isSelected =
                activeCategory === cat.id ||
                (cat.id === "ALL" && !activeCategory);

              return (
                <button
                  key={cat.id}
                  onClick={() => handleCategoryClick(cat.id)}
                  className={`flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-xs font-medium transition ${
                    isSelected
                      ? "bg-zinc-800 text-white font-semibold"
                      : "text-zinc-400 hover:bg-zinc-900 hover:text-zinc-200"
                  }`}
                >
                  <span>{locale === "es" ? cat.labelEs : cat.labelEn}</span>
                  {isSelected && (
                    <span className="h-1.5 w-1.5 rounded-full bg-indigo-400" />
                  )}
                </button>
              );
            })}
            <a
              href="#newsletter"
              onClick={() => setMobileMenuOpen(false)}
              className="mt-2 block w-full rounded-lg bg-indigo-600 py-2 text-center text-xs font-semibold text-white transition hover:bg-indigo-500 sm:hidden"
            >
              {locale === "es" ? "Boletín semanal" : "Weekly Newsletter"}
            </a>
          </div>
        </div>
      )}
    </header>
  );
}
