import type { RetrievedContext } from "../rag/retrieveReviewContext";

export type ReviewInsightSource = "deterministic" | "llm_verified";

export type ZrtReviewInsight = {
  title: string;
  verdict: "usable_with_review" | "needs_review" | "weak_packet";
  summary: string;
  strongestComparable?: {
    comparableId: string;
    address: string;
    reason: string;
    factIds: string[];
  };
  weakestComparable?: {
    comparableId: string;
    address: string;
    reason: string;
    factIds: string[];
  };
  confidenceRationale: {
    label: string;
    explanation: string;
    factIds: string[];
  };
  keyEvidence: Array<{
    point: string;
    factIds: string[];
  }>;
  keyRisks: Array<{
    risk: string;
    severity: "low" | "medium" | "high";
    factIds: string[];
  }>;
  analystQuestions: string[];
  nextAction: string;
  memoReadySummary: string;
  limitations: string[];
};

export type VerificationResult = {
  ok: boolean;
  errors: string[];
  warnings: string[];
  verifiedInsight?: ZrtReviewInsight;
};

export type ReviewIntelligenceAttachment = {
  attachedAt: string;
  context: RetrievedContext;
  insight: ZrtReviewInsight;
  source: ReviewInsightSource;
  verification: VerificationResult;
};
