import { retrieveReviewContext } from "../rag/retrieveReviewContext";
import { generateLlmZrtReviewInsight } from "../review-intelligence/generateLlmZrtReviewInsight";
import { verifyZrtReviewInsight } from "../review-intelligence/verifyZrtReviewInsight";
import { buildEvidenceCourtResultFromInsight, buildEvidenceCourtResultFromPacket } from "./runEvidenceCourt";
import type { CounterfactualCheck, EvidenceCourtPacket, EvidenceCourtResult } from "./types";

export async function generateLLMEvidenceCourt(
  packet: EvidenceCourtPacket,
  counterfactuals: CounterfactualCheck[],
  deterministicFallback?: EvidenceCourtResult
) {
  const fallback = deterministicFallback ?? buildEvidenceCourtResultFromPacket(packet, counterfactuals);
  const context = deterministicFallback?.context ?? retrieveReviewContext(packet, "review_set_summary", { page: "review" });
  const llmResult = await generateLlmZrtReviewInsight(context);

  if (llmResult.usedFallback) {
    return deterministicFallback ?? fallback;
  }

  const verification = verifyZrtReviewInsight(context, llmResult.insight);
  if (!verification.ok || !verification.verifiedInsight) {
    return deterministicFallback ?? fallback;
  }

  return buildEvidenceCourtResultFromInsight(
    context,
    verification.verifiedInsight,
    {
      ...verification,
      verifiedClaimCount: verification.verifiedInsight.keyEvidence.length + verification.verifiedInsight.keyRisks.length,
      rejectedClaimCount: verification.errors.length
    },
    counterfactuals,
    "llm_verified"
  );
}
