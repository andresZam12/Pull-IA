import prisma from "../src/lib/db/prisma";
import { Category } from "../src/types";

async function main() {
  console.log("Updating old articles in Supabase...");

  const updates = [
    {
      id: "cmux4k05h003oo628mayk0atp",
      titleEs: "Nuevos investigadores de primer nivel se unen al equipo de IA y Economía de Google",
      titleEn: "New experts join Google’s AI & Economy team",
      summaryEs: "Google incorporó a destacados economistas e investigadores globales para evaluar el impacto macroeconómico de la automatización por IA en el mercado laboral contemporáneo, con énfasis en la transición de habilidades para desarrolladores.",
      summaryEn: "Google welcomed prominent global economists and researchers to analyze the macroeconomic impact of AI automation on modern labor markets, focusing on workforce skill transitions for developers.",
      category: Category.EMPLOYABILITY,
      keyPoints: [
        "Estudio exhaustivo sobre productividad y demanda de talento en IA.",
        "Desarrollo de marcos éticos para el mercado laboral del software.",
        "Publicación de métricas trimestrales sobre adopción técnica."
      ]
    },
    {
      id: "cmux4k2pw003to628fvpzljck",
      titleEs: "Co-creando el futuro del diseño digital y la moda mediante visión computacional",
      titleEn: "Co-creating the future of fashion with Google",
      summaryEs: "En colaboración con diseñadores internacionales, Google presentó nuevas herramientas de visión por computadora y generación de texturas 3D en tiempo real para optimizar la cadena de producción textil y reducir el desperdicio industrial.",
      summaryEn: "In partnership with global designers, Google unveiled computer vision and real-time 3D texture synthesis tools aimed at streamlining textile production workflows and reducing industrial waste.",
      category: Category.PROGRAMMING,
      keyPoints: [
        "Modelos de difusión adaptados para renderizado de patrones.",
        "Optimización de patronaje mediante algoritmos de aprendizaje profundo.",
        "Simulaciones digitales que reducen hasta 30% los prototipos físicos."
      ]
    },
    {
      id: "cmux4k5aj003yo628f5byigbm",
      titleEs: "Haciendo que la exploración de macrodatos globales sea más accesible para ingenieros",
      titleEn: "Making global data easier to explore with Google Data Commons",
      summaryEs: "Google Data Commons integró nuevas APIs de lenguaje natural que permiten a desarrolladores y analistas consultar conjuntos de datos públicos masivos utilizando consultas semánticas directas en SQL y Python.",
      summaryEn: "Google Data Commons integrated new natural language APIs, empowering software engineers and data analysts to query massive public datasets using direct semantic queries in SQL and Python.",
      category: Category.ENGINEERING,
      keyPoints: [
        "Acceso unificado a más de 3 billones de puntos de datos oficiales.",
        "SDK de Python y JavaScript para correlación de datos demográficos.",
        "Respuestas estructuradas en JSON listas para visualización."
      ]
    }
  ];

  for (const u of updates) {
    await prisma.articleSummary.update({
      where: { articleId: u.id },
      data: {
        titleEs: u.titleEs,
        titleEn: u.titleEn,
        summaryEs: u.summaryEs,
        summaryEn: u.summaryEn,
        category: u.category,
        keyPoints: u.keyPoints
      }
    });
    console.log("Updated article:", u.id, u.titleEs);
  }

  console.log("All 3 articles updated successfully.");
}

main()
  .then(() => process.exit(0))
  .catch((e) => {
    console.error("Error:", e);
    process.exit(1);
  });
