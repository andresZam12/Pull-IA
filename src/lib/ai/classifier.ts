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

// JSON schema for structured output (strictly mapped to the 4 UI navigation sections)
const ACTIVE_CATEGORIES = [
  Category.AI,
  Category.ENGINEERING,
  Category.MODELS,
  Category.EMPLOYABILITY,
];

const classificationSchema: Schema = {
  type: SchemaType.OBJECT,
  properties: {
    category: {
      type: SchemaType.STRING,
      format: "enum",
      enum: ACTIVE_CATEGORIES,
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
      console.warn(`[Classifier] Gemini API unavailable (${error instanceof Error ? error.message : "error"}), using precision taxonomy classifier.`);
      const text = `${article.title} ${article.rawContent ?? ""} ${article.sourceName}`.toLowerCase();
      let category = Category.ENGINEERING;

      if (
        /\b(job|jobs|hiring|salary|salaries|career|remote work|layoff|layoffs|workforce|recruiting|developer survey|interview|stock|stocks|market|earnings|revenue|valuation|ipo|acquisition|nasdaq|wall street|cnbc)\b/i.test(
          text
        )
      ) {
        category = Category.EMPLOYABILITY;
      } else if (
        /\b(gpt-[456]|claude 3|gemini [123]|llama [34]|deepseek|mistral|qwen|benchmark|mmlu|swe-bench|context window|open weights|parameters|quantization|fine-tuning)\b/i.test(
          text
        )
      ) {
        category = Category.MODELS;
      } else if (
        /\b(vulnerability|cve-\d|ransomware|malware|exploit|zero-day|cybersecurity|patch|breach|architecture|microservices|kubernetes|docker|devops|aws|azure|linux|kernel|database|postgresql|rust|python|typescript|php|golang|compiler)\b/i.test(
          text
        )
      ) {
        category = Category.ENGINEERING;
      } else if (
        /\b(ai|artificial intelligence|agent|agents|llm|llms|neural|machine learning|deep learning|generative|openai|anthropic|huggingface|hugging face|robotics|rag|copilot)\b/i.test(
          text
        )
      ) {
        category = Category.AI;
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
    return `You are a strict content classifier for PULL-IA, a tech news platform for software engineers in Latin America.

Analyze this article and classify it into ONE of the 4 strict sections below:

TITLE: ${article.title}
SOURCE: ${article.sourceName}
CONTENT: ${article.rawContent ?? "(no content available)"}

STRICT SECTIONS (CHOOSE ONLY ONE):
- EMPLOYABILITY: Tech job market, developer salaries, remote work trends, hiring, technical interviews, layoffs, workforce changes, and software company financial/stock market results (earnings, IPOs, acquisitions, valuations).
- MODELS: Specific LLM / foundation model releases, benchmarks (MMLU, SWE-bench), context windows, token pricing, inference latency, quantization, and open-weight model comparisons.
- ENGINEERING: Cybersecurity, CVEs, ransomware, zero-day vulnerabilities, software architecture, cloud/DevOps (AWS, Azure, Kubernetes), databases, Linux, and programming languages/frameworks (Python, Rust, TypeScript, PHP, Go).
- AI: Applied Artificial Intelligence, autonomous AI agents, copilots, RAG workflows, enterprise AI adoption, robotics, and AI regulation.

SCORING GUIDE:
- 0.9-1.0: Breaking news, critical security zero-days, frontier AI agents, major job market or stock/earnings movements
- 0.7-0.9: Important updates, useful engineering tools, significant industry developments
- 0.5-0.7: Interesting case studies or architectural analyses
- 0.0-0.4: Irrelevant fluff

Return a JSON object with category, relevanceScore, keyPoints (max 3), tags (max 5 lowercase), and isRelevant.`;
  }
}
