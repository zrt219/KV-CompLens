import { describe, expect, it } from "vitest";
import { createInitialPceState, pceAnalysisReducer } from "../hooks/usePceAnalysis";
import { syntheticComparables } from "../lib/mockData";
import { buildExportArtifact } from "../lib/pce/exportPackage";
import { runPcePipeline } from "../lib/pce/runPcePipeline";
import { buildReviewEvidencePack } from "../lib/rag/buildReviewEvidencePack";
import { retrieveReviewContext } from "../lib/rag/retrieveReviewContext";
import { generateLlmZrtReviewInsight } from "../lib/review-intelligence/generateLlmZrtReviewInsight";
import { verifyZrtReviewInsight } from "../lib/review-intelligence/verifyZrtReviewInsight";
import { runCounterfactualAnalyst } from "../lib/review-intelligence-v2/counterfactualAnalyst";
import { generateLLMEvidenceCourt } from "../lib/review-intelligence-v2/generateLLMEvidenceCourt";
import { runEvidenceCourt } from "../lib/review-intelligence-v2/runEvidenceCourt";
import { selectExportViewModel, selectMemoViewModel } from "../lib/selectors/pceSelectors";
import type { SubjectProperty } from "../lib/types";

const subject: SubjectProperty = {
  id: "SUBJ-RI-001",
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

describe("review intelligence v2", () => {
  it("builds a packet with traceable facts and source paths", () => {
    const packet = buildReviewEvidencePack(snapshot);

    expect(packet.facts.length).toBeGreaterThan(30);
    expect(packet.facts.every((fact) => fact.sourcePath.includes("snapshot") || fact.sourcePath.startsWith("static."))).toBe(true);
    expect(packet.facts.some((fact) => fact.id === "subject:address")).toBe(true);
  });

  it("retrieves focused context for review set and why-this-comparable flows", () => {
    const packet = buildReviewEvidencePack(snapshot);
    const reviewContext = retrieveReviewContext(packet, "review_set_summary");
    const whyContext = retrieveReviewContext(packet, "why_this_comparable", {
      focusComparableId: snapshot.valuation.adjustedComparables[0].id
    });

    expect(reviewContext.facts.some((fact) => fact.id === "valuation:midpoint_estimate")).toBe(true);
    expect(whyContext.facts.some((fact) => fact.id.includes(":reason_"))).toBe(true);
    expect(whyContext.facts.some((fact) => fact.id.includes(":total_adjustment"))).toBe(true);
  });

  it("selects the strongest and weakest comparables deterministically", () => {
    const result = runEvidenceCourt(snapshot);
    const packet = buildReviewEvidencePack(snapshot);
    const strongest = [...packet.selectedComparables].sort((left, right) =>
      right.evidenceWeight - left.evidenceWeight
      || right.comparableProbability - left.comparableProbability
      || right.matchScore - left.matchScore
      || left.id.localeCompare(right.id)
    )[0];
    const weakest = [...packet.selectedComparables].sort((left, right) =>
      left.evidenceWeight - right.evidenceWeight
      || left.topCautions.length - right.topCautions.length
      || left.comparableProbability - right.comparableProbability
      || left.id.localeCompare(right.id)
    )[0];

    expect(result.strongestComparable?.comparableId).toBe(strongest.id);
    expect(result.weakestSelectedComparable?.comparableId).toBe(weakest.id);
  });

  it("returns one counterfactual check per selected comparable", () => {
    const packet = buildReviewEvidencePack(snapshot);
    const counterfactuals = runCounterfactualAnalyst(packet, snapshot);

    expect(counterfactuals).toHaveLength(snapshot.selectedComparables.length);
    expect(counterfactuals.every((check) => check.comparableId)).toBe(true);
  });

  it("grounds every key evidence and risk item in fact ids", () => {
    const result = runEvidenceCourt(snapshot);

    expect(result.insight.keyEvidence.every((item) => item.factIds.length > 0)).toBe(true);
    expect(result.insight.keyRisks.every((item) => item.factIds.length > 0)).toBe(true);
  });

  it("rejects unknown fact ids, addresses, and fake currency references", () => {
    const result = runEvidenceCourt(snapshot);
    const tampered = {
      ...result.insight,
      strongestComparable: {
        comparableId: "COMP-UNKNOWN",
        address: "999 Unknown Ave",
        reason: "Unsupported comp",
        factIds: ["missing:fact"]
      },
      memoReadySummary: `${result.insight.memoReadySummary} Unsupported number: $999,999,999.`
    };
    const verification = verifyZrtReviewInsight(result.context, tampered);

    expect(verification.ok).toBe(false);
    expect(verification.errors.some((error) => error.includes("missing fact"))).toBe(true);
    expect(verification.errors.some((error) => error.includes("address"))).toBe(true);
    expect(verification.errors.some((error) => error.includes("currency"))).toBe(true);
  });

  it("rejects live MLS, appraisal, credit decision, and chain-of-thought language", () => {
    const result = runEvidenceCourt(snapshot);
    const variants = [
      "This is live MLS data.",
      "This is an official appraisal.",
      "This is a credit decision.",
      "Here is the chain-of-thought."
    ];

    variants.forEach((phrase) => {
      const verification = verifyZrtReviewInsight(result.context, {
        ...result.insight,
        memoReadySummary: phrase
      });
      expect(verification.ok).toBe(false);
    });
  });

  it("falls back deterministically when no API key is configured", async () => {
    const original = process.env.OPENAI_API_KEY;
    delete process.env.OPENAI_API_KEY;
    const packet = buildReviewEvidencePack(snapshot);
    const context = retrieveReviewContext(packet, "review_set_summary");
    const deterministic = runEvidenceCourt(snapshot);
    const llmInsight = await generateLlmZrtReviewInsight(context);
    const llmResult = await generateLLMEvidenceCourt(packet, deterministic.counterfactuals, deterministic);

    expect(llmInsight.source).toBe("deterministic");
    expect(llmResult.memoReadySummary).toBe(deterministic.memoReadySummary);
    if (original === undefined) {
      delete process.env.OPENAI_API_KEY;
    } else {
      process.env.OPENAI_API_KEY = original;
    }
  });

  it("stores the verified attachment in reducer state", () => {
    const state = createInitialPceState(subject, syntheticComparables, "2026-06-01T00:00:00.000Z");
    const result = runEvidenceCourt(state.snapshot);
    const attached = pceAnalysisReducer(state, {
      type: "ATTACH_REVIEW_INTELLIGENCE",
      attachment: {
        attachedAt: "2026-06-01T05:00:00.000Z",
        context: result.context,
        insight: result.insight,
        source: result.source,
        verification: result.verification
      }
    });
    const memo = selectMemoViewModel(attached);
    const exportView = selectExportViewModel(attached);

    expect(attached.reviewIntelligenceAttachment?.insight.memoReadySummary).toBe(result.memoReadySummary);
    expect(memo.reviewIntelligenceAttached).toBe(true);
    expect(exportView.reviewIntelligenceAttached).toBe(true);
    expect(memo.auditEvents.some((event) => event.type === "review_intelligence_v2_added_to_memo")).toBe(true);
  });

  it("includes review intelligence in exports without exposing agent reasoning trace", () => {
    const state = createInitialPceState(subject, syntheticComparables, "2026-06-01T00:00:00.000Z");
    const result = runEvidenceCourt(state.snapshot);
    const attached = pceAnalysisReducer(state, {
      type: "ATTACH_REVIEW_INTELLIGENCE",
      attachment: {
        attachedAt: "2026-06-01T06:00:00.000Z",
        context: result.context,
        insight: result.insight,
        source: result.source,
        verification: result.verification
      }
    });
    const artifact = buildExportArtifact("snapshot-md", subject, attached.snapshot, {
      includeReviewIntelligence: true,
      reviewIntelligenceAttachment: attached.reviewIntelligenceAttachment,
      auditEvents: [...attached.snapshot.auditEvents, ...attached.uiAuditEvents]
    });
    const content = artifact.content as string;

    expect(content).toContain("Review Intelligence V2");
    expect(content).not.toContain("Agent Reasoning Trace");
    expect(content).not.toContain("chain-of-thought");
  });
});
