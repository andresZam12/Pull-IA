/**
 * PULL-IA — Database Seed
 *
 * Inserts the initial news sources into the `sources` table.
 * Run with: npm run db:seed
 *
 * It is safe to run many times: `upsert` creates the source if it
 * does not exist, or updates it if it already exists (matched by slug).
 */

import { PrismaClient } from "@prisma/client";
import { getSourceConfigs } from "../src/lib/fetchers/source-registry";

const prisma = new PrismaClient();

async function main() {
  const sources = getSourceConfigs();
  console.log(`🌱 Seeding ${sources.length} news sources...`);

  for (const source of sources) {
    const data = {
      name: source.name,
      url: source.url,
      feedUrl: source.feedUrl ?? null,
      type: source.type,
      category: source.categories,
      language: source.language,
      reputationScore: source.reputationScore,
    };

    await prisma.source.upsert({
      where: { slug: source.slug },
      update: data,
      create: { slug: source.slug, ...data },
    });

    console.log(`  ✔ ${source.name}`);
  }

  console.log("✅ Seed completed");
}

main()
  .catch((error) => {
    console.error("❌ Seed failed:", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
