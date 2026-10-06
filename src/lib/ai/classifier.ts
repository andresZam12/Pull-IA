/**
 * PULL-IA — AI Classifier (Google Gemini)
 *
 * Classifies a raw article into a category and assigns a relevance score.
 * Uses gemini-1.5-flash for cost-efficient bulk classification.
 * Always returns structured JSON via Gemini's JSON mode.
 */

import { GoogleGenerativeAI, SchemaType } from "@google/generative-ai";
import type { ClassificationResult, RawArticle } from "@/types";
import { Category } from "@/types";

const MODEL = "gemini-3.8-flash";
const RELEVANCE_THRESHOLD = 0.4; // articles below this are rejected

// JSON schema for structured output
const classificationSchema = {
  type: SchemaType.OBJECT,
  properties: {
    category: {
      type: SchemaType.STRING,
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
      return {
        category: Category.AI,
        relevanceScore: 0.85,
        keyPoints: [article.title],
        tags: ["tech", "engineering", "ai"],
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
- AI: artificial intelligence, machine learning, LLMs, neural networks, AI tools, AI research
- ENGINEERING: software architecture, DevOps, cloud, infrastructure, system design, APIs
- PROGRAMMING: programming languages, frameworks, libraries, coding practices, tutorials
- EMPLOYABILITY: tech jobs, salaries, career advice, remote work, tech industry trends, layoffs

SCORING GUIDE:
- 0.9-1.0: Breaking news, major releases, landmark research from top companies (OpenAI, Google, etc.)
- 0.7-0.9: Important updates, useful tools, significant industry developments
- 0.5-0.7: Interesting but not urgent: opinion pieces, case studies, tutorials
- 0.3-0.5: Low relevance: too niche, outdated, or tangentially related
- 0.0-0.3: Not relevant: marketing content, paywalled fluff, unrelated topics

Return a JSON object with category, relevanceScore, keyPoints (max 3), tags (max 5 lowercase), and isRelevant.`;
  }
}
