import type { ReviewEvidencePack } from "../rag/buildReviewEvidencePack";
import type { RetrievedContext } from "../rag/retrieveReviewContext";
import type { RagFact } from "../rag/sourceRegistry";
import type { ReviewInsightSource, VerificationResult, ZrtReviewInsight } from "../review-intelligence/types";

export type EvidenceFact = RagFact;

export type EvidenceClaim = {
  id: string;
  claim: string;
  claimType: "supporting" | "risk" | "limitation" | "next_action" | "memo";
  supportFactIds: string[];
  severity?: "low" | "medium" | "high";
  verified: boolean;
};

export type EvidenceCourtPacket = ReviewEvidencePack;

export type CounterfactualCheck = {
  id: string;
  label: string;
  comparableId?: string;
  beforeMidpoint: number;
  afterMidpoint: number;
  deltaMidpoint: number;
  beforeConfidence: number;
  afterConfidence: number;
  deltaConfidence: number;
  rangeImpact: number;
  interpretation: string;
};

export type EvidenceCourtVerification = VerificationResult & {
  verifiedClaimCount: number;
  rejectedClaimCount: number;
};

export type EvidenceCourtResult = {
  title: string;
  verdict: {
    code: ZrtReviewInsight["verdict"];
    label: "Review set is usable" | "Review set needs analyst review" | "Review set is weak";
    summary: string;
  };
  strongestComparable?: {
    comparableId: string;
    address: string;
    reason: string;
    supportingClaimIds: string[];
  };
  weakestSelectedComparable?: {
    comparableId: string;
    address: string;
    reason: string;
    riskClaimIds: string[];
  };
  signalAnalyst: {
    summary: string;
    strongestEvidence: EvidenceClaim[];
  };
  skepticAnalyst: {
    summary: string;
    concerns: EvidenceClaim[];
  };
  counterfactuals: CounterfactualCheck[];
  analystQuestions: string[];
  nextAction: string;
  memoReadySummary: string;
  limitations: string[];
  verification: EvidenceCourtVerification;
  source: ReviewInsightSource;
  context: RetrievedContext;
  insight: ZrtReviewInsight;
};
