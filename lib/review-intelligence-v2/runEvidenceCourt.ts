import type { PceAnalysisSnapshot } from "../pce/runPcePipeline";
import { retrieveReviewContext } from "../rag/retrieveReviewContext";
import type { ZrtReviewInsight } from "../review-intelligence/types";
import { generateDeterministicZrtReviewInsight } from "../review-intelligence/generateZrtReviewInsight";
import { verifyZrtReviewInsight } from "../review-intelligence/verifyZrtReviewInsight";
import { buildEvidenceCourtPacket } from "./buildEvidenceCourtPacket";
import { runCounterfactualAnalyst } from "./counterfactualAnalyst";
import type {
  CounterfactualCheck,
  EvidenceClaim,
  EvidenceCourtPacket,
  EvidenceCourtResult,
  EvidenceCourtVerification
} from "./types";

export function runEvidenceCourt(snapshot: PceAnalysisSnapshot): EvidenceCourtResult {
  const packet = buildEvidenceCourtPacket(snapshot);
  const context = retrieveReviewContext(packet, "review_set_summary", { page: "review" });
  const insight = generateDeterministicZrtReviewInsight(context);
  const verification = toEvidenceCourtVerification(verifyZrtReviewInsight(context, insight), buildClaims(insight));
  const counterfactuals = runCounterfactualAnalyst(packet, snapshot);
  return toEvidenceCourtResult(context, insight, verification, counterfactuals, "deterministic");
}

export function buildEvidenceCourtResultFromPacket(
  packet: EvidenceCourtPacket,
  counterfactuals: CounterfactualCheck[],
  source: EvidenceCourtResult["source"] = "deterministic"
) {
  const context = retrieveReviewContext(packet, "review_set_summary", { page: "review" });
  const insight = generateDeterministicZrtReviewInsight(context);
  const verification = toEvidenceCourtVerification(verifyZrtReviewInsight(context, insight), buildClaims(insight));
  return buildEvidenceCourtResultFromInsight(context, insight, verification, counterfactuals, source);
}

export function buildEvidenceCourtResultFromInsight(
  context: EvidenceCourtResult["context"],
  insight: ZrtReviewInsight,
  verification: EvidenceCourtVerification,
  counterfactuals: CounterfactualCheck[],
  source: EvidenceCourtResult["source"]
) {
  return toEvidenceCourtResult(context, insight, verification, counterfactuals, source);
}

function toEvidenceCourtResult(
  context: EvidenceCourtResult["context"],
  insight: ZrtReviewInsight,
  verification: EvidenceCourtVerification,
  counterfactuals: CounterfactualCheck[],
  source: EvidenceCourtResult["source"]
): EvidenceCourtResult {
  const claims = buildClaims(insight);
  const strongestClaims = claims.filter((claim) => claim.claimType === "supporting");
  const riskClaims = claims.filter((claim) => claim.claimType === "risk");

  return {
    title: insight.title,
    verdict: {
      code: insight.verdict,
      label: verdictLabel(insight.verdict),
      summary: insight.summary
    },
    strongestComparable: insight.strongestComparable ? {
      comparableId: insight.strongestComparable.comparableId,
      address: insight.strongestComparable.address,
      reason: insight.strongestComparable.reason,
      supportingClaimIds: strongestClaims
        .filter((claim) => claim.supportFactIds.some((factId) => insight.strongestComparable?.factIds.includes(factId)))
        .map((claim) => claim.id)
    } : undefined,
    weakestSelectedComparable: insight.weakestComparable ? {
      comparableId: insight.weakestComparable.comparableId,
      address: insight.weakestComparable.address,
      reason: insight.weakestComparable.reason,
      riskClaimIds: riskClaims
        .filter((claim) => claim.supportFactIds.some((factId) => insight.weakestComparable?.factIds.includes(factId)))
        .map((claim) => claim.id)
    } : undefined,
    signalAnalyst: {
      summary: insight.confidenceRationale.explanation,
      strongestEvidence: strongestClaims
    },
    skepticAnalyst: {
      summary: insight.keyRisks.length
        ? `${insight.keyRisks.length} review risks remain in the packet and should be checked before export.`
        : "No major review risks were raised beyond the standing limitations.",
      concerns: riskClaims
    },
    counterfactuals,
    analystQuestions: insight.analystQuestions,
    nextAction: insight.nextAction,
    memoReadySummary: insight.memoReadySummary,
    limitations: insight.limitations,
    verification,
    source,
    context,
    insight
  };
}

function buildClaims(insight: ZrtReviewInsight): EvidenceClaim[] {
  return [
    ...insight.keyEvidence.map((item, index) => ({
      id: `evidence:${index}`,
      claim: item.point,
      claimType: "supporting" as const,
      supportFactIds: item.factIds,
      verified: true
    })),
    ...insight.keyRisks.map((item, index) => ({
      id: `risk:${index}`,
      claim: item.risk,
      claimType: "risk" as const,
      supportFactIds: item.factIds,
      severity: item.severity,
      verified: true
    })),
    ...insight.limitations.map((item, index) => ({
      id: `limitation:${index}`,
      claim: item,
      claimType: "limitation" as const,
      supportFactIds: [],
      verified: true
    })),
    {
      id: "next-action",
      claim: insight.nextAction,
      claimType: "next_action",
      supportFactIds: insight.confidenceRationale.factIds,
      verified: true
    },
    {
      id: "memo-summary",
      claim: insight.memoReadySummary,
      claimType: "memo",
      supportFactIds: compactFactIds([
        ...(insight.strongestComparable?.factIds ?? []),
        ...(insight.weakestComparable?.factIds ?? []),
        ...insight.confidenceRationale.factIds
      ]),
      verified: true
    }
  ];
}

function toEvidenceCourtVerification(
  verification: ReturnType<typeof verifyZrtReviewInsight>,
  claims: EvidenceClaim[]
): EvidenceCourtVerification {
  const verifiedClaimCount = claims.filter((claim) => claim.verified).length;
  return {
    ...verification,
    verifiedClaimCount,
    rejectedClaimCount: claims.length - verifiedClaimCount + verification.errors.length
  };
}

function verdictLabel(verdict: ZrtReviewInsight["verdict"]) {
  if (verdict === "usable_with_review") {
    return "Review set is usable";
  }
  if (verdict === "weak_packet") {
    return "Review set is weak";
  }
  return "Review set needs analyst review";
}

function compactFactIds(values: string[]) {
  return Array.from(new Set(values.filter(Boolean)));
}
