/**
 * Load training_data.jsonl into Historical_Posts (Dexie).
 * Fetches from /training_data.jsonl and upserts with weight_score 1000.
 */

import { db, type HistoricalPost } from "./db";

const TRAINING_URL = "/training_data.jsonl";
const DEFAULT_WEIGHT = 1000;

export async function loadTrainingData(): Promise<number> {
  const res = await fetch(TRAINING_URL);
  if (!res.ok) {
    console.warn("Training data not found:", res.status);
    return 0;
  }

  const text = await res.text();
  const lines = text.trim().split("\n").filter(Boolean);
  const entries: Omit<HistoricalPost, "id">[] = [];

  for (const line of lines) {
    try {
      const row = JSON.parse(line) as { instruction?: string; output?: string };
      if (row.instruction && row.output) {
        entries.push({
          instruction: row.instruction,
          output: row.output,
          weight_score: DEFAULT_WEIGHT,
        });
      }
    } catch {
      // skip malformed lines
    }
  }

  if (entries.length === 0) return 0;

  const existing = await db.historical_posts.count();
  if (existing > 0) {
    // Already seeded — only update weights for existing, don't re-add
    return existing;
  }

  await db.historical_posts.bulkAdd(entries);
  return entries.length;
}
