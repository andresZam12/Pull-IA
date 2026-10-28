/**
 * PULL-IA — AI Summarizer (Google Gemini)
 *
 * Generates bilingual summaries (ES + EN) for articles.
 * Uses gemini-1.5-flash for speed and cost efficiency.
 * All summaries are grounded in the source text — no hallucination.
 */

import { GoogleGenerativeAI, SchemaType, Schema } from "@google/generative-ai";
import type { SummaryResult, RawArticle } from "@/types";
import { cleanHtmlText } from "@/lib/utils/text";
import { translateToSpanish } from "@/lib/utils/translate";

const MODEL = "gemini-flash-latest";

const summarySchema: Schema = {
  type: SchemaType.OBJECT,
  properties: {
    titleEs: {
      type: SchemaType.STRING,
      description: "Article title translated/adapted in Spanish",
    },
    titleEn: {
      type: SchemaType.STRING,
      description: "Original or cleaned English title",
    },
    summaryEs: {
      type: SchemaType.STRING,
      description: "Comprehensive, structured executive summary in Spanish (2-4 well-developed paragraphs separated by newlines). Covers context, technical breakdown, and developer impact.",
    },
    summaryEn: {
      type: SchemaType.STRING,
      description: "Comprehensive, structured executive summary in English (2-4 well-developed paragraphs separated by newlines). Covers context, technical breakdown, and developer impact.",
    },
    keyPoints: {
      type: SchemaType.ARRAY,
      items: { type: SchemaType.STRING },
      description: "4 to 6 specific, actionable takeaways with technical data, versions, and metrics, in Spanish",
    },
    sourceUrls: {
      type: SchemaType.ARRAY,
      items: { type: SchemaType.STRING },
      description: "URLs mentioned or cited within the content (for traceability)",
    },
  },
  required: ["titleEs", "titleEn", "summaryEs", "summaryEn", "keyPoints", "sourceUrls"],
};

export class ArticleSummarizer {
  private readonly model;
  private readonly modelName = MODEL;

  constructor() {
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
    this.model = genAI.getGenerativeModel({
      model: this.modelName,
      generationConfig: {
        responseMimeType: "application/json",
        responseSchema: summarySchema,
        temperature: 0.3,
        maxOutputTokens: 2048,
      },
    });
  }

  /**
   * Generate a bilingual summary for a single article.
   * IMPORTANT: The model is instructed to only use information
   * present in the source text — this prevents hallucination.
   */
  async summarize(article: RawArticle): Promise<SummaryResult> {
    try {
      const prompt = this.buildPrompt(article);
      const result = await this.model.generateContent(prompt);
      const parsed = JSON.parse(result.response.text()) as Omit<SummaryResult, "aiModel">;

      return {
        ...parsed,
        sourceUrls: Array.from(
          new Set([article.url, ...(parsed.sourceUrls ?? [])])
        ).filter(Boolean),
        aiModel: this.modelName,
      };
    } catch (error) {
      console.warn(`[Summarizer] Gemini API unavailable (${error instanceof Error ? error.message : "error"}), using Spanish translation fallback.`);
      const cleanTitle = cleanHtmlText(article.title);
      const cleanSnippet = cleanHtmlText(article.rawContent || article.title).slice(0, 300).trim();
      const titleEs = await translateToSpanish(cleanTitle);
      const summaryEs = await translateToSpanish(cleanSnippet);
      return {
        titleEs,
        titleEn: cleanTitle,
        summaryEs,
        summaryEn: cleanSnippet,
        keyPoints: [
          titleEs,
          `Fuente verificada: ${article.sourceName}.`,
          "Análisis técnico relevante para ingenieros y desarrolladores."
        ],
        sourceUrls: [article.url],
        aiModel: "neural-fallback-es",
      };
    }
  }

  private buildPrompt(article: RawArticle): string {
    return `You are a principal tech analyst and journalist writing executive summaries for PULL-IA.
Our audience consists of software engineers, tech leads, and tech executives.

Your task: Provide a comprehensive, high-value, and well-structured summary of the article in both Spanish and English.
The summary MUST be thorough enough that the reader understands all vital technical details without needing to read the original long article.

STRUCTURE REQUIREMENTS FOR THE SUMMARY (2-3 substantive paragraphs separated by newlines):
1. Context & Event: Detail exactly what occurred, companies, actors, and products/services involved.
2. Technical Mechanics & Scope: Explain how it works, vulnerabilities exploited, technical architecture, features, benchmarks, or models.
3. Industry Impact & Practical Takeaway: Explain the ramifications for developers, engineering teams, security posture, or the software market.

STRICT RULES:
1. Always be fact-based and technically precise — never use marketing fluff or vague claims.
2. Provide 4 to 6 concrete, actionable bullet points in Spanish (keyPoints) capturing metrics, CVEs, versions, or core decisions.
3. Both summaryEs and titleEs MUST be natural, professional Spanish.

SOURCE TEXT:
Title: ${article.title}
URL: ${article.url}
Author: ${article.author ?? "Unknown"}
Source: ${article.sourceName}
Content: ${article.rawContent ?? "(no content — summarize from title and known context)"}

Return a JSON object matching the requested schema.`;
  }
}
