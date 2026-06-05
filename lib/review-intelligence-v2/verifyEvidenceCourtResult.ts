import { retrieveReviewContext } from "../rag/retrieveReviewContext";
import { verifyZrtReviewInsight } from "../review-intelligence/verifyZrtReviewInsight";
import { generateDeterministicZrtReviewInsight } from "../review-intelligence/generateZrtReviewInsight";
import type { EvidenceCourtPacket, EvidenceCourtResult, EvidenceCourtVerification } from "./types";
import { buildEvidenceCourtResultFromPacket } from "./runEvidenceCourt";

export function verifyEvidenceCourtResult(packet: EvidenceCourtPacket, result: EvidenceCourtResult): EvidenceCourtVerification {
  const context = result.context ?? retrieveReviewContext(packet, "review_set_summary", { page: "review" });
  const verification = verifyZrtReviewInsight(context, result.insight);
  return {
    ...verification,
    verifiedClaimCount: result.signalAnalyst.strongestEvidence.length + result.skepticAnalyst.concerns.length,
    rejectedClaimCount: verification.errors.length
  };
}

export function safeEvidenceCourtFallback(
  packet: EvidenceCourtPacket,
  message = "The review set needs analyst review before it can be attached to the memo."
) {
  const context = retrieveReviewContext(packet, "review_set_summary", { page: "review" });
  const insight = generateDeterministicZrtReviewInsight(context);
  const fallback = buildEvidenceCourtResultFromPacket(packet, []);
  return {
    ...fallback,
    verdict: {
      ...fallback.verdict,
      code: "needs_review" as const,
      label: "Review set needs analyst review" as const,
      summary: message
    },
    memoReadySummary: insight.memoReadySummary,
    limitations: insight.limitations,
    verification: {
      ok: false,
      errors: [message],
      warnings: [],
      verifiedClaimCount: fallback.signalAnalyst.strongestEvidence.length + fallback.skepticAnalyst.concerns.length,
      rejectedClaimCount: 1
    }
  };
}
