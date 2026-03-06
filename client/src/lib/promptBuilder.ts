/**
 * Dynamic Prompt Builder — conditional assembly based on model.
 *
 * Claude: Full complexity (Syntax Rulebook + Voice Vault + RAG + caching)
 * Llama:  Lightweight (persona + RAG only — rulebook/vault baked into LoRA weights)
 */

import { VOICE_VAULT } from "./voiceVault";
import { SYNTAX_RULEBOOK, CORE_PERSONA } from "./syntaxRulebook";
import { db } from "./db";
import type { RagResult } from "./oramaSearch";

// ──────────────────────────────────────────────────────────────
// Claude prompt (full complexity)
// ──────────────────────────────────────────────────────────────

export interface ClaudePromptPayload {
    /** System prompt blocks with cache_control on the last static block */
    systemBlocks: Array<{
        type: "text";
        text: string;
        cache_control?: { type: "ephemeral" };
    }>;
    userMessage: string;
}

/**
 * Build the full-complexity system prompt for Claude.
 * Includes Syntax Rulebook, Voice Vault, RAG results, Approved/Rejected vaults.
 * Static blocks get Anthropic prompt caching.
 */
export async function buildClaudePrompt(
    sourceText: string,
    platform: string,
    ragResults: RagResult[],
): Promise<ClaudePromptPayload> {
    // ── Positive Examples ──
    let positiveExamples: string[] = [];

    if (ragResults.length > 0) {
        positiveExamples.push(
            ...ragResults.map(
                (r) => `[${r.platform}]\n${r.content}`,
            ),
        );
    }

    const approvedEntries = await db.approved_vault
        .orderBy("timestamp")
        .reverse()
        .limit(3)
        .toArray();

    if (approvedEntries.length > 0) {
        positiveExamples.push(
            ...approvedEntries.map(
                (e) => `[approved - ${e.platform_format}]\n${e.final_text}`,
            ),
        );
    }

    if (positiveExamples.length === 0) {
        const shuffled = [...VOICE_VAULT].sort(() => Math.random() - 0.5);
        positiveExamples = shuffled.slice(0, 5);
    }

    // ── Negative Examples ──
    let negativeBlock = "";
    const rejectedCount = await db.rejected_vault.count();
    if (rejectedCount > 0) {
        const allRejected = await db.rejected_vault.toArray();
        const randomRejected =
            allRejected[Math.floor(Math.random() * allRejected.length)];
        negativeBlock = `
<negative_examples>
The following draft was REJECTED. Avoid similar issues.

${randomRejected.rejected_text}
</negative_examples>`;
    }

    // ── Voice Vault (Base Context) ──
    const vaultSubset = VOICE_VAULT.slice(0, 10).join("\n\n---\n\n");
    const voiceVaultBlock = `<voice_vault>
These are Sam Parr's actual high-performing posts. Study their tone, rhythm, sentence structure, and formatting:

${vaultSubset}
</voice_vault>`;

    // ── Assemble System Blocks (static blocks cached) ──
    const systemBlocks: ClaudePromptPayload["systemBlocks"] = [
        {
            type: "text" as const,
            text: CORE_PERSONA,
        },
        {
            type: "text" as const,
            text: SYNTAX_RULEBOOK,
        },
        {
            type: "text" as const,
            text: voiceVaultBlock,
            // cache_control on the last static block for prompt caching
            cache_control: { type: "ephemeral" },
        },
        {
            type: "text" as const,
            text: `<positive_examples>
Analyze the syntactic structure and tone of these examples. Format your output to perfectly match this exact style.

${positiveExamples.join("\n\n---\n\n")}
</positive_examples>

${negativeBlock}

<instruction>
Analyze the syntactic structure and tone of the positive examples. Format your output to perfectly match this exact style. Look at the negative examples and strictly avoid similar issues.

Target platform: ${platform}

${platform === "instagram" ? `INSTAGRAM CAROUSEL FORMAT RULES:
- Output ONLY the slide content. Do NOT write any intro like "Here is your carousel" or "Sure, here are the slides". Start directly with Slide 1 content.
- Separate each slide with a line containing only: ---
- Each slide MUST have two parts separated by a blank line:
  HEADING: A short, punchy title (1 line, 3-8 words)
  (blank line)
  BODY: 2-3 short sentences expanding on the heading
- Slide 1 = strong hook that makes people want to swipe
- Last slide = clear CTA (follow, share, reply, etc.)
- 5-7 slides total

Example of correct slide format:
This is your hook heading

This is the first body sentence. This is the second body sentence.
---
Slide Two Heading Here

Expand on slide two here. Keep it punchy and direct.` : ""}
</instruction>`,
        },
    ];

    const userMessage = platform === "instagram"
        ? `Create an Instagram carousel based on the source text below. Output ONLY the slides in the exact format specified. No intro text, no remarks, no explanations. Start directly with the first slide heading. No em dashes (—).\n\nSource text:\n${sourceText}`
        : `Write a ${platform} post based on the following source text. Return ONLY the final post text. No explanation. No preamble. No em dashes (—).\n\nSource text:\n${sourceText}`;

    return { systemBlocks, userMessage };
}

