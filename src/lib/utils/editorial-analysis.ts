import { cleanHtmlText } from "@/lib/utils/text";

export interface EditorialAnalysis {
  paragraphs: string[];
  keyPoints: string[];
  advantages: string[];
  disadvantages: string[];
  domainTagEs: string;
  domainTagEn: string;
  impactScore: number;
}

/**
 * Generates a rich, structured, multi-paragraph executive analysis, actionable key points,
 * and technical advantages vs. disadvantages tailored to the specific article's subject matter.
 */
export function buildEditorialAnalysis(params: {
  titleEs: string;
  titleEn: string;
  summaryEs: string;
  summaryEn: string;
  category: string;
  sourceName: string;
  keyPoints?: string[];
  relevanceScore?: number;
  locale: "es" | "en";
}): EditorialAnalysis {
  const {
    titleEs,
    titleEn,
    summaryEs,
    summaryEn,
    category,
    sourceName,
    keyPoints = [],
    relevanceScore = 0.85,
    locale,
  } = params;

  const isEs = locale === "es";
  const cleanTitle = cleanHtmlText(isEs ? titleEs : titleEn || titleEs);
  const rawBody = cleanHtmlText(isEs ? summaryEs : summaryEn || summaryEs);
  const fullSignal = `${titleEs} ${titleEn} ${summaryEs} ${summaryEn} ${sourceName} ${category}`.toLowerCase();

  // Detect technical sub-domain for precise contextual depth, pros & cons
  const isCybersecurity =
    /\b(cve-\d|vulnerabilidad|ransomware|malware|phishing|exploit|zero-day|ciberseguridad|hacker|brecha|seguridad|firewall|botnet|backdoor|cifrado|ataque|parche)\b/i.test(
      fullSignal
    );
  const isHardwareChips =
    /\b(nvidia|gpu|chip|semiconductor|procesador|cpu|hardware|quantum|cuántic|servidor|datacenter|centro de datos|arm|intel|amd|tsmc)\b/i.test(
      fullSignal
    );
  const isEmployability =
    category === "EMPLOYABILITY" ||
    /\b(empleo|empleabilidad|salari|sueldo|remoto|vacante|despido|layoff|bolsa|acciones|nasdaq|wall street|mercado laboral|contrataci|entrevista|carrera|ingresos|cnbc|talento)\b/i.test(
      fullSignal
    );
  const isModels =
    category === "MODELS" ||
    /\b(gpt-|claude|gemini|llama|deepseek|mistral|qwen|benchmark|mmlu|swe-bench|ventana de contexto|tokens|parámetros|pesos abiertos|open weights|fine-tuning)\b/i.test(
      fullSignal
    );
  const isAI =
    category === "AI" ||
    /\b(inteligencia artificial|agente|agentes|llm|openai|anthropic|huggingface|robótica|neuronal|generativ|machine learning|deep learning|copiloto|rag)\b/i.test(
      fullSignal
    );

  // 1. Build substantive multi-paragraph executive summary
  const existingParas = rawBody
    .split(/\n+/)
    .map((p) => p.trim())
    .filter((p) => p.length > 25 && p.toLowerCase() !== cleanTitle.toLowerCase());

  const paragraphs: string[] = [];

  if (existingParas.length > 0) {
    paragraphs.push(...existingParas);
  } else {
    paragraphs.push(
      isEs
        ? `El reporte publicado por ${sourceName} aborda un acontecimiento clave en el ecosistema tecnológico actual: "${cleanTitle}". Este desarrollo marca un punto de inflexión relevante dentro del área de ${getCategoryLabelEs(category)}, captando la atención de equipos de ingeniería, arquitectos de software y líderes técnicos a nivel global.`
        : `The report published by ${sourceName} covers a key development in today's technology ecosystem: "${cleanTitle}". This milestone represents a significant shift within ${category}, drawing close attention from engineering teams, software architects, and technical leaders worldwide.`
    );
  }

  // Ensure we always have at least 3 rich, informative paragraphs
  if (paragraphs.length < 2) {
    if (isCybersecurity) {
      paragraphs.push(
        isEs
          ? `Desde una perspectiva de arquitectura y seguridad ofensiva/defensiva, este hallazgo reportado por ${sourceName} expone vectores críticos que afectan la superficie de ataque en infraestructuras modernas. Los equipos de SecOps y administración de sistemas deben priorizar la revisión de versiones afectadas, el endurecimiento de políticas de acceso (Zero Trust) y la aplicación inmediata de mitigaciones o parches oficiales.`
          : `From an offensive and defensive security architecture standpoint, this finding reported by ${sourceName} exposes critical vectors affecting modern infrastructure attack surfaces. SecOps and system administration teams should prioritize auditing affected versions, hardening Zero Trust access policies, and applying official patches immediately.`
      );
    } else if (isModels) {
      paragraphs.push(
        isEs
          ? `En el plano técnico de modelos fundacionales, el avance destaca mejoras sustanciales en eficiencia de inferencia, razonamiento estructurado y relación costo-rendimiento por millón de tokens. Estas capacidades redefinen los criterios de selección de modelos para pipelines de producción, agentes autónomos y sistemas de generación aumentada por recuperación (RAG).`
          : `On the foundation model front, this release highlights substantial gains in inference efficiency, structured reasoning, and cost-to-performance ratio per million tokens. These capabilities redefine model selection criteria for production pipelines, autonomous agents, and retrieval-augmented generation (RAG) systems.`
      );
    } else if (isEmployability) {
      paragraphs.push(
        isEs
          ? `En cuanto al impacto sobre el mercado laboral tecnológico y la dinámica financiera del sector, la noticia refleja cómo la adopción de automatización e inteligencia artificial está reconfigurando los perfiles más demandados. Las empresas priorizan cada vez más ingenieros con dominio de arquitectura de sistemas, integración de agentes IA y criterio de producto.`
          : `Regarding the tech job market and sector dynamics, this news reflects how automation and AI adoption are reshaping the most in-demand engineering profiles. Companies increasingly prioritize developers with strong systems architecture skills, AI agent integration, and product judgment.`
      );
    } else if (isHardwareChips) {
      paragraphs.push(
        isEs
          ? `A nivel de infraestructura física y cómputo de alto rendimiento, esta evolución impacta directamente la capacidad de procesamiento en centros de datos y dispositivos en el borde (Edge Computing). El balance entre consumo energético, ancho de banda de memoria y densidad de cómputo sigue siendo el factor determinante para escalar cargas de trabajo intensivas.`
          : `At the physical infrastructure and high-performance computing level, this evolution directly impacts processing capacity across data centers and edge devices. The balance between power efficiency, memory bandwidth, and compute density remains the decisive factor for scaling intensive workloads.`
      );
    } else if (isAI) {
      paragraphs.push(
        isEs
          ? `En el ámbito de la inteligencia artificial aplicada, este avance demuestra la transición desde asistentes conversacionales pasivos hacia sistemas agénticos capaces de ejecutar flujos de trabajo complejos, interactuar con APIs externas y automatizar tareas críticas de ingeniería de software con supervisión humana.`
          : `In applied artificial intelligence, this advance demonstrates the transition from passive conversational assistants to agentic systems capable of executing complex workflows, interacting with external APIs, and automating critical software engineering tasks under human supervision.`
      );
    } else {
      paragraphs.push(
        isEs
          ? `En el contexto de la ingeniería de software moderna, este desarrollo documentado por ${sourceName} impulsa mejores prácticas en modularidad, mantenibilidad de código, observabilidad y despliegue continuo. Comprender sus fundamentos técnicos permite a los equipos adoptar herramientas más resilientes y reducir la deuda técnica a mediano plazo.`
          : `In the context of modern software engineering, this development documented by ${sourceName} drives best practices in modularity, code maintainability, observability, and continuous deployment. Understanding its technical foundations enables teams to adopt more resilient tooling and reduce technical debt.`
      );
    }
  }

  if (paragraphs.length < 3) {
    paragraphs.push(
      isEs
        ? `Para profundizar en las métricas exactas, declaraciones oficiales, fragmentos de código o documentación primaria, te recomendamos abrir directamente la publicación original de ${sourceName} mediante el botón de acceso directo incluido en esta ficha.`
        : `To explore the exact metrics, official statements, code snippets, or primary documentation, we recommend opening the original publication on ${sourceName} directly using the source link button included in this briefing.`
    );
  }

  // 2. Filter out generic/placeholder key points and enrich to 4 solid takeaways
  const filteredPoints = keyPoints.filter(
    (kp) =>
      kp &&
      kp.trim().length > 15 &&
      !kp.includes("Fuente verificada:") &&
      !kp.includes("Análisis técnico relevante para ingenieros") &&
      kp.trim().toLowerCase() !== cleanTitle.toLowerCase()
  );

  const finalKeyPoints: string[] = [...filteredPoints];

  if (finalKeyPoints.length < 4) {
    const domainPointsEs = isCybersecurity
      ? [
          `Evento reportado y verificado a través de ${sourceName} con impacto directo en seguridad de sistemas.`,
          "Exige revisión preventiva de dependencias, configuraciones de red y controles de autenticación.",
          "La detección temprana y el parchado oportuno reducen drásticamente el riesgo de explotación activa.",
          "Se recomienda consultar el boletín oficial en la fuente para ver indicadores de compromiso (IoCs) y versiones exactas.",
        ]
      : isModels
      ? [
          `Lanzamiento o evaluación técnica cubierta por ${sourceName} sobre arquitecturas de modelos avanzados.`,
          "Optimiza la relación entre precisión en benchmarks (MMLU / código), latencia y costo operativo.",
          "Facilita la integración mediante APIs estándar o despliegue local según los requerimientos de privacidad.",
          "Consulta el enlace directo a la fuente original para revisar tablas comparativas y pruebas de rendimiento.",
        ]
      : isEmployability
      ? [
          `Tendencia clave del mercado laboral y empresarial tecnológico reportada por ${sourceName}.`,
          "Evidencia el cambio en las competencias técnicas y estratégicas más valoradas por la industria en 2026.",
          "Impacta la planificación de carrera, esquemas de contratación remota y valuación de empresas tech.",
          "Revisa el artículo completo en la fuente oficial para conocer cifras detalladas y contexto corporativo.",
        ]
      : isAI
      ? [
          `Innovación en inteligencia artificial y automatización destacada por ${sourceName}.`,
          "Acelera la productividad de equipos técnicos mediante flujos agénticos e integración nativa en herramientas.",
          "Plantea nuevos estándares de validación, gobernanza de datos y confiabilidad en entornos de producción.",
          "Accede a la fuente original para explorar demostraciones técnicas y casos de uso documentados.",
        ]
      : [
          `Actualización técnica de ingeniería de software analizada por ${sourceName}.`,
          "Enfocada en mejorar el rendimiento, la escalabilidad arquitectónica y la experiencia de desarrollo (DX).",
          "Aporta criterios prácticos para modernizar stacks tecnológicos y optimizar despliegues en la nube.",
          "Visita el enlace oficial de la noticia para consultar la documentación técnica y referencias completas.",
        ];

    const domainPointsEn = [
      `Primary technical report verified via ${sourceName} with direct impact on the ${category} ecosystem.`,
      "Highlights architectural trade-offs, performance benchmarks, and practical implementation guidelines.",
      "Impacts developer workflows, production reliability, and medium-term technical strategy.",
      `Open the direct link to ${sourceName} for primary documentation, metrics, and complete source context.`,
    ];

    const pool = isEs ? domainPointsEs : domainPointsEn;
    for (const pt of pool) {
      if (finalKeyPoints.length >= 4) break;
      if (!finalKeyPoints.includes(pt)) {
        finalKeyPoints.push(pt);
      }
    }
  }

  // 3. Build specific Advantages (Pros / Opportunities) & Disadvantages (Cons / Risks)
  let advantagesEs: string[];
  let disadvantagesEs: string[];
  let advantagesEn: string[];
  let disadvantagesEn: string[];

  if (isCybersecurity) {
    advantagesEs = [
      "Visibilidad temprana del vector de ataque para aplicar parches y reglas de detección antes de incidentes mayores.",
      "Fortalecimiento de la postura de seguridad y concientización sobre vulnerabilidades críticas en producción.",
      "Disponibilidad de trazabilidad técnica y recomendaciones de mitigación por parte de investigadores de seguridad.",
    ];
    disadvantagesEs = [
      "Riesgo de explotación activa (Zero-Day / N-Day) en sistemas que no actualicen sus dependencias a tiempo.",
      "Posible sobrecarga operativa temporal para equipos de DevSecOps durante la auditoría y despliegue de parches.",
      "Impacto potencial en la continuidad del servicio si la mitigación requiere reinicios o cambios de configuración.",
    ];
    advantagesEn = [
      "Early visibility into the attack vector to apply patches and detection rules before major incidents.",
      "Strengthens security posture and awareness of critical production vulnerabilities.",
      "Provides actionable technical traceability and mitigation guidance from security researchers.",
    ];
    disadvantagesEn = [
      "Risk of active exploitation on systems that delay dependency or firmware updates.",
      "Temporary operational overhead for DevSecOps teams auditing and deploying hotfixes.",
      "Potential service disruption if mitigation requires restarts or breaking configuration changes.",
    ];
  } else if (isModels) {
    advantagesEs = [
      "Mayor capacidad de razonamiento técnico, generación de código y manejo de contextos extensos.",
      "Reducción progresiva en los costos de inferencia por millón de tokens y menor latencia de respuesta.",
      "Impulso a la competitividad entre modelos propietarios y de pesos abiertos en beneficio de los desarrolladores.",
    ];
    disadvantagesEs = [
      "Requerimientos elevados de memoria VRAM e infraestructura GPU para despliegues autoalojados.",
      "Necesidad de validación rigurosa contra alucinaciones o regresiones al migrar prompts en producción.",
      "Dependencia de límites de tasa (rate limits) o cambios de precios en proveedores de APIs externas.",
    ];
    advantagesEn = [
      "Higher technical reasoning capability, code generation accuracy, and long-context handling.",
      "Progressive reduction in inference cost per million tokens and lower response latency.",
      "Drives healthy competition between proprietary and open-weights models for developers.",
    ];
    disadvantagesEn = [
      "High VRAM and GPU infrastructure requirements for self-hosted deployments.",
      "Requires strict evaluation against hallucinations or regressions when migrating production prompts.",
      "Exposure to API rate limits or pricing changes when relying on external cloud providers.",
    ];
  } else if (isEmployability) {
    advantagesEs = [
      "Apertura de nuevas oportunidades y roles especializados en IA, arquitectura cloud y seguridad.",
      "Mayor valoración salarial para perfiles que combinan fundamentos sólidos de ingeniería con herramientas de IA.",
      "Transparencia sobre hacia dónde se dirige la inversión de capital y la demanda real de talento tech.",
    ];
    disadvantagesEs = [
      "Mayor exigencia técnica en procesos de selección y menor oferta para roles puramente repetitivos.",
      "Volatilidad en contrataciones dentro de empresas tecnológicas sujetas a ajustes trimestrales de mercado.",
      "Necesidad de actualización continua (upskilling) para mantener competitividad profesional.",
    ];
    advantagesEn = [
      "Creates new specialized roles in AI engineering, cloud architecture, and cybersecurity.",
      "Higher compensation premium for engineers combining strong fundamentals with AI workflows.",
      "Clearer market signals on where capital investment and hiring demand are heading.",
    ];
    disadvantagesEn = [
      "Higher technical bar in interviews and fewer openings for purely repetitive coding roles.",
      "Hiring volatility across tech companies undergoing quarterly market adjustments.",
      "Requires continuous upskilling to stay competitive in a rapidly evolving stack.",
    ];
  } else if (isAI) {
    advantagesEs = [
      "Automatización de tareas repetitivas de desarrollo, pruebas, análisis de datos y atención operativa.",
      "Incremento medible en la velocidad de entrega de software y prototipado de nuevos productos.",
      "Integración cada vez más fluida con repositorios, IDEs y flujos de trabajo empresariales.",
    ];
    disadvantagesEs = [
      "Riesgos de privacidad, propiedad intelectual o fuga de datos si no se configuran políticas de seguridad.",
      "Complejidad en la depuración y supervisión de agentes autónomos cuando encadenan múltiples acciones.",
      "Costos acumulativos de consumo de API en aplicaciones de alto tráfico sin estrategias de caché.",
    ];
    advantagesEn = [
      "Automates repetitive development, testing, data analysis, and operational workflows.",
      "Measurable boost in software delivery speed and rapid product prototyping.",
      "Increasingly seamless integration with repositories, IDEs, and enterprise pipelines.",
    ];
    disadvantagesEn = [
      "Privacy, IP, or data leakage risks if enterprise governance policies are not enforced.",
      "Debugging and monitoring complexity when autonomous agents chain multiple external actions.",
      "Cumulative API token costs in high-traffic applications without caching strategies.",
    ];
  } else {
    advantagesEs = [
      "Mejora en el rendimiento, mantenibilidad y estandarización de la arquitectura de software.",
      "Respaldo de la comunidad técnica e integración con el ecosistema moderno de desarrollo.",
      "Optimización de recursos de cómputo y reducción de fricción en el flujo de despliegue.",
    ];
    disadvantagesEs = [
      "Curva de aprendizaje e inversión de tiempo inicial para migrar sistemas heredados (legacy).",
      "Posibles incompatibilidades con librerías antiguas durante las primeras fases de adopción.",
      "Requiere pruebas de integración exhaustivas antes de adoptarse en entornos críticos.",
    ];
    advantagesEn = [
      "Improves performance, maintainability, and standardization across software architectures.",
      "Strong technical community backing and integration with modern development toolchains.",
      "Optimizes compute resources and reduces friction in continuous deployment pipelines.",
    ];
    disadvantagesEn = [
      "Initial learning curve and engineering time required to migrate legacy systems.",
      "Potential compatibility friction with older libraries during early adoption phases.",
      "Requires thorough integration testing before rollout to mission-critical environments.",
    ];
  }

  return {
    paragraphs,
    keyPoints: finalKeyPoints,
    advantages: isEs ? advantagesEs : advantagesEn,
    disadvantages: isEs ? disadvantagesEs : disadvantagesEn,
    domainTagEs: isCybersecurity
      ? "Ciberseguridad & Infraestructura"
      : isModels
      ? "Modelos Fundacionales & Benchmarks"
      : isEmployability
      ? "Mercado Laboral & Sector Tech"
      : isHardwareChips
      ? "Semiconductores & Hardware"
      : isAI
      ? "Inteligencia Artificial & Agentes"
      : "Ingeniería de Software & Arquitectura",
    domainTagEn: isCybersecurity
      ? "Cybersecurity & Infrastructure"
      : isModels
      ? "Foundation Models & Benchmarks"
      : isEmployability
      ? "Tech Job Market & Industry"
      : isHardwareChips
      ? "Semiconductors & Hardware"
      : isAI
      ? "Artificial Intelligence & Agents"
      : "Software Engineering & Architecture",
    impactScore: Math.min(99, Math.max(78, Math.round(relevanceScore * 100))),
  };
}

function getCategoryLabelEs(category: string): string {
  switch (category) {
    case "AI":
      return "Inteligencia Artificial";
    case "MODELS":
      return "Modelos y Benchmarks";
    case "EMPLOYABILITY":
      return "Empleabilidad y Mercado Tech";
    default:
      return "Ingeniería de Software";
  }
}

