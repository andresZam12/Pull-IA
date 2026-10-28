/**
 * PULL-IA — Manual & Scheduled Ingestion Worker
 *
 * Runs full ingestion across all registered tech sources:
 * - Cybersecurity (The Hacker News, BleepingComputer, SecurityWeek)
 * - Frontier AI & Agents (Hugging Face, MarkTechPost, Simon Willison)
 * - Tech Markets & Big Tech (ZDNet, NYT Tech)
 * - Major Tech & Engineering (TechCrunch, The Verge, GitHub, etc.)
 */

import { IngestionPipeline } from "../src/lib/pipeline/ingest";

async function main() {
  console.log("==========================================");
  console.log("🚀 Starting PULL-IA Live News Ingestion");
  console.log("==========================================");

  const batchSize = process.env.INGEST_BATCH_SIZE
    ? parseInt(process.env.INGEST_BATCH_SIZE, 10)
    : 10;

  const pipeline = new IngestionPipeline();
  const result = await pipeline.run(batchSize);

  console.log("\n✅ Ingestion Run Complete!");
  console.log(`- Fetched:      ${result.fetched}`);
  console.log(`- Deduplicated: ${result.deduplicated}`);
  console.log(`- Classified:   ${result.classified}`);
  console.log(`- Published:    ${result.published}`);
  console.log(`- Rejected:     ${result.rejected}`);
  console.log(`- Duration:     ${(result.duration / 1000).toFixed(2)}s`);

  if (result.errors.length > 0) {
    console.log(`\n⚠️ ${result.errors.length} Warnings/Errors:`);
    result.errors.forEach((e) =>
      console.log(`  [${e.source}] ${e.message}`)
    );
  }

  process.exit(0);
}

main().catch((err) => {
  console.error("❌ Fatal Error in Ingestion Pipeline:", err);
  process.exit(1);
});
