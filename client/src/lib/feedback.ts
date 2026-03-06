/**
 * ELO-style feedback loop for RAG post weighting.
 * Approve: +20 to Historical_Posts used as context. Reject: -20.
 */

import { db } from "./db";

const WEIGHT_DELTA = 20;
const MIN_WEIGHT = 100;

/**
 * Update weight_score for Historical_Posts used as RAG context.
 * Called on Approve (+20) or Reject (-20).
 */
export async function updateWeightScores(
    postIds: number[],
    delta: number,
): Promise<void> {
    if (postIds.length === 0) return;

    for (const id of postIds) {
        const post = await db.historical_posts.get(id);
        if (!post) continue;

        const current = post.weight_score ?? 1000;
        const next = Math.max(MIN_WEIGHT, current + delta);
        await db.historical_posts.update(id, { weight_score: next });
    }
}

export const APPROVE_DELTA = WEIGHT_DELTA;
export const REJECT_DELTA = -WEIGHT_DELTA;