// ──────────────────────────────────────────────────────────────
// Llama prompt (lightweight — rulebook/vault baked into LoRA)
// ──────────────────────────────────────────────────────────────

export interface LlamaPromptPayload {
    systemPrompt: string;
    userMessage: string;
}

const INSTAGRAM_FORMAT = `Format: Instagram carousel.
- DO NOT write any intro, preamble, or remarks. Start directly with the first slide heading.
- NO EM DASHES (—). Never use an em dash.
- Separate slides with a line containing only: ---
- Each slide has TWO parts separated by a blank line:
  1. HEADING: short punchy title (3-8 words)
  2. BODY: 2-3 short sentences expanding on it
- Slide 1 = hook that makes people swipe. Last slide = CTA.
- 5-7 slides total.

Example:
Your hook heading here

First body sentence. Second body sentence.
---
Next slide heading

Expand here. Keep it punchy.`;

const PLATFORM_INSTRUCTIONS: Record<string, string> = {
    linkedin: `Rewrite this for LinkedIn. Professional but conversational. Short paragraphs with line breaks. Punchy and value-driven. No hashtags. No emojis. NO EM DASHES (—). Return ONLY the post text, no intro or remarks.`,
    twitter: `Rewrite this for Twitter/X. Under 280 characters if possible, or a tight thread-worthy post. Sharp, direct, no hashtags, no emojis. NO EM DASHES (—). Return ONLY the tweet text, no intro.`,
    instagram: INSTAGRAM_FORMAT,
    newsletter: `Rewrite this as a newsletter section. Add depth and examples. Conversational, like writing to a smart friend. Add a subject line prefixed with "Subject: ". NO EM DASHES (—). Return ONLY the newsletter content, no intro remarks.`,
    quote: `Extract the single most powerful quotable idea from this. One punchy standalone sentence under 30 words. NO EM DASHES (—). Return ONLY the quote, nothing else.`,
};

/**
 * Build the lightweight prompt for Ollama (fine-tuned local model).
 * The model already sounds like Sam — just give it clear platform
 * instructions and RAG context. Keep the system prompt minimal.
 */
export function buildLlamaPrompt(
    sourceText: string,
    platform: string,
    ragResults: RagResult[],
): LlamaPromptPayload {
    let ragContext = "";
    if (ragResults.length > 0) {
        const ragPosts = ragResults
            .map((r) => `[${r.platform}]\n${r.content}`)
            .join("\n\n---\n\n");
        ragContext = `\n\nStyle reference from previous posts:\n${ragPosts}`;
    }

    // Fine-tuned model has Sam's voice baked in, just set the role
    const systemPrompt = `You are ghostwriting as Sam Parr. Write exactly like him: short, punchy, no BS, founder energy. No em dashes (—).\n${ragContext}`;

    const platformInstruction =
        PLATFORM_INSTRUCTIONS[platform] ?? `Rewrite this as a ${platform} post. NO EM DASHES (—).`;

    const userMessage = platform === "instagram"
        ? `${platformInstruction}\n\nSource:\n${sourceText}\n\nBegin your response immediately with the first slide heading. Do not write "Here is", "Sure", or any other preamble.`
        : `${platformInstruction}\n\nSource:\n${sourceText}`;

    return { systemPrompt, userMessage };
}

// ──────────────────────────────────────────────────────────────
// Haiku formatter prompt (Step 2 of the Ollama pipeline)
// ──────────────────────────────────────────────────────────────

/**
 * Build the formatting-only prompt for Claude Haiku.
 * Receives raw Sam-voiced content from Ollama and restructures it
 * for the target platform. Voice is already correct — only structure matters.
 */
export function buildHaikuFormatterPrompt(
    samVoiceContent: string,
    platform: string,
): ClaudePromptPayload {
    const platformFormatRules = platform === "instagram"
        ? INSTAGRAM_FORMAT
        : PLATFORM_INSTRUCTIONS[platform] ?? `Format this as a ${platform} post.`;

    const systemBlocks: ClaudePromptPayload["systemBlocks"] = [
        {
            type: "text" as const,
            text: `You are a content formatter. You receive raw content written in Sam Parr's voice and your ONLY job is to restructure it for the target platform. Do not change the voice, words, or ideas, only the structure and format. Never add explanations, preamble, or remarks. ABSOLUTELY NO EM DASHES (—). Provide the output without em dashes.`,
        },
    ];

    const userMessage = platform === "instagram"
        ? `${platformFormatRules}\n\nBegin your response immediately with the first slide heading. Do not write any intro.\n\nRaw content to format:\n${samVoiceContent}`
        : `${platformFormatRules}\n\nReturn ONLY the formatted post.\n\nRaw content to format:\n${samVoiceContent}`;

    return { systemBlocks, userMessage };
}
