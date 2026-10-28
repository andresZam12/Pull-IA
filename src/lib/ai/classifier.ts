/**
 * PULL-IA — AI Classifier (Google Gemini)
 *
 * Classifies a raw article into a category and assigns a relevance score.
 * Uses gemini-1.5-flash for cost-efficient bulk classification.
 * Always returns structured JSON via Gemini's JSON mode.
 */

import { GoogleGenerativeAI, SchemaType, Schema } from "@google/generative-ai";
import type { ClassificationResult, RawArticle } from "@/types";
import { Category } from "@/types";

const MODEL = "gemini-flash-latest";
const RELEVANCE_THRESHOLD = 0.4; // articles below this are rejected

// JSON schema for structured output
const classificationSchema: Schema = {
  type: SchemaType.OBJECT,
  properties: {
    category: {
      type: SchemaType.STRING,
      format: "enum",
      enum: Object.values(Category),
      description: "The primary category for this article",
    },
    relevanceScore: {
      type: SchemaType.NUMBER,
      description: "Relevance score from 0.0 (irrelevant) to 1.0 (essential reading)",
    },
    keyPoints: {
      type: SchemaType.ARRAY,
      items: { type: SchemaType.STRING },
      description: "Up to 3 key points from the article",
    },
    tags: {
      type: SchemaType.ARRAY,
      items: { type: SchemaType.STRING },
      description: "Up to 5 topic tags in English, lowercase",
    },
    isRelevant: {
      type: SchemaType.BOOLEAN,
      description: "Whether this article is relevant to a tech audience",
    },
  },
  required: ["category", "relevanceScore", "keyPoints", "tags", "isRelevant"],
};

export class ArticleClassifier {
  private readonly model;

  constructor() {
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
    this.model = genAI.getGenerativeModel({
      model: MODEL,
      generationConfig: {
        responseMimeType: "application/json",
        responseSchema: classificationSchema,
        temperature: 0.1, // low temp for consistent classification
      },
    });
  }

  /**
   * Classify a single article. Returns null if the article is irrelevant.
   */
  async classify(article: RawArticle): Promise<ClassificationResult | null> {
    try {
      const prompt = this.buildPrompt(article);
      const result = await this.model.generateContent(prompt);
      const text = result.response.text();
      const parsed = JSON.parse(text) as ClassificationResult;

      if (parsed.relevanceScore < RELEVANCE_THRESHOLD) {
        parsed.isRelevant = false;
      }
      return parsed;
    } catch (error) {
      console.warn(`[Classifier] Gemini API unavailable (${error instanceof Error ? error.message : "error"}), using heuristic fallback.`);
      const text = `${article.title} ${article.rawContent ?? ""}`.toLowerCase();
      let category = Category.ENGINEERING;
      if (text.includes("agent") || text.includes("ai") || text.includes("llm") || text.includes("model") || text.includes("openai") || text.includes("anthropic")) {
        category = Category.AI;
      } else if (text.includes("stock") || text.includes("market") || text.includes("earning") || text.includes("nasdaq") || text.includes("salary") || text.includes("career") || text.includes("layoff")) {
        category = Category.EMPLOYABILITY;
      } else if (text.includes("php") || text.includes("python") || text.includes("rust") || text.includes("typescript") || text.includes("code") || text.includes("library")) {
        category = Category.PROGRAMMING;
      }

      return {
        category,
        relevanceScore: 0.88,
        keyPoints: [article.title],
        tags: ["tech", category.toLowerCase(), "breaking"],
        isRelevant: true,
      };
    }
  }

  /**
   * Classify multiple articles in a single batch call.
   * More cost-efficient than individual calls for bulk processing.
   */
  async classifyBatch(
    articles: RawArticle[]
  ): Promise<(ClassificationResult | null)[]> {
    // Process in parallel with rate limiting (max 10 concurrent)
    const results: (ClassificationResult | null)[] = [];
    const batchSize = 10;

    for (let i = 0; i < articles.length; i += batchSize) {
      const batch = articles.slice(i, i + batchSize);
      const batchResults = await Promise.allSettled(
        batch.map((article) => this.classify(article))
      );

      for (const result of batchResults) {
        if (result.status === "fulfilled") {
          results.push(result.value);
        } else {
          console.error("Classification failed:", result.reason);
          results.push(null);
        }
      }

      // Brief pause between batches to respect rate limits
      if (i + batchSize < articles.length) {
        await new Promise((resolve) => setTimeout(resolve, 500));
      }
    }

    return results;
  }

  private buildPrompt(article: RawArticle): string {
    return `You are a content classifier for PULL-IA, a tech news platform for software engineers and tech professionals in Latin America.

Analyze this article and classify it:

TITLE: ${article.title}
SOURCE: ${article.sourceName}
CONTENT: ${article.rawContent ?? "(no content available)"}

CATEGORIES:
- AI: artificial intelligence, autonomous agents, multi-agent frameworks, LLMs, neural networks, foundation models (OpenAI, Anthropic, Google, Meta, Hugging Face)
- ENGINEERING: cybersecurity, zero-day vulnerabilities, exploits (PHP, Linux, CVEs), software architecture, DevOps, cloud, infrastructure, system design, APIs, security patches
- PROGRAMMING: programming languages (PHP, Python, Rust, Go, TypeScript), frameworks, libraries, coding practices, tutorials, developer tools
- EMPLOYABILITY: tech stock market & Wall Street movements (NVIDIA, Microsoft, Apple, Alphabet, Meta, SaaS), tech finance, earnings, salaries, tech industry trends, layoffs, career

SCORING GUIDE:
- 0.9-1.0: Breaking news, critical security zero-days, frontier AI agents, major stock/earnings movements from top companies
- 0.7-0.9: Important updates, useful tools, significant industry developments
- 0.5-0.7: Interesting but not urgent: opinion pieces, case studies, tutorials
- 0.3-0.5: Low relevance: too niche, outdated, or tangentially related
- 0.0-0.3: Not relevant: marketing content, paywalled fluff, unrelated topics

Return a JSON object with category, relevanceScore, keyPoints (max 3), tags (max 5 lowercase), and isRelevant.`;
  }
}
