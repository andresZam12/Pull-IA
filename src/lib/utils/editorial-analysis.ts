import { cleanHtmlText } from "@/lib/utils/text";

export interface EditorialAnalysis {
  cardLead: string;
  paragraphs: string[];
  keyPoints: string[];
  advantages: string[];
  disadvantages: string[];
  domainTagEs: string;
  domainTagEn: string;
  impactScore: number;
}

function hashText(str: string): number {
  let hash = 2166136261;
  for (let i = 0; i < str.length; i++) {
    hash ^= str.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return Math.abs(hash >>> 0);
}

/**
 * Generates a rich, structured, multi-paragraph executive analysis, a complete card lead
 * (eliminating sparse 1-sentence cards), actionable key points, and technical pros/cons
 * tailored to the specific article's subject matter.
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
    relevanceScore = 0.86,
    locale,
  } = params;

  const isEs = locale === "es";
  const cleanTitle = cleanHtmlText(isEs ? titleEs : titleEn || titleEs);
  const rawBody = cleanHtmlText(isEs ? summaryEs : summaryEn || summaryEs);
  const fullSignal = `${titleEs} ${titleEn} ${summaryEs} ${summaryEn} ${sourceName} ${category}`.toLowerCase();
  const h = hashText(`${cleanTitle}:${sourceName}`);

  // Fine-grained sub-domain detection so adjacent cards in the same category stay distinct
  const isCybersecurity =
    /\b(cve-\d|vulnerabilidad|ransomware|malware|phishing|exploit|zero-day|ciberseguridad|hacker|brecha|seguridad|firewall|botnet|backdoor|cifrado|ataque|parche|autenticaci[oó]n)\b/i.test(
      fullSignal
    );
  const isHardwareChips =
    /\b(nvidia|gpu|chip|semiconductor|procesador|cpu|hardware|quantum|cu[aá]ntic|servidor|datacenter|centro de datos|arm|intel|amd|tsmc|bater[ií]a|rob[oó]tica|robot|asimo)\b/i.test(
      fullSignal
    );
  const isEnterpriseOrg =
    /\b(empresa|organigrama|corporativ|negocio|legal|abogado|contrato|finanzas|banca|salud|m[eé]dic|educaci[oó]n|productividad|flujos de trabajo|workflow|legora|operativo)\b/i.test(
      fullSignal
    );
  const isEmployability =
    category === "EMPLOYABILITY" ||
    /\b(empleo|empleabilidad|salari|sueldo|remoto|vacante|despido|layoff|bolsa|acciones|nasdaq|wall street|mercado laboral|contrataci|entrevista|carrera|ingresos|cnbc|talento)\b/i.test(
      fullSignal
    );
  const isModels =
    category === "MODELS" ||
    /\b(gpt-|claude|gemini|llama|deepseek|mistral|qwen|codex|benchmark|mmlu|swe-bench|ventana de contexto|tokens|par[aá]metros|pesos abiertos|open weights|fine-tuning|razonamiento)\b/i.test(
      fullSignal
    );
  const isAI =
    category === "AI" ||
    /\b(inteligencia artificial|agente|agentes|agentic|llm|openai|anthropic|huggingface|neuronal|generativ|machine learning|deep learning|copiloto|rag|chatgpt)\b/i.test(
      fullSignal
    );

  // Extract existing paragraphs from rawBody, ignoring simple title repeats
  const existingParas = rawBody
    .split(/\n+/)
    .map((p) => p.trim())
    .filter(
      (p) => p.length > 20 && p.toLowerCase() !== cleanTitle.toLowerCase()
    );

  const firstRaw = existingParas[0] || "";
  const normalizedFirst = firstRaw
    ? firstRaw.endsWith(".") || firstRaw.endsWith("?") || firstRaw.endsWith("!")
      ? firstRaw
      : `${firstRaw}.`
    : "";

  // Contextual expansion variants so even short 1-sentence RSS descriptions become rich leads
  const leadExpansionsEs = isCybersecurity
    ? [
        `El reporte técnico de ${sourceName} detalla el alcance operativo de este vector, las versiones comprometidas y las medidas de contención recomendadas para equipos de seguridad e infraestructura.`,
        `Analizado por especialistas de ${sourceName}, el incidente pone de relieve la importancia de auditar dependencias críticas, reforzar controles de acceso y aplicar parches preventivos en producción.`,
        `La investigación difundida por ${sourceName} examina la cadena de ataque y ofrece indicadores clave para proteger entornos empresariales, servidores cloud y flujos de despliegue continuo.`,
      ]
    : isEnterpriseOrg
    ? [
        `A través de este caso documentado por ${sourceName}, se examina cómo la adopción de sistemas inteligentes redefine la estructura operativa, automatiza procesos complejos y eleva la capacidad de ejecución de los equipos.`,
        `El análisis de ${sourceName} profundiza en la integración práctica de estas tecnologías dentro del flujo de trabajo diario, combinando supervisión experta con automatización de alto valor.`,
        `La publicación de ${sourceName} muestra cómo las organizaciones están rediseñando sus procesos internos, delegando tareas intensivas en datos a arquitecturas asistidas por IA.`,
      ]
    : isModels
    ? [
        `El informe técnico de ${sourceName} evalúa las mejoras en arquitectura, capacidad de razonamiento multimodal, latencia de inferencia y eficiencia operativa frente a los estándares actuales de la industria.`,
        `Documentado por ${sourceName}, este avance introduce optimizaciones clave en manejo de contexto y generación estructurada para desarrolladores que construyen aplicaciones sobre modelos de última generación.`,
        `La cobertura de ${sourceName} desglosa el rendimiento real del modelo en escenarios complejos de ingeniería, programación asistida y despliegue escalable vía API o entorno local.`,
      ]
    : isEmployability
    ? [
        `El seguimiento editorial de ${sourceName} analiza las repercusiones directas sobre la contratación tecnológica, la valoración de habilidades de ingeniería y la estrategia de las principales firmas del sector.`,
        `Reportado por ${sourceName}, este movimiento refleja la evolución del mercado laboral tech hacia perfiles híbridos con sólido dominio arquitectónico y capacidad de adaptación tecnológica.`,
        `La nota de ${sourceName} aporta contexto sobre las dinámicas financieras y de talento que están definiendo las oportunidades profesionales para desarrolladores e ingenieros en 2026.`,
      ]
    : isHardwareChips
    ? [
        `El artículo de ${sourceName} explora las innovaciones de ingeniería física, eficiencia energética y capacidad de cómputo necesarias para sostener la próxima generación de sistemas autónomos y centros de datos.`,
        `Analizado por ${sourceName}, este hito en hardware e infraestructura redefine la densidad de procesamiento disponible para cargas intensivas de inteligencia artificial y robótica avanzada.`,
        `La cobertura técnica de ${sourceName} detalla cómo la convergencia entre diseño electrónico y software optimizado impulsa nuevos estándares de rendimiento industrial.`,
      ]
    : isAI
    ? [
        `La publicación de ${sourceName} examina el paso de modelos conversacionales a arquitecturas agénticas capaces de planificar, ejecutar herramientas e integrarse de forma nativa en flujos reales de ingeniería.`,
        `En este análisis de ${sourceName} se detallan los mecanismos técnicos, retos de confiabilidad y ganancias de productividad que conlleva desplegar inteligencia artificial aplicada a escala.`,
        `El reporte de ${sourceName} profundiza en cómo esta evolución tecnológica transforma la interacción entre desarrolladores, sistemas autónomos y plataformas de software modernas.`,
      ]
    : [
        `El informe técnico de ${sourceName} analiza el impacto directo de este desarrollo en la arquitectura de software moderna, la mantenibilidad del código y la eficiencia de los equipos de ingeniería.`,
        `Documentado por ${sourceName}, este avance propone mejoras concretas en rendimiento, observabilidad y herramientas de desarrollo para entornos de producción exigentes.`,
        `La cobertura de ${sourceName} explora los fundamentos técnicos detrás de "${cleanTitle}" y sus implicaciones prácticas para el ecosistema de desarrollo actual.`,
      ];

  const leadExpansionsEn = [
    `Reported by ${sourceName}, this analysis explores the technical architecture, operational trade-offs, and real-world engineering impact behind "${cleanTitle}".`,
    `This report from ${sourceName} examines how the development reshapes production workflows, system reliability, and strategic decision-making across technical teams.`,
    `Covered in depth by ${sourceName}, this update highlights key implementation details, performance benchmarks, and practical takeaways for software engineers.`,
  ];

  const chosenExpansion = isEs
    ? leadExpansionsEs[h % leadExpansionsEs.length]
    : leadExpansionsEn[h % leadExpansionsEn.length];

  // Build paragraph 1 (and cardLead) so it is NEVER a tiny 1-line stub
  let paragraph1: string;
  if (!normalizedFirst) {
    paragraph1 = isEs
      ? `El reporte publicado por ${sourceName} aborda un acontecimiento clave en el ecosistema tecnológico actual: "${cleanTitle}". ${chosenExpansion}`
      : `The report published by ${sourceName} covers a key milestone in today's technology ecosystem: "${cleanTitle}". ${chosenExpansion}`;
  } else if (normalizedFirst.length < 185) {
    paragraph1 = `${normalizedFirst} ${chosenExpansion}`;
  } else {
    paragraph1 = normalizedFirst;
  }

  // Card lead: rich 240-330 char summary for the grid card so cards never look empty
  const cardLead =
    paragraph1.length > 330
      ? `${paragraph1.slice(0, 325).replace(/\s+\S*$/, "")}…`
      : paragraph1;

  const paragraphs: string[] = [paragraph1];

  // Add any remaining paragraphs from the original source if present
  if (existingParas.length > 1) {
    for (let i = 1; i < existingParas.length; i++) {
      paragraphs.push(existingParas[i]);
    }
  }

  // Paragraph 2: Deep technical & architectural context
  if (paragraphs.length < 2) {
    const p2PoolEs = isCybersecurity
      ? [
          `Desde una perspectiva de seguridad ofensiva y defensiva, lo expuesto en "${cleanTitle}" exige revisar la superficie de exposición en servicios conectados, validar la integridad de las cadenas de suministro de software y priorizar la aplicación de mitigaciones oficiales recomendadas por ${sourceName}.`,
          `A nivel de infraestructura y operaciones (SecOps), este escenario demuestra que la velocidad de respuesta entre la divulgación de un fallo y su remediación efectiva es crítica para evitar movimientos laterales, exfiltración de activos o interrupciones operativas.`,
        ]
      : isEnterpriseOrg
      ? [
          `En el plano organizacional y de arquitectura de procesos, la propuesta en torno a "${cleanTitle}" ilustra cómo los sistemas agénticos dejan de ser herramientas aisladas para integrarse como capas operativas que colaboran antes, durante y después de cada decisión humana.`,
          `Para los equipos técnicos y de negocio, esta transformación implica diseñar flujos con trazabilidad, control de calidad automatizado y permisos granulares, logrando que la inteligencia artificial amplifique el criterio experto sin comprometer la gobernanza.`,
        ]
      : isModels
      ? [
          `Desde la ingeniería de modelos y sistemas de inferencia, "${cleanTitle}" refleja la intensa competencia por optimizar el razonamiento paso a paso, reducir el costo por millón de tokens y ampliar la ventana de contexto efectiva en tareas de código y análisis profundo.`,
          `Al evaluar su incorporación en pipelines de producción o arquitecturas RAG, los arquitectos de software deben contrastar la ganancia en precisión frente a la latencia de respuesta, los límites de tasa y los requisitos de infraestructura.`,
        ]
      : isEmployability
      ? [
          `En relación con el mercado laboral y la estrategia corporativa, los datos alrededor de "${cleanTitle}" confirman una reconfiguración acelerada de los perfiles más buscados: se premia la capacidad de diseñar sistemas completos, auditar código generado por IA y resolver problemas de negocio reales.`,
          `Para desarrolladores e ingenieros de software, entender estas señales del mercado permite orientar el aprendizaje continuo hacia áreas de alta resiliencia como arquitectura distribuida, seguridad, datos e integración de agentes inteligentes.`,
        ]
      : [
          `Desde el punto de vista de la ingeniería de software y arquitectura de sistemas, los avances descritos en "${cleanTitle}" apuntan a reducir la fricción en el ciclo de vida del desarrollo, mejorar la confiabilidad en producción y estandarizar la integración entre herramientas.`,
          `La adopción de este tipo de soluciones documentadas por ${sourceName} requiere evaluar cuidadosamente la compatibilidad con el stack existente, el impacto en observabilidad y el retorno técnico a mediano plazo para el equipo.`,
        ];

    const p2PoolEn = [
      `From a systems architecture and engineering perspective, the developments surrounding "${cleanTitle}" highlight critical shifts in how modern teams design, deploy, and govern scalable software infrastructure.`,
      `Evaluating this milestone reported by ${sourceName} requires balancing immediate productivity and performance gains against operational governance, maintainability, and long-term architectural resilience.`,
    ];

    paragraphs.push(
      isEs ? p2PoolEs[h % p2PoolEs.length] : p2PoolEn[h % p2PoolEn.length]
    );
  }

  // Paragraph 3: Direct source guidance & actionable synthesis
  if (paragraphs.length < 3) {
    paragraphs.push(
      isEs
        ? `Esta ficha editorial sintetiza los ejes técnicos más importantes de la noticia para ofrecerte contexto inmediato; para revisar las métricas primarias, demostraciones completas y declaraciones oficiales, accede directamente al artículo original en ${sourceName} desde los enlaces destacados en esta ventana.`
        : `This editorial briefing synthesizes the core technical dimensions of the story to give you immediate context; to inspect primary metrics, full demonstrations, and official statements, open the original article on ${sourceName} via the direct source links in this modal.`
    );
  }

  // 2. Filter out generic/placeholder key points and build 4 rich, specific takeaways
  const filteredPoints = keyPoints.filter(
    (kp) =>
      kp &&
      kp.trim().length > 18 &&
      !kp.includes("Fuente verificada:") &&
      !kp.includes("Análisis técnico relevante para ingenieros") &&
      kp.trim().toLowerCase() !== cleanTitle.toLowerCase()
  );

  const finalKeyPoints: string[] = [...filteredPoints];

  if (finalKeyPoints.length < 4) {
    const specificPointsEs = isCybersecurity
      ? [
          `Alerta e investigación técnica documentada por ${sourceName} sobre "${cleanTitle}".`,
          "Identifica vectores de exposición que requieren auditoría de versiones, credenciales y políticas de red.",
          "Prioriza la contención preventiva y la actualización de componentes afectados en entornos productivos.",
          `Incluye enlace directo a ${sourceName} para consultar detalles forenses, parches e indicadores técnicos.`,
        ]
      : isEnterpriseOrg
      ? [
          `Caso de transformación operativa y flujos agénticos analizado por ${sourceName}.`,
          "Integra modelos avanzados de IA directamente en procesos críticos, reduciendo tiempos de análisis manual.",
          "Establece un esquema de colaboración donde la automatización resuelve tareas repetitivas bajo supervisión experta.",
          `Accede a la publicación oficial en ${sourceName} para conocer la arquitectura e implementación completa.`,
        ]
      : isModels
      ? [
          `Análisis de capacidades, arquitectura y rendimiento de modelos publicado por ${sourceName}.`,
          "Mejora la precisión en razonamiento complejo, generación de código y procesamiento de contexto extenso.",
          "Impacta la selección de modelos e infraestructura para equipos que despliegan agentes y pipelines de IA.",
          `Consulta la fuente directa en ${sourceName} para ver comparativas, benchmarks y especificaciones oficiales.`,
        ]
      : isEmployability
      ? [
          `Radiografía del sector tecnológico y evolución del talento reportada por ${sourceName}.`,
          "Muestra cómo la automatización redefine las competencias clave exigidas a ingenieros y líderes técnicos.",
          "Aporta señales claras sobre inversión corporativa, contrataciones y adopción tecnológica empresarial.",
          `Lee el informe original en ${sourceName} para profundizar en las cifras y declaraciones completas.`,
        ]
      : [
          `Desarrollo relevante de tecnología e ingeniería cubierto por ${sourceName}: "${cleanTitle}".`,
          "Introduce mejoras prácticas en eficiencia operativa, arquitectura de sistemas y flujo de trabajo técnico.",
          "Establece nuevos criterios de calidad, escalabilidad e integración con ecosistemas modernos.",
          `Enlace directo verificado a ${sourceName} para revisar la documentación y el artículo íntegro.`,
        ];

    const specificPointsEn = [
      `Primary technical coverage by ${sourceName} examining "${cleanTitle}".`,
      "Highlights architectural trade-offs, workflow automation, and practical implementation patterns.",
      "Impacts engineering productivity, system reliability, and technical roadmap decisions.",
      `Direct link to ${sourceName} provided for full primary documentation and benchmarks.`,
    ];

    const pool = isEs ? specificPointsEs : specificPointsEn;
    for (const pt of pool) {
      if (finalKeyPoints.length >= 4) break;
      if (!finalKeyPoints.includes(pt)) {
        finalKeyPoints.push(pt);
      }
    }
  }

  // 3. Build specific Advantages & Disadvantages
  let advantagesEs: string[];
  let disadvantagesEs: string[];
  let advantagesEn: string[];
  let disadvantagesEn: string[];

  if (isCybersecurity) {
    advantagesEs = [
      "Visibilidad temprana del fallo o amenaza para aplicar parches y reglas de detección antes de incidentes.",
      "Fortalecimiento de la postura de seguridad (Zero Trust) y trazabilidad sobre componentes vulnerables.",
      "Documentación de vectores de ataque que facilita la auditoría preventiva en infraestructuras similares.",
    ];
    disadvantagesEs = [
      "Riesgo de explotación activa en organizaciones que demoren la actualización de sistemas o dependencias.",
      "Carga operativa adicional para equipos de SecOps y DevOps durante el despliegue urgente de mitigaciones.",
      "Posible fricción o reinicio de servicios críticos al aplicar parches de seguridad de emergencia.",
    ];
    advantagesEn = [
      "Early visibility into the threat vector to apply patches and detection rules proactively.",
      "Strengthens Zero Trust security posture and traceability across vulnerable components.",
      "Actionable attack vector documentation that aids preventive auditing.",
    ];
    disadvantagesEn = [
      "Active exploitation risk for organizations delaying dependency or system updates.",
      "Operational overhead for SecOps and DevOps teams during emergency patch rollouts.",
      "Potential service friction or downtime required to apply critical security mitigations.",
    ];
  } else if (isEnterpriseOrg) {
    advantagesEs = [
      "Aceleración drástica de flujos de trabajo complejos (análisis documental, código y operaciones) con mayor precisión.",
      "Liberación de tiempo operativo para que los profesionales se concentren en estrategia, diseño y decisiones críticas.",
      "Escalabilidad inmediata de procesos internos mediante sistemas agénticos integrados al flujo de la empresa.",
    ];
    disadvantagesEs = [
      "Necesidad de rediseñar procesos internos, permisos y supervisión humana para evitar errores automatizados.",
      "Retos de privacidad, cumplimiento normativo y gobernanza al procesar información corporativa sensible.",
      "Resistencia cultural o curva de adaptación organizacional al integrar agentes de IA en el organigrama.",
    ];
    advantagesEn = [
      "Drastic acceleration of complex workflows (document analysis, code, and operations) with high accuracy.",
      "Frees up professional bandwidth to focus on high-value strategy and critical decision-making.",
      "Immediate scalability of internal processes through integrated agentic workflows.",
    ];
    disadvantagesEn = [
      "Requires redesigning internal workflows, permissions, and human-in-the-loop oversight.",
      "Privacy, regulatory compliance, and data governance challenges with sensitive corporate data.",
      "Organizational adaptation curve when integrating AI agents into team structures.",
    ];
  } else if (isModels) {
    advantagesEs = [
      "Mayor capacidad de razonamiento técnico, generación de código e interpretación de contextos extensos.",
      "Optimización en la relación costo-rendimiento por millón de tokens y menor latencia de inferencia.",
      "Impulso a nuevas arquitecturas de agentes autónomos y asistentes especializados de alta precisión.",
    ];
    disadvantagesEs = [
      "Exigencia de evaluación rigurosa (evals) para prevenir alucinaciones o regresiones en producción.",
      "Alto consumo de cómputo y memoria VRAM en caso de requerir despliegues locales o fine-tuning propio.",
      "Dependencia de límites de cuota (rate limits) y políticas de precios de proveedores de modelos.",
    ];
    advantagesEn = [
      "Higher technical reasoning capability, code generation accuracy, and long-context comprehension.",
      "Improved cost-to-performance ratio per million tokens and lower inference latency.",
      "Enables more capable autonomous agent architectures and specialized technical assistants.",
    ];
    disadvantagesEn = [
      "Requires strict evaluation suites (evals) to prevent hallucinations or regressions in production.",
      "High compute and VRAM footprint for self-hosted deployments or custom fine-tuning.",
      "Exposure to API rate limits and vendor pricing shifts in cloud-hosted workflows.",
    ];
  } else if (isEmployability) {
    advantagesEs = [
      "Creación de roles de alto impacto en ingeniería de IA, arquitectura cloud, datos y ciberseguridad.",
      "Prima salarial y competitiva para profesionales que dominan tanto fundamentos técnicos como herramientas de IA.",
      "Claridad estratégica sobre qué habilidades y tecnologías concentran la inversión de la industria.",
    ];
    disadvantagesEs = [
      "Mayor exigencia en entrevistas técnicas y reducción de vacantes centradas en tareas repetitivas.",
      "Ciclos de ajuste y volatilidad en contrataciones dentro de grandes corporaciones tecnológicas.",
      "Presión constante de actualización técnica (upskilling) para mantener relevancia en el mercado.",
    ];
    advantagesEn = [
      "Growth of high-impact roles in AI engineering, cloud architecture, data, and cybersecurity.",
      "Compensation premium for engineers combining strong fundamentals with AI-native workflows.",
      "Clear market visibility into which skills and stacks attract industry capital.",
    ];
    disadvantagesEn = [
      "Higher bar in technical interviews and fewer openings for repetitive implementation tasks.",
      "Hiring volatility during quarterly restructuring across large tech enterprises.",
      "Continuous upskilling pressure required to stay competitive.",
    ];
  } else {
    advantagesEs = [
      "Incremento medible en productividad de desarrollo, mantenibilidad y velocidad de entrega de software.",
      "Integración nativa con herramientas modernas, repositorios y flujos de despliegue continuo.",
      "Estandarización de buenas prácticas técnicas respaldadas por líderes de la industria.",
    ];
    disadvantagesEs = [
      "Curva de aprendizaje e inversión de ingeniería necesaria para adoptarlo en sistemas en producción.",
      "Riesgo de acoplamiento tecnológico o costos acumulativos de consumo a gran escala.",
      "Requiere validación exhaustiva de seguridad, rendimiento y observabilidad antes de su despliegue total.",
    ];
    advantagesEn = [
      "Measurable gains in developer productivity, maintainability, and software delivery speed.",
      "Native integration with modern toolchains, repositories, and continuous deployment workflows.",
      "Standardizes engineering best practices backed by industry leaders.",
    ];
    disadvantagesEn = [
      "Learning curve and engineering effort required to integrate into existing production systems.",
      "Potential vendor lock-in or cumulative scaling costs under heavy workloads.",
      "Requires thorough security, performance, and observability validation before full rollout.",
    ];
  }

  return {
    cardLead,
    paragraphs,
    keyPoints: finalKeyPoints,
    advantages: isEs ? advantagesEs : advantagesEn,
    disadvantages: isEs ? disadvantagesEs : disadvantagesEn,
    domainTagEs: isCybersecurity
      ? "Ciberseguridad & SecOps"
      : isEnterpriseOrg
      ? "IA Empresarial & Agentes"
      : isModels
      ? "Modelos & Razonamiento"
      : isEmployability
      ? "Mercado Laboral Tech"
      : isHardwareChips
      ? "Hardware & Robótica"
      : isAI
      ? "Inteligencia Artificial"
      : "Ingeniería de Software",
    domainTagEn: isCybersecurity
      ? "Cybersecurity & SecOps"
      : isEnterpriseOrg
      ? "Enterprise AI & Agents"
      : isModels
      ? "Models & Reasoning"
      : isEmployability
      ? "Tech Job Market"
      : isHardwareChips
      ? "Hardware & Robotics"
      : isAI
      ? "Artificial Intelligence"
      : "Software Engineering",
    impactScore: Math.min(99, Math.max(80, Math.round(relevanceScore * 100))),
  };
}
