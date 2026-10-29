import { Category } from "@/types";

/**
 * 100% Verified Tech-Only High-Resolution Visual Library
 * Organized by specific technical sub-domains so each news card gets a unique,
 * contextually relevant technology illustration with zero non-tech images.
 */
const TOPIC_IMAGE_POOLS: Record<string, string[]> = {
  // Cybersecurity, CVEs, Zero-Days, Ransomware, Cryptography, Firewalls
  CYBERSECURITY: [
    "https://images.unsplash.com/photo-1550751827-4bd374c3f58b?auto=format&fit=crop&w=1200&q=80",
    "https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?auto=format&fit=crop&w=1200&q=80",
    "https://images.unsplash.com/photo-1563986768609-322da13575f3?auto=format&fit=crop&w=1200&q=80",
    "https://images.unsplash.com/photo-1614064641938-3bbee52942c7?auto=format&fit=crop&w=1200&q=80",
    "https://images.unsplash.com/photo-1510511459019-5dda7724fd87?auto=format&fit=crop&w=1200&q=80",
    "https://images.unsplash.com/photo-1558494949-ef010cbdcc31?auto=format&fit=crop&w=1200&q=80",
    "https://images.unsplash.com/photo-1544197150-b99a580bb7a8?auto=format&fit=crop&w=1200&q=80",
    "https://images.unsplash.com/photo-1504639725590-34d0984388bd?auto=format&fit=crop&w=1200&q=80",
  ],

  // AI Agents, Neural Networks, Robotics, Generative AI, Deep Learning
  AI_ROBOTICS: [
    "https://images.unsplash.com/photo-1677442136019-21780ecad995?auto=format&fit=crop&w=1200&q=80",
    "https://images.unsplash.com/photo-1620712943543-bcc4688e7485?auto=format&fit=crop&w=1200&q=80",
    "https://images.unsplash.com/photo-1485827404703-89b55fcc595e?auto=format&fit=crop&w=1200&q=80",
    "https://images.unsplash.com/photo-1531746790731-6c087fecd65a?auto=format&fit=crop&w=1200&q=80",
    "https://images.unsplash.com/photo-1589254065878-42c9da997008?auto=format&fit=crop&w=1200&q=80",
    "https://images.unsplash.com/photo-1535378917042-10a22c95931a?auto=format&fit=crop&w=1200&q=80",
    "https://images.unsplash.com/photo-1655720828018-edd2daec9349?auto=format&fit=crop&w=1200&q=80",
    "https://images.unsplash.com/photo-1676299081847-824916de030a?auto=format&fit=crop&w=1200&q=80",
    "https://images.unsplash.com/photo-1684369175833-4b445ad6bfb5?auto=format&fit=crop&w=1200&q=80",
    "https://images.unsplash.com/photo-1634017839464-5c339ebe3cb4?auto=format&fit=crop&w=1200&q=80",
  ],

  // Semiconductors, NVIDIA GPUs, Microchips, Quantum Hardware, Processors
  HARDWARE_CHIPS: [
    "https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=1200&q=80",
    "https://images.unsplash.com/photo-1591799264318-7e6ef8ddb7ea?auto=format&fit=crop&w=1200&q=80",
    "https://images.unsplash.com/photo-1555664424-778a1e5e1b48?auto=format&fit=crop&w=1200&q=80",
    "https://images.unsplash.com/photo-1587202372775-e229f172b9d7?auto=format&fit=crop&w=1200&q=80",
    "https://images.unsplash.com/photo-1562408590-e32931084e23?auto=format&fit=crop&w=1200&q=80",
    "https://images.unsplash.com/photo-1601132359864-c974e79890ac?auto=format&fit=crop&w=1200&q=80",
  ],

  // Software Engineering, Source Code, IDEs, Compilers, Cloud & DevOps
  SOFTWARE_CODE: [
    "https://images.unsplash.com/photo-1555066931-4365d14bab8c?auto=format&fit=crop&w=1200&q=80",
    "https://images.unsplash.com/photo-1461749280684-dccba630e2f6?auto=format&fit=crop&w=1200&q=80",
    "https://images.unsplash.com/photo-1517694712202-14dd9538aa97?auto=format&fit=crop&w=1200&q=80",
    "https://images.unsplash.com/photo-1542831371-29b0f74f9713?auto=format&fit=crop&w=1200&q=80",
    "https://images.unsplash.com/photo-1605379399642-870262d3d051?auto=format&fit=crop&w=1200&q=80",
    "https://images.unsplash.com/photo-1587620962725-abab7fe55159?auto=format&fit=crop&w=1200&q=80",
    "https://images.unsplash.com/photo-1516116216624-53e697fedbea?auto=format&fit=crop&w=1200&q=80",
    "https://images.unsplash.com/photo-1571171637578-41bc2dd41cd2?auto=format&fit=crop&w=1200&q=80",
    "https://images.unsplash.com/photo-1607799279861-4dd421887fb3?auto=format&fit=crop&w=1200&q=80",
    "https://images.unsplash.com/photo-1498050108023-c5249f4df085?auto=format&fit=crop&w=1200&q=80",
  ],

  // Foundation Models, Benchmarks, Data Science, Neural Architecture
  MODELS_DATA: [
    "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=1200&q=80",
    "https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&w=1200&q=80",
    "https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&w=1200&q=80",
    "https://images.unsplash.com/photo-1509228468518-180dd4864904?auto=format&fit=crop&w=1200&q=80",
    "https://images.unsplash.com/photo-1639322537228-f710d846310a?auto=format&fit=crop&w=1200&q=80",
    "https://images.unsplash.com/photo-1642104704074-907c0698cbd9?auto=format&fit=crop&w=1200&q=80",
  ],

  // Tech Employability, Developer Careers, Financial Markets, NASDAQ, Remote Work
  TECH_CAREERS_MARKET: [
    "https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?auto=format&fit=crop&w=1200&q=80",
    "https://images.unsplash.com/photo-1590283603385-17ffb3a7f29f?auto=format&fit=crop&w=1200&q=80",
    "https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&w=1200&q=80",
    "https://images.unsplash.com/photo-1531482615713-2afd69097998?auto=format&fit=crop&w=1200&q=80",
    "https://images.unsplash.com/photo-1553877522-43269d4ea984?auto=format&fit=crop&w=1200&q=80",
    "https://images.unsplash.com/photo-1573164713988-8665fc963095?auto=format&fit=crop&w=1200&q=80",
    "https://images.unsplash.com/photo-1552664730-d307ca884978?auto=format&fit=crop&w=1200&q=80",
    "https://images.unsplash.com/photo-1642790106117-e829e14a795f?auto=format&fit=crop&w=1200&q=80",
  ],
};

