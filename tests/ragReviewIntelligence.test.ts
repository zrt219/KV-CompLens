import { describe, expect, it } from "vitest";
import { syntheticComparables } from "../lib/mockData";
import { runPcePipeline } from "../lib/pce/runPcePipeline";
import { buildReviewEvidencePack } from "../lib/rag/buildReviewEvidencePack";
import { retrieveReviewContext } from "../lib/rag/retrieveReviewContext";
import { generateDeterministicZrtReviewInsight } from "../lib/review-intelligence/generateZrtReviewInsight";
import { verifyZrtReviewInsight } from "../lib/review-intelligence/verifyZrtReviewInsight";
import type { SubjectProperty } from "../lib/types";

const subject: SubjectProperty = {
  id: "SUBJ-RAG-001",
  address: "12345 109 St NW",
  city: "Edmonton",
  province: "AB",
  postalCode: "T5G 0A0",
  neighbourhood: "Central McDougall",
  propertyType: "Detached",
  yearBuilt: 2014,
  bedrooms: 4,
  bathrooms: 3,
  livingAreaSqft: 2180,
  lotSizeSqft: 5800,
  parking: 2,
  latitude: 53.5828,
  longitude: -113.5082,
  condition: "Good",
  targetPriceHint: 690000,
  underwritingDate: "2026-05-31"
};

const snapshot = runPcePipeline({
  subject,
  candidates: syntheticComparables,
  generatedAt: "2026-06-01T00:00:00.000Z"
});

describe("rag review intelligence", () => {
  it("returns subject and valuation facts", () => {
    const pack = buildReviewEvidencePack(snapshot);

    expect(pack.subjectFacts.some((fact) => fact.id === "subject:address")).toBe(true);
    expect(pack.valuationFacts.some((fact) => fact.id === "valuation:midpoint_estimate")).toBe(true);
  });

  it("includes required limitations on every pack", () => {
    const pack = buildReviewEvidencePack(snapshot);
    const limitations = pack.limitationFacts.map((fact) => String(fact.value));

    expect(limitations.some((item) => item.includes("Synthetic/public-style"))).toBe(true);
    expect(limitations.some((item) => item.includes("Not live MLS"))).toBe(true);
    expect(limitations.some((item) => item.includes("Not an appraisal"))).toBe(true);
    expect(limitations.some((item) => item.includes("Not a credit decision"))).toBe(true);
    expect(limitations.some((item) => item.includes("Analyst review required"))).toBe(true);
  });

  it("retrieves a smaller, intent-specific context", () => {
    const pack = buildReviewEvidencePack(snapshot);
    const fullFactCount = pack.facts.length;
    const context = retrieveReviewContext(pack, "confidence_rationale");

    expect(context.facts.length).toBeLessThan(fullFactCount);
    expect(context.facts.some((fact) => fact.id === "valuation:confidence_score")).toBe(true);
  });

  it("generates a deterministic verdict and memo summary", () => {
    const pack = buildReviewEvidencePack(snapshot);
    const context = retrieveReviewContext(pack, "review_set_summary");
    const insight = generateDeterministicZrtReviewInsight(context);

    expect(["usable_with_review", "needs_review", "weak_packet"]).toContain(insight.verdict);
    expect(insight.memoReadySummary.length).toBeGreaterThan(20);
    expect(insight.keyEvidence.length).toBeGreaterThan(0);
  });

  it("selects the strongest comparable by evidence weight first", () => {
    const pack = buildReviewEvidencePack(snapshot);
    const context = retrieveReviewContext(pack, "review_set_summary");
    const insight = generateDeterministicZrtReviewInsight(context);
    const expected = [...pack.selectedComparables].sort((left, right) =>
      right.evidenceWeight - left.evidenceWeight
      || right.comparableProbability - left.comparableProbability
      || right.matchScore - left.matchScore
      || left.id.localeCompare(right.id)
    )[0];

    expect(insight.strongestComparable?.comparableId).toBe(expected.id);
  });

  it("verifies a deterministic insight successfully", () => {
    const pack = buildReviewEvidencePack(snapshot);
    const context = retrieveReviewContext(pack, "review_set_summary");
    const insight = generateDeterministicZrtReviewInsight(context);
    const verification = verifyZrtReviewInsight(context, insight);

    expect(verification.ok).toBe(true);
    expect(verification.verifiedInsight?.memoReadySummary).toBe(insight.memoReadySummary);
  });

  it("builds safely for empty states", () => {
    const emptySnapshot = runPcePipeline({
      subject: {
        ...subject,
        address: "",
        neighbourhood: "",
        bedrooms: 0,
        bathrooms: 0,
        livingAreaSqft: 0,
        latitude: 0,
        longitude: 0
      },
      candidates: syntheticComparables,
      generatedAt: "2026-06-01T00:00:00.000Z"
    });
    const pack = buildReviewEvidencePack(emptySnapshot);

    expect(pack.limitationFacts.length).toBeGreaterThanOrEqual(5);
    expect(pack.facts.length).toBeGreaterThan(pack.limitationFacts.length);
  });
});
