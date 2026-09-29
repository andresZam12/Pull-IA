/**
 * PULL-IA — TypeScript shared types
 * Central definitions for the entire application
 */

// ─────────────────────────────────────────────
// ENUMS (mirrors Prisma enums)
// ─────────────────────────────────────────────

export enum Category {
  AI = "AI",
  ENGINEERING = "ENGINEERING",
  PROGRAMMING = "PROGRAMMING",
  EMPLOYABILITY = "EMPLOYABILITY",
}

export enum ArticleStatus {
  PENDING = "PENDING",
  PROCESSING = "PROCESSING",
  PUBLISHED = "PUBLISHED",
  REJECTED = "REJECTED",
  DUPLICATE = "DUPLICATE",
}

export enum SourceType {
  RSS = "RSS",
  API = "API",
  SCRAPER = "SCRAPER",
}

// ─────────────────────────────────────────────
// RAW ARTICLE (from fetchers, before DB)
// ─────────────────────────────────────────────

export interface RawArticle {
  title: string;
  url: string;
  rawContent?: string;
  author?: string;
  imageUrl?: string;
  publishedAt?: Date;
  sourceName: string;
  sourceUrl: string;
}

// ─────────────────────────────────────────────
// AI CLASSIFICATION RESULT
// ─────────────────────────────────────────────

export interface ClassificationResult {
  category: Category;
  relevanceScore: number; // 0.0 - 1.0
  keyPoints: string[];
  tags: string[];
  isRelevant: boolean; // false if score < threshold
}

// ─────────────────────────────────────────────
// AI SUMMARY RESULT
// ─────────────────────────────────────────────

export interface SummaryResult {
  titleEs: string;
  titleEn: string;
  summaryEs: string;
  summaryEn: string;
  keyPoints: string[];
  sourceUrls: string[];
  aiModel: string;
}

// ─────────────────────────────────────────────
// PROCESSED ARTICLE (for frontend)
// ─────────────────────────────────────────────

export interface ProcessedArticle {
  id: string;
  title: string; // localized
  summary: string; // localized
  category: Category;
  relevanceScore: number;
  finalScore: number;
  keyPoints: string[];
  sourceUrls: string[];
  imageUrl?: string;
  publishedAt?: Date;
  sourceName: string;
  tags: string[];
}

// ─────────────────────────────────────────────
// FETCHER CONFIGURATION
// ─────────────────────────────────────────────

export interface FetcherConfig {
  name: string;
  slug: string;
  url: string;
  feedUrl?: string;
  type: SourceType;
  categories: Category[];
  language: string;
  reputationScore: number;
}

// ─────────────────────────────────────────────
// PIPELINE RESULT
// ─────────────────────────────────────────────

export interface PipelineResult {
  fetched: number;
  deduplicated: number;
  classified: number;
  published: number;
  rejected: number;
  errors: PipelineError[];
  duration: number; // ms
}

export interface PipelineError {
  source: string;
  message: string;
  timestamp: Date;
}

// ─────────────────────────────────────────────
// NEWSLETTER
// ─────────────────────────────────────────────

export interface NewsletterArticleItem {
  id: string;
  title: string;
  summary: string;
  category: Category;
  keyPoints: string[];
  sourceUrls: string[];
  imageUrl?: string;
  sourceName: string;
}

// ─────────────────────────────────────────────
// SUBSCRIBE FORM
// ─────────────────────────────────────────────

export interface SubscribePayload {
  email: string;
  name?: string;
  locale?: "es" | "en";
  interests?: Category[];
}

// ─────────────────────────────────────────────
// API RESPONSES
// ─────────────────────────────────────────────

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

// ─────────────────────────────────────────────
// LOCALE
// ─────────────────────────────────────────────

export type Locale = "es" | "en";

export interface LocalizedField {
  es: string;
  en: string;
}
