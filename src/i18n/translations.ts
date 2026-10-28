export type Locale = "es" | "en";

export interface TranslationSchema {
  brandSubtitle: string;
  heroBadge: string;
  heroTitlePrefix: string;
  heroTitleHighlight: string;
  heroDescription: string;
  searchPlaceholder: string;
  categories: {
    ALL: string;
    AI: string;
    ENGINEERING: string;
    PROGRAMMING: string;
    MODELS: string;
    EMPLOYABILITY: string;
  };
  latestUpdates: string;
  categoryPrefix: string;
  showAll: string;
  readMore: string;
  verifiedAi: string;
  originalSource: string;
  readingTime: string;
  publishedOn: string;
  keyPointsTitle: string;
  fullSummaryTitle: string;
  closeModal: string;
  noArticlesFound: string;
  noArticlesDesc: string;
  newsletter: {
    badge: string;
    title: string;
    description: string;
    placeholder: string;
    button: string;
    subscribing: string;
    success: string;
    error: string;
    disclaimer: string;
  };
  refreshButton: string;
  refreshing: string;
  syncUpToDate: string;
  syncSuccess: string;
  syncError: string;
  filterRecent7d: string;
  filterArchive30d: string;
  loadMore: string;
  showLess: string;
  showingCount: string;
  ofCount: string;
  retentionNotice: string;
  searchInArchiveCta: string;
  footerAcademic: string;
  footerStack: string;
}

export const translations: Record<Locale, TranslationSchema> = {
  es: {
    brandSubtitle: "powered by PULL-IA",
    heroBadge: "Noticias globales curadas con Inteligencia Artificial",
    heroTitlePrefix: "Todo lo que importa en tech, ",
    heroTitleHighlight: "sin el ruido.",
    heroDescription:
      "Deplhoy rastrea fuentes oficiales globales y genera síntesis de alto impacto con IA para programadores e ingenieros de software en Latinoamérica.",
    searchPlaceholder: "Buscar por palabra clave, fuente o tema...",
    categories: {
      ALL: "Todas",
      AI: "Inteligencia Artificial",
      ENGINEERING: "Ingeniería",
      PROGRAMMING: "Programación",
      MODELS: "Modelos",
      EMPLOYABILITY: "Empleabilidad",
    },
    latestUpdates: "Últimas publicaciones",
    categoryPrefix: "Categoría:",
    showAll: "Mostrar todas",
    readMore: "Ver más",
    verifiedAi: "Resumen verificado con IA",
    originalSource: "Leer en fuente original",
    readingTime: "min de lectura",
    publishedOn: "Publicado el",
    keyPointsTitle: "Puntos clave de la noticia",
    fullSummaryTitle: "Resumen detallado",
    closeModal: "Cerrar",
    noArticlesFound: "No se encontraron noticias",
    noArticlesDesc: "Prueba cambiando de categoría o usando otros términos de búsqueda.",
    newsletter: {
      badge: "Boletín Semanal Gratuito",
      title: "Las noticias tech más importantes, cada viernes",
      description:
        "Sin spam ni relleno. Solo resúmenes ejecutivos sobre IA, ingeniería y mercado laboral directamente en tu correo.",
      placeholder: "tu.correo@empresa.com",
      button: "Suscribirme",
      subscribing: "Enviando...",
      success: "¡Listo! Te enviamos un correo para confirmar tu suscripción.",
      error: "Hubo un error al suscribirte.",
      disclaimer: "Doble confirmación (Double opt-in). Puedes cancelar tu suscripción en cualquier momento.",
    },
    refreshButton: "Actualizar novedades",
    refreshing: "Consultando fuentes...",
    syncUpToDate: "Todo al día. No hay noticias nuevas en las fuentes oficiales en este momento.",
    syncSuccess: "¡Se encontraron y agregaron nuevas publicaciones!",
    syncError: "No se pudo consultar las fuentes en este momento. Intenta de nuevo más tarde.",
    filterRecent7d: "Recientes (7 días)",
    filterArchive30d: "Archivo del mes (30 días)",
    loadMore: "Mostrar más noticias",
    showLess: "Contraer vista",
    showingCount: "Mostrando",
    ofCount: "de",
    retentionNotice: "Ciclo automático: archivo consultable hasta 30 días y purga automática para optimizar almacenamiento.",
    searchInArchiveCta: "Buscar también en el archivo del mes (30 días)",
    footerAcademic: "Programación Orientada a la Web • Semestre 7",
    footerStack: "Next.js 16 • Supabase PostgreSQL • Google Gemini • Tailwind CSS",
  },
  en: {
    brandSubtitle: "powered by PULL-IA",
    heroBadge: "Global tech news curated with Artificial Intelligence",
    heroTitlePrefix: "Everything that matters in tech, ",
    heroTitleHighlight: "zero noise.",
    heroDescription:
      "Deplhoy tracks official global sources and delivers high-impact AI summaries for software engineers and tech leaders in Latin America.",
    searchPlaceholder: "Search by keyword, source, or topic...",
    categories: {
      ALL: "All",
      AI: "Artificial Intelligence",
      ENGINEERING: "Engineering",
      PROGRAMMING: "Programming",
      MODELS: "Models",
      EMPLOYABILITY: "Careers",
    },
    latestUpdates: "Latest updates",
    categoryPrefix: "Category:",
    showAll: "Show all",
    readMore: "Read more",
    verifiedAi: "AI verified summary",
    originalSource: "Read on original source",
    readingTime: "min read",
    publishedOn: "Published on",
    keyPointsTitle: "Key takeaways",
    fullSummaryTitle: "Detailed summary",
    closeModal: "Close",
    noArticlesFound: "No articles found",
    noArticlesDesc: "Try selecting a different category or search term.",
    newsletter: {
      badge: "Free Weekly Newsletter",
      title: "The most important tech news, every Friday",
      description:
        "Zero spam. Curated executive summaries on AI, engineering, and the tech job market delivered to your inbox.",
      placeholder: "your.email@company.com",
      button: "Subscribe",
      subscribing: "Subscribing...",
      success: "Awesome! We sent you an email to confirm your subscription.",
      error: "Failed to subscribe.",
      disclaimer: "Double opt-in. You can unsubscribe at any time with one click.",
    },
    refreshButton: "Refresh news",
    refreshing: "Checking sources...",
    syncUpToDate: "All up to date. No new articles found in official sources right now.",
    syncSuccess: "Found and published new updates!",
    syncError: "Could not check sources at this time. Please try again later.",
    filterRecent7d: "Recent (7 days)",
    filterArchive30d: "Monthly archive (30 days)",
    loadMore: "Load more articles",
    showLess: "Show less",
    showingCount: "Showing",
    ofCount: "of",
    retentionNotice: "Auto-lifecycle: searchable archive up to 30 days with automatic storage purge.",
    searchInArchiveCta: "Search in the 30-day monthly archive as well",
    footerAcademic: "Web-Oriented Programming • Semester 7",
    footerStack: "Next.js 16 • Supabase PostgreSQL • Google Gemini • Tailwind CSS",
  },
};
