"use client";

import React from "react";

export interface ModelSpecs {
  modelName: string;
  provider: string;
  licenseType: string;
  contextWindowTokens: number;
  avgLatencyMs?: number;
  costInputPerM: number;
  costOutputPerM: number;
  mmluScore?: number;
  tokensPerSecond?: number;
  technicalAdvantages: string[];
  criticalLimitations: string[];
  idealArchitecturalUsecases: string[];
}

interface ModelSpecCardProps {
  specs: ModelSpecs;
  articleUrl?: string;
}

export function ModelSpecCard({ specs, articleUrl }: ModelSpecCardProps) {
  const formatContext = (tokens: number) => {
    return tokens >= 1_000_000
      ? `${(tokens / 1_000_000).toFixed(1)}M tokens`
      : `${(tokens / 1_000).toFixed(0)}K tokens`;
  };

  return (
    <article
      className="group relative flex flex-col justify-between overflow-hidden rounded-3xl border border-zinc-800/90 bg-zinc-950/80 p-6 sm:p-7 shadow-xl shadow-emerald-950/20 backdrop-blur-xl transition-all duration-300 hover:-translate-y-1 hover:border-emerald-500/50 hover:shadow-2xl hover:shadow-emerald-500/10"
      aria-label={`Ficha técnica del modelo ${specs.modelName}`}
    >
      <div>
        {/* Top Header Badge */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-zinc-800/80 pb-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="rounded-md border border-emerald-500/40 bg-emerald-500/10 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-emerald-300">
                Ficha Técnica de Ingeniería
              </span>
              <span className="text-xs text-zinc-500">•</span>
              <span className="text-xs font-semibold text-zinc-400">{specs.provider}</span>
            </div>
            <h3 className="mt-2 text-2xl font-black tracking-tight text-white transition-colors group-hover:text-emerald-300">
              {specs.modelName}
            </h3>
          </div>

          <span className="rounded-full border border-zinc-700/80 bg-zinc-900 px-3.5 py-1 text-xs font-semibold text-zinc-300">
            {specs.licenseType}
          </span>
        </div>

        {/* Metrics Grid */}
        <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <div className="rounded-2xl border border-zinc-800/80 bg-zinc-900/50 p-3 text-center transition hover:bg-zinc-900">
            <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">Contexto</span>
            <p className="mt-1 text-base font-black text-white">{formatContext(specs.contextWindowTokens)}</p>
          </div>

          <div className="rounded-2xl border border-zinc-800/80 bg-zinc-900/50 p-3 text-center transition hover:bg-zinc-900">
            <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">MMLU Benchmark</span>
            <p className="mt-1 text-base font-black text-emerald-400">
              {specs.mmluScore ? `${specs.mmluScore}%` : "N/D"}
            </p>
          </div>

          <div className="rounded-2xl border border-zinc-800/80 bg-zinc-900/50 p-3 text-center transition hover:bg-zinc-900">
            <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">Costo / 1M In</span>
            <p className="mt-1 text-base font-black text-zinc-200">
              {specs.costInputPerM > 0 ? `$${specs.costInputPerM.toFixed(2)}` : "Gratis"}
            </p>
          </div>

          <div className="rounded-2xl border border-zinc-800/80 bg-zinc-900/50 p-3 text-center transition hover:bg-zinc-900">
            <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">Costo / 1M Out</span>
            <p className="mt-1 text-base font-black text-zinc-200">
              {specs.costOutputPerM > 0 ? `$${specs.costOutputPerM.toFixed(2)}` : "Gratis"}
            </p>
          </div>
        </div>

        {/* Technical Advantages */}
        <div className="mt-5 space-y-4">
          <div>
            <h4 className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-emerald-400">
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
              </svg>
              Ventajas Técnicas vs Competencia
            </h4>
            <ul className="mt-2 space-y-1.5 text-xs leading-relaxed text-zinc-300">
              {specs.technicalAdvantages.map((adv, idx) => (
                <li key={idx} className="flex items-start gap-2">
                  <span className="mt-0.5 text-emerald-500 font-bold">✓</span>
                  <span>{adv}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Critical Limitations */}
          <div>
            <h4 className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-amber-400">
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              Limitaciones Críticas
            </h4>
            <ul className="mt-2 space-y-1.5 text-xs leading-relaxed text-zinc-400">
              {specs.criticalLimitations.map((lim, idx) => (
                <li key={idx} className="flex items-start gap-2">
                  <span className="mt-0.5 text-amber-500 font-bold">⚠</span>
                  <span>{lim}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Architectural Use Cases */}
          <div className="rounded-2xl border border-zinc-800/80 bg-zinc-900/60 p-4">
            <h4 className="text-[11px] font-bold uppercase tracking-wider text-indigo-400">
              Casos de Uso Ideales en Arquitectura
            </h4>
            <div className="mt-2.5 flex flex-wrap gap-2">
              {specs.idealArchitecturalUsecases.map((usecase, idx) => (
                <span
                  key={idx}
                  className="rounded-lg border border-indigo-500/25 bg-indigo-500/10 px-2.5 py-1 text-[11px] font-semibold text-indigo-300"
                >
                  {usecase}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* External Reference Link */}
      {articleUrl && (
        <div className="mt-6 pt-4 border-t border-zinc-900 flex justify-end">
          <a
            href={articleUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-400 transition hover:text-emerald-300"
          >
            <span>Ver benchmark y documentación</span>
            <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
            </svg>
          </a>
        </div>
      )}
    </article>
  );
}