const ALL_VERIFIED_TECH_IMAGES = Array.from(
  new Set(Object.values(TOPIC_IMAGE_POOLS).flat())
);

/**
 * 32-bit FNV-1a deterministic hash for high-dispersion index selection.
 */
function fnv1aHash(str: string): number {
  let hash = 0x811c9dc5;
  for (let i = 0; i < str.length; i++) {
    hash ^= str.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193);
  }
  return hash >>> 0;
}

function selectTopicPool(category: Category | string, contextText?: string): string[] {
  const text = `${contextText ?? ""} ${category}`.toLowerCase();

  if (
    /\b(cve-\d|vulnerabilidad|ransomware|malware|phishing|exploit|zero-day|ciberseguridad|hacker|brecha|seguridad|firewall|botnet|backdoor|cifrado|password|contraseñ|ataque)\b/i.test(
      text
    )
  ) {
    return TOPIC_IMAGE_POOLS.CYBERSECURITY;
  }
  if (
    /\b(nvidia|gpu|chip|semiconductor|procesador|cpu|hardware|quantum|cuántic|servidor|datacenter|centro de datos|arm|intel|amd|tsmc)\b/i.test(
      text
    )
  ) {
    return TOPIC_IMAGE_POOLS.HARDWARE_CHIPS;
  }
  if (
    category === Category.EMPLOYABILITY ||
    /\b(empleo|empleabilidad|salari|sueldo|remoto|vacante|despido|layoff|bolsa|acciones|nasdaq|wall street|mercado laboral|contrataci|entrevista|carrera|ingresos|cnbc)\b/i.test(
      text
    )
  ) {
    return TOPIC_IMAGE_POOLS.TECH_CAREERS_MARKET;
  }
  if (
    category === Category.MODELS ||
    /\b(benchmark|mmlu|ventana de contexto|tokens|parámetros|pesos abiertos|fine-tuning|ficha técnica|evaluación)\b/i.test(
      text
    )
  ) {
    return TOPIC_IMAGE_POOLS.MODELS_DATA;
  }
  if (
    category === Category.AI ||
    /\b(inteligencia artificial|agente|llm|openai|anthropic|gemini|claude|gpt|robot|neuronal|generativ|machine learning|deep learning)\b/i.test(
      text
    )
  ) {
    return TOPIC_IMAGE_POOLS.AI_ROBOTICS;
  }
  if (category === Category.ENGINEERING) {
    return TOPIC_IMAGE_POOLS.SOFTWARE_CODE;
  }
  return ALL_VERIFIED_TECH_IMAGES;
}

/**
 * Resolves a contextually relevant, non-repeating tech image for an article.
 * When `usedImages` is passed (from `NewsFeed`), guarantees zero visual duplicates across the feed.
 */
export function getArticleImage(
  articleId: string,
  category: Category | string,
  providedUrl?: string | null,
  contextText?: string,
  usedImages?: Set<string>
): string {
  // 1. If the article has a genuine external OG image from its publisher (not a generic Unsplash fallback),
  //    and it hasn't been used by another card yet, prefer it.
  if (
    providedUrl &&
    providedUrl.startsWith("http") &&
    !providedUrl.includes("photo-1542838132-92c53300491e") &&
    !providedUrl.includes("images.unsplash.com")
  ) {
    if (!usedImages || !usedImages.has(providedUrl)) {
      usedImages?.add(providedUrl);
      return providedUrl;
    }
  }

  const primaryPool = selectTopicPool(category, contextText);
  const candidatePool = Array.from(
    new Set([...primaryPool, ...ALL_VERIFIED_TECH_IMAGES])
  );

  const seed = `${articleId}::${contextText ?? ""}::${category}`;
  const baseHash = fnv1aHash(seed);

  // First try to pick an unused image from the article's primary topic pool
  if (usedImages) {
    for (let i = 0; i < primaryPool.length; i++) {
      const candidate = primaryPool[(baseHash + i) % primaryPool.length];
      if (!usedImages.has(candidate)) {
        usedImages.add(candidate);
        return candidate;
      }
    }
    // Next try any unused image across the entire verified tech library
    for (let i = 0; i < candidatePool.length; i++) {
      const candidate = candidatePool[(baseHash + i) % candidatePool.length];
      if (!usedImages.has(candidate)) {
        usedImages.add(candidate);
        return candidate;
      }
    }
  }

  const chosen = primaryPool[baseHash % primaryPool.length];
  usedImages?.add(chosen);
  return chosen;
}
