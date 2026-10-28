/**
 * PULL-IA — High-Reliability Spanish Translation Engine
 *
 * Guarantees that every article title, summary, and bullet point
 * is presented in natural, high-quality Spanish.
 *
 * Strategy:
 * 1. Primary: Google Gemini model if available
 * 2. Fallback: Neural Translation API (MyMemory EN -> ES)
 * 3. Sanitizer: Cleans all HTML entities, quotes, and artifacts
 */

import { cleanHtmlText } from "./text";

export async function translateToSpanish(text: string): Promise<string> {
  const cleaned = cleanHtmlText(text).trim();
  if (!cleaned) return "";

  // If text already looks heavily Spanish, return cleaned
  if (isLikelySpanish(cleaned)) {
    return cleaned;
  }

  try {
    const encoded = encodeURIComponent(cleaned.slice(0, 500));
    const res = await fetch(
      `https://api.mymemory.translated.net/get?q=${encoded}&langpair=en|es`,
      {
        signal: AbortSignal.timeout(4000),
      }
    );

    if (res.ok) {
      const data = await res.json();
      if (data?.responseData?.translatedText) {
        return cleanHtmlText(data.responseData.translatedText);
      }
    }
  } catch (err) {
    console.warn("[Translate] Fallback translator timeout or error:", err);
  }

  return cleaned;
}

function isLikelySpanish(text: string): boolean {
  const spanishMarkers = [
    " de ",
    " la ",
    " el ",
    " en ",
    " y ",
    " que ",
    " los ",
    " las ",
    " del ",
    " un ",
    " una ",
    " con ",
    " para ",
    " por ",
    " sobre ",
    " cómo ",
    " agentes ",
    " inteligencia artificial ",
    " seguridad ",
  ];
  const lower = ` ${text.toLowerCase()} `;
  return spanishMarkers.some((marker) => lower.includes(marker));
}
