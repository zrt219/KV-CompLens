import type { RetrievedContext } from "../rag/retrieveReviewContext";
import type { VerificationResult, ZrtReviewInsight } from "./types";

const FORBIDDEN_PHRASES = [
  "guaranteed",
  "exact value",
  "official appraisal",
  "appraisal complete",
  "credit approved",
  "credit decision",
  "live mls",
  "replaces underwriter",
  "ai decided",
  "chain-of-thought",
  "agent reasoning trace",
  "900iq",
  "win hackathon"
];

export function verifyZrtReviewInsight(context: RetrievedContext, insight: ZrtReviewInsight): VerificationResult {
  const errors: string[] = [];
  const warnings: string[] = [];
  const factsById = new Map(context.facts.map((fact) => [fact.id, fact]));
  const comparableIds = new Set(context.facts
    .filter((fact) => fact.id.startsWith("comparable:") && fact.id.endsWith(":address"))
    .map((fact) => fact.id.split(":")[1]));
  const comparableAddresses = new Set(context.facts
    .filter((fact) => fact.id.startsWith("comparable:") && fact.id.endsWith(":address"))
    .map((fact) => String(fact.value)));
  const allowedCurrencyValues = new Set<number>(
    context.facts
      .filter((fact) => typeof fact.value === "number" && /(estimate|price|value|adjustment)/.test(fact.id))
      .map((fact) => Math.round(Math.abs(Number(fact.value))))
  );

  collectReferencedFactIds(insight).forEach((factId) => {
    if (!factsById.has(factId)) {
      errors.push(`Insight references missing fact ${factId}.`);
    }
  });

  if (insight.strongestComparable) {
    if (!comparableIds.has(insight.strongestComparable.comparableId)) {
      errors.push("Strongest comparable id is not present in the retrieved context.");
    }
    if (!comparableAddresses.has(insight.strongestComparable.address)) {
      errors.push("Strongest comparable address is not present in the retrieved context.");
    }
  }

  if (insight.weakestComparable) {
    if (!comparableIds.has(insight.weakestComparable.comparableId)) {
      errors.push("Weakest comparable id is not present in the retrieved context.");
    }
    if (!comparableAddresses.has(insight.weakestComparable.address)) {
      errors.push("Weakest comparable address is not present in the retrieved context.");
    }
  }

  collectTextBlocks(insight).forEach((block) => {
    FORBIDDEN_PHRASES.forEach((phrase) => {
      if (containsForbiddenPhrase(block, phrase)) {
        errors.push(`Forbidden phrase detected: ${phrase}.`);
      }
    });
  });

  extractCurrencyValues(collectTextBlocks(insight).join(" ")).forEach((value) => {
    if (!allowedCurrencyValues.has(value)) {
      errors.push(`Unrecognized currency value referenced: ${value}.`);
    }
  });

  extractAddressLikePhrases(collectTextBlocks(insight).join(" ")).forEach((value) => {
    if (!comparableAddresses.has(value)) {
      errors.push(`Unrecognized comparable address referenced: ${value}.`);
    }
  });

  const normalizedLimitations = insight.limitations.map((item) => item.toLowerCase());
  if (!normalizedLimitations.some((item) => item.includes("synthetic/public-style") || item.includes("synthetic/public-style demo"))) {
    errors.push("Limitations must mention synthetic/public-style data.");
  }
  if (!normalizedLimitations.some((item) => item.includes("not live mls"))) {
    errors.push("Limitations must mention not live MLS.");
  }
  if (!normalizedLimitations.some((item) => item.includes("not an appraisal") || item.includes("not appraisal"))) {
    errors.push("Limitations must mention not an appraisal.");
  }
  if (!normalizedLimitations.some((item) => item.includes("not a credit decision") || item.includes("not credit decision"))) {
    errors.push("Limitations must mention not a credit decision.");
  }
  if (!normalizedLimitations.some((item) => item.includes("analyst review required"))) {
    errors.push("Limitations must mention analyst review required.");
  }

  const confidenceScore = numericContextValue(context, "valuation:confidence_score");
  const valueSpreadPercent = numericContextValue(context, "valuation:value_spread_percent");
  const hasHighRisk = insight.keyRisks.some((risk) => risk.severity === "high");

  if (confidenceScore < 55 && insight.verdict === "usable_with_review") {
    errors.push("Low-confidence packets cannot be marked usable_with_review.");
  }
  if ((hasHighRisk || valueSpreadPercent > 30) && insight.verdict === "usable_with_review") {
    errors.push("High-risk packets cannot be marked usable_with_review.");
  }

  if (wordCount(insight.memoReadySummary) > 140) {
    errors.push("Memo summary exceeds 140 words.");
  }

  if (!insight.keyEvidence.every((item) => item.factIds.length > 0)) {
    errors.push("Every key evidence item must include at least one fact id.");
  }
  if (!insight.keyRisks.every((item) => item.factIds.length > 0 || item.risk.includes("No selected comparables"))) {
    errors.push("Every key risk item must include at least one fact id.");
  }

  if (!insight.analystQuestions.length) {
    warnings.push("No analyst questions were produced.");
  }

  return {
    ok: errors.length === 0,
    errors,
    warnings,
    verifiedInsight: errors.length === 0 ? insight : undefined
  };
}

