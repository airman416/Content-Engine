/**
 * Shared approve/reject logic for drafts.
 * Handles Approved_Vault, Rejected_Vault, trash, and ELO weight updates.
 */

import { db } from "./db";
import { updateWeightScores, APPROVE_DELTA, REJECT_DELTA } from "./feedback";
import type { RejectReason } from "@/components/reject-reason-popover";

export interface ApproveParams {
  draftId: number;
  sourcePostId: number;
  platform: string;
  finalText: string;
  contextPostIds: number[];
}

export interface RejectParams {
  draftId: number;
  sourcePostId: number;
  content: string;
  platform: string;
  reason: RejectReason;
  originalContent: string;
  contextPostIds: number[];
}

export async function approveDraft(params: ApproveParams): Promise<void> {
  const { draftId, sourcePostId, platform, finalText, contextPostIds } =
    params;

  await db.approved_vault.add({
    platform_format: platform,
    final_text: finalText,
    timestamp: new Date().toISOString(),
  });

  await db.drafts.update(draftId, { status: "approved" });
  await updateWeightScores(contextPostIds, APPROVE_DELTA);
}

export async function rejectDraft(params: RejectParams): Promise<void> {
  const {
    draftId,
    sourcePostId,
    content,
    platform,
    reason,
    originalContent,
    contextPostIds,
  } = params;

  await db.rejected_vault.add({
    rejected_text: content,
    reason,
    timestamp: new Date().toISOString(),
  });

  await db.trash.add({
    draftId,
    sourcePostId,
    content,
    platform,
    rejectedAt: new Date().toISOString(),
    originalContent,
  });

  await db.drafts.update(draftId, { status: "rejected" });
  await updateWeightScores(contextPostIds, REJECT_DELTA);
}
