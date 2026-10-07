/**
 * PULL-IA — Input Validators (Zod)
 *
 * All API endpoint inputs are validated here.
 * Prevents malformed data and injection attacks.
 */

import { z } from "zod";
import { Category } from "@/types";

// ── Subscribe form ──────────────────────────────────────

export const subscribeSchema = z.object({
  email: z
    .string()
    .email("Please enter a valid email address")
    .max(254, "Email is too long")
    .toLowerCase()
    .trim(),
  name: z
    .string()
    .min(2, "Name must be at least 2 characters")
    .max(100, "Name is too long")
    .trim()
    .optional(),
  locale: z.enum(["es", "en"]).default("es"),
  interests: z
    .array(z.nativeEnum(Category))
    .min(1, "Select at least one interest")
    .max(4)
    .default([Category.AI, Category.ENGINEERING, Category.PROGRAMMING, Category.EMPLOYABILITY]),
});

export type SubscribeInput = z.infer<typeof subscribeSchema>;

// ── Unsubscribe ─────────────────────────────────────────

export const unsubscribeSchema = z.object({
  token: z
    .string()
    .uuid("Invalid unsubscribe token")
    .trim(),
});

// ── Article query ───────────────────────────────────────

export const articleQuerySchema = z.object({
  category: z.nativeEnum(Category).optional(),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().min(1).max(50).default(20),
  locale: z.enum(["es", "en"]).default("es"),
});

// ── Admin: Manual ingest trigger ────────────────────────

export const ingestTriggerSchema = z.object({
  sources: z.array(z.string()).optional(), // if empty, run all
  dryRun: z.boolean().default(false),
});

/**
 * Parse and validate request body with a Zod schema.
 * Returns { data, error } to keep route handlers clean.
 */
export async function parseBody<T>(
  request: Request,
  schema: z.ZodSchema<T>
): Promise<{ data: T; error: null } | { data: null; error: string }> {
  try {
    const body = await request.json();
    const data = schema.parse(body);
    return { data, error: null };
  } catch (err) {
    if (err instanceof z.ZodError) {
      return {
        data: null,
        error: err.issues.map((e) => e.message).join(", "),
      };
    }
    return { data: null, error: "Invalid request body" };
  }
}