function collectReferencedFactIds(insight: ZrtReviewInsight) {
  return Array.from(new Set([
    ...(insight.strongestComparable?.factIds ?? []),
    ...(insight.weakestComparable?.factIds ?? []),
    ...insight.confidenceRationale.factIds,
    ...insight.keyEvidence.flatMap((item) => item.factIds),
    ...insight.keyRisks.flatMap((item) => item.factIds)
  ]));
}

function collectTextBlocks(insight: ZrtReviewInsight) {
  return [
    insight.title,
    insight.summary,
    insight.strongestComparable?.reason,
    insight.weakestComparable?.reason,
    insight.confidenceRationale.label,
    insight.confidenceRationale.explanation,
    ...insight.keyEvidence.map((item) => item.point),
    ...insight.keyRisks.map((item) => item.risk),
    ...insight.analystQuestions,
    insight.nextAction,
    insight.memoReadySummary,
    ...insight.limitations
  ].filter((value): value is string => Boolean(value));
}

function extractCurrencyValues(text: string) {
  return Array.from(text.matchAll(/\$([\d,]+)/g)).map((match) => Number(match[1].replace(/,/g, "")));
}

function extractAddressLikePhrases(text: string) {
  const matches = Array.from(text.matchAll(/\b\d{2,}\s+[A-Za-z0-9 ]+(?:St|Street|Ave|Avenue|Drive|Dr|Road|Rd|Boulevard|Blvd|Lane|Ln|Court|Ct|Place|Pl|Way)\b(?:\s+(?:NW|NE|SW|SE))?/g));
  return Array.from(new Set(matches.map((match) => match[0].trim())));
}

function containsForbiddenPhrase(text: string, phrase: string) {
  const normalized = text.toLowerCase();
  if (!normalized.includes(phrase)) {
    return false;
  }
  if (phrase === "live mls" && normalized.includes("not live mls")) {
    return false;
  }
  if (
    phrase === "credit decision"
    && (normalized.includes("not a credit decision") || normalized.includes("not credit decision"))
  ) {
    return false;
  }
  if (
    phrase === "appraisal"
    && (normalized.includes("not an appraisal") || normalized.includes("not appraisal"))
  ) {
    return false;
  }
  return true;
}

function numericContextValue(context: RetrievedContext, factId: string) {
  const fact = context.facts.find((item) => item.id === factId);
  return typeof fact?.value === "number" ? fact.value : 0;
}

function wordCount(value: string) {
  return value.trim().split(/\s+/).filter(Boolean).length;
}
