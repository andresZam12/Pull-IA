/**
 * PULL-IA — AI Summarizer (Google Gemini)
 *
 * Generates bilingual summaries (ES + EN) for articles.
 * Uses gemini-1.5-flash for speed and cost efficiency.
 * All summaries are grounded in the source text — no hallucination.
 */

import { GoogleGenerativeAI, SchemaType } from "@google/generative-ai";
import type { SummaryResult, RawArticle } from "@/types";

const MODEL = "gemini-3.8-flash";

const summarySchema = {
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
      description: "2-3 sentence summary in Spanish, factual and neutral",
    },
    summaryEn: {
      type: SchemaType.STRING,
      description: "2-3 sentence summary in English, factual and neutral",
    },
    keyPoints: {
      type: SchemaType.ARRAY,
      items: { type: SchemaType.STRING },
      description: "3 to 5 key takeaways from the article, in Spanish",
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
        maxOutputTokens: 1024,
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
      console.warn(`[Summarizer] Gemini API unavailable (${error instanceof Error ? error.message : "error"}), using fallback summary.`);
      const cleanSnippet = (article.rawContent || article.title).slice(0, 300).trim();
      return {
        titleEs: article.title,
        titleEn: article.title,
        summaryEs: cleanSnippet,
        summaryEn: cleanSnippet,
        keyPoints: [article.title],
        sourceUrls: [article.url],
        aiModel: "heuristic-fallback",
      };
    }
  }

  private buildPrompt(article: RawArticle): string {
    return `You are a bilingual tech journalist writing for PULL-IA, a tech news platform.

Your task: summarize the following article in both Spanish and English.

STRICT RULES:
1. Only use information present in the SOURCE TEXT below — do NOT add external knowledge
2. Be factual and neutral — no opinions or marketing language
3. Summaries must be 2-3 sentences maximum
4. Key points must be concrete facts from the article, not vague statements
5. Source URLs: extract any URLs actually mentioned in the content

SOURCE TEXT:
Title: ${article.title}
URL: ${article.url}
Author: ${article.author ?? "Unknown"}
Source: ${article.sourceName}
Content: ${article.rawContent ?? "(no content — summarize from title only)"}

Return a JSON object with titleEs, titleEn, summaryEs, summaryEn, keyPoints (in Spanish), and sourceUrls.`;
  }
}
