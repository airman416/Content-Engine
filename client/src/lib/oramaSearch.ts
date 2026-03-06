/**
 * Client-side RAG using Orama — indexes instruction field from training_data.jsonl
 * (Historical_Posts), returns corresponding outputs as few-shot context.
 * Ranked by relevance * weight_score (ELO-style).
 */

import { create, insert, search, type AnyOrama } from "@orama/orama";
import { db } from "./db";

let oramaDb: AnyOrama | null = null;
let indexedIds: Set<number> = new Set();

/** Schema: instruction is searched, output is retrieved from Dexie */
const SCHEMA = {
    id: "string",
    instruction: "string",
} as const;

/**
 * Initialize Orama index from Historical_Posts (training_data.jsonl).
 * Indexes the instruction field for semantic search.
 */
export async function initOramaIndex(): Promise<void> {
    oramaDb = await create({ schema: SCHEMA });
    indexedIds = new Set();

    const posts = await db.historical_posts.toArray();
    for (const post of posts) {
        if (!post.id || !post.instruction) continue;
        await insert(oramaDb, {
            id: String(post.id),
            instruction: post.instruction,
        });
        indexedIds.add(post.id);
    }
}

export interface RagResult {
    /** Historical_Posts id (for ELO weight updates) */
    postId: number;
    /** The output (Sam-style post) to use as few-shot example */
    content: string;
    platform: string;
    relevance: number;
}

/**
 * Query by user's source text against instructions. Return top N outputs
 * sorted by relevance * weight_score.
 */
export async function queryRag(
    queryText: string,
    limit = 3,
): Promise<RagResult[]> {
    if (!oramaDb) {
        await initOramaIndex();
    }
    if (!oramaDb) return [];

    const results = await search(oramaDb, {
        term: queryText,
        limit: Math.max(limit * 4, 12),
    });

    const withWeights: Array<RagResult & { combinedScore: number }> = [];
    for (const hit of results.hits) {
        const doc = hit.document as { id: string; instruction: string };
        const postId = parseInt(doc.id, 10);
        const row = await db.historical_posts.get(postId);
        if (!row) continue;

        const weight = row.weight_score ?? 1000;
        const relevance = hit.score;
        const combinedScore = relevance * weight;
        withWeights.push({
            postId,
            content: row.output,
            platform: "twitter",
            relevance,
            combinedScore,
        });
    }

    withWeights.sort((a, b) => b.combinedScore - a.combinedScore);
    return withWeights.slice(0, limit).map(({ combinedScore, ...r }) => r);
}

/**
 * Rebuild the index. Call after training data is loaded.
 */
export async function rebuildIndex(): Promise<void> {
    await initOramaIndex();
}
