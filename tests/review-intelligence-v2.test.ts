import { describe, expect, it } from "vitest"
import { createInitialPceState, pceAnalysisReducer } from "../hooks/usePceAnalysis"
import { syntheticComparables } from "../lib/mockData"
import { buildExportArtifact } from "../lib/pce/exportPackage"
import { runPcePipeline } from "../lib/pce/runPcePipeline"
import { buildEvidenceCourtPacket } from "../lib/review-intelligence-v2/buildEvidenceCourtPacket"
import { runCounterfactualAnalyst } from "../lib/review-intelligence-v2/counterfactualAnalyst"
import { generateLLMEvidenceCourt } from "../lib/review-intelligence-v2/generateLLMEvidenceCourt"
import { runEvidenceCourt } from "../lib/review-intelligence-v2/runEvidenceCourt"
import { verifyEvidenceCourtResult } from "../lib/review-intelligence-v2/verifyEvidenceCourtResult"
import { selectExportViewModel, selectMemoViewModel } from "../lib/selectors/pceSelectors"
import type { SubjectProperty } from "../lib/types"

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
}

const snapshot = runPcePipeline({
  subject,
  candidates: syntheticComparables,
  generatedAt: "2026-06-01T00:00:00.000Z"
})

describe("review intelligence v2", () => {
  it("builds a packet with traceable facts and source paths", () => {
    const packet = buildEvidenceCourtPacket(snapshot)

    expect(packet.facts.length).toBeGreaterThan(20)
    expect(packet.facts.every((fact) => fact.sourcePath.startsWith("snapshot."))).toBe(true)
    expect(packet.facts.some((fact) => fact.id === "subject:address")).toBe(true)
  })

  it("selects the strongest and weakest comparables deterministically", () => {
    const result = runEvidenceCourt(snapshot)
    const packet = buildEvidenceCourtPacket(snapshot)
    const strongest = [...packet.selectedComparables].sort((left, right) =>
      right.evidenceWeight - left.evidenceWeight
      || right.comparableProbability - left.comparableProbability
      || right.matchScore - left.matchScore
      || left.id.localeCompare(right.id)
    )[0]
    const weakest = [...packet.selectedComparables].sort((left, right) =>
      left.evidenceWeight - right.evidenceWeight
      || left.comparableProbability - right.comparableProbability
      || right.distanceKm - left.distanceKm
      || left.id.localeCompare(right.id)
    )[0]

    expect(result.strongestComparable.comparableId).toBe(strongest.id)
    expect(result.weakestSelectedComparable.comparableId).toBe(weakest.id)
  })

  it("returns one counterfactual check per selected comparable", () => {
    const packet = buildEvidenceCourtPacket(snapshot)
    const counterfactuals = runCounterfactualAnalyst(packet, snapshot)

    expect(counterfactuals).toHaveLength(snapshot.selectedComparables.length)
    expect(counterfactuals.every((check) => check.comparableId)).toBe(true)
  })

  it("grounds every claim in packet facts", () => {
    const packet = buildEvidenceCourtPacket(snapshot)
    const result = runEvidenceCourt(snapshot)
    const factIds = new Set(packet.facts.map((fact) => fact.id))
    const claims = [...result.signalAnalyst.strongestEvidence, ...result.skepticAnalyst.concerns]

    expect(claims.every((claim) => claim.supportFactIds.length > 0)).toBe(true)
    expect(claims.every((claim) => claim.supportFactIds.every((factId) => factIds.has(factId)))).toBe(true)
  })

  it("rejects unknown addresses and fake currency references", () => {
    const packet = buildEvidenceCourtPacket(snapshot)
    const result = runEvidenceCourt(snapshot)
    const tampered = {
      ...result,
      strongestComparable: {
        ...result.strongestComparable,
        address: "999 Unknown Ave"
      },
      memoReadySummary: `${result.memoReadySummary} Additional unsupported number: $999,999,999.`
    }
    const verification = verifyEvidenceCourtResult(packet, tampered)

    expect(verification.ok).toBe(false)
    expect(verification.errors.some((error) => error.includes("address"))).toBe(true)
    expect(verification.errors.some((error) => error.includes("currency"))).toBe(true)
  })

  it("rejects live MLS, appraisal, credit decision, and chain-of-thought language", () => {
    const packet = buildEvidenceCourtPacket(snapshot)
    const result = runEvidenceCourt(snapshot)
    const variants = [
      "This is live MLS data.",
      "This is an official appraisal.",
      "This is a credit decision.",
      "Here is the chain-of-thought."
    ]

    variants.forEach((phrase) => {
      const verification = verifyEvidenceCourtResult(packet, {
        ...result,
        memoReadySummary: phrase
      })
      expect(verification.ok).toBe(false)
    })
  })

  it("keeps the memo summary under 140 words", () => {
    const result = runEvidenceCourt(snapshot)
    const wordCount = result.memoReadySummary.trim().split(/\s+/).filter(Boolean).length

    expect(wordCount).toBeLessThanOrEqual(140)
  })

  it("falls back deterministically when no API key is configured", async () => {
    const original = process.env.OPENAI_API_KEY
    delete process.env.OPENAI_API_KEY
    const packet = buildEvidenceCourtPacket(snapshot)
    const result = runEvidenceCourt(snapshot)
    const next = await generateLLMEvidenceCourt(packet, result.counterfactuals, result)

    expect(next).toEqual(result)
    if (original === undefined) {
      delete process.env.OPENAI_API_KEY
    } else {
      process.env.OPENAI_API_KEY = original
    }
  })

  it("stores the memo attachment in reducer state", () => {
    const state = createInitialPceState(subject, syntheticComparables, "2026-06-01T00:00:00.000Z")
    const attached = pceAnalysisReducer(state, {
      type: "ATTACH_REVIEW_INTELLIGENCE",
      generatedAt: "2026-06-01T05:00:00.000Z"
    })
    const memo = selectMemoViewModel(attached)
    const exportView = selectExportViewModel(attached)

    expect(memo.reviewIntelligenceAttached).toBe(true)
    expect(exportView.reviewIntelligenceAttached).toBe(true)
    expect(memo.auditEvents.some((event) => event.type === "review_intelligence_v2_added_to_memo")).toBe(true)
  })

  it("includes review intelligence in exports without exposing agent reasoning trace", () => {
    const state = createInitialPceState(subject, syntheticComparables, "2026-06-01T00:00:00.000Z")
    const attached = pceAnalysisReducer(state, {
      type: "ATTACH_REVIEW_INTELLIGENCE",
      generatedAt: "2026-06-01T06:00:00.000Z"
    })
    const artifact = buildExportArtifact("snapshot-md", subject, attached.snapshot, {
      includeReviewIntelligence: true,
      auditEvents: [...attached.snapshot.auditEvents, ...attached.uiAuditEvents]
    })
    const content = artifact.content as string

    expect(content).toContain("Review Intelligence Summary")
    expect(content).toContain("Claim Ledger Appendix")
    expect(content).not.toContain("Agent Reasoning Trace")
  })
})
