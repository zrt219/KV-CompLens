import { formatCurrency } from "../format"
import type { PceAnalysisSnapshot } from "../pce/runPcePipeline"
import { buildEvidenceCourtPacket } from "./buildEvidenceCourtPacket"
import { runCounterfactualAnalyst } from "./counterfactualAnalyst"
import { runSignalAnalyst } from "./signalAnalyst"
import { runSkepticAnalyst } from "./skepticAnalyst"
import type { CounterfactualCheck, EvidenceClaim, EvidenceCourtPacket, EvidenceCourtResult } from "./types"
import { verifyEvidenceCourtResult } from "./verifyEvidenceCourtResult"

const BASE_LIMITATIONS = [
  "Synthetic/public-style demonstration data. Not live MLS. Analyst review required.",
  "This output is a review artifact, not an appraisal.",
  "This output is not a credit decision.",
  "Review Intelligence V2 explains deterministic PCE-V2 outputs and does not determine value.",
  "Counterfactual checks describe local review sensitivity for the current packet."
]

export function runEvidenceCourt(snapshot: PceAnalysisSnapshot): EvidenceCourtResult {
  const packet = buildEvidenceCourtPacket(snapshot)
  const signalClaims = runSignalAnalyst(packet)
  const skepticClaims = runSkepticAnalyst(packet)
  const counterfactuals = runCounterfactualAnalyst(packet, snapshot)
  const strongest = selectStrongestComparable(packet)
  const weakest = selectWeakestComparable(packet)
  const analystQuestions = generateAnalystQuestions(packet, signalClaims, skepticClaims, counterfactuals, weakest?.address)
  const memoReadySummary = generateMemoReadySummary(packet, signalClaims, skepticClaims, counterfactuals, strongest?.address, weakest?.address)

  const result: EvidenceCourtResult = {
    verdict: buildVerdict(packet, skepticClaims),
    strongestComparable: {
      comparableId: strongest?.id ?? "unavailable",
      address: strongest?.address ?? "Unavailable",
      reason: strongest
        ? `${strongest.address} combines the highest evidence weight with strong comparable probability and match score in the current review set.`
        : "No selected comparable is available.",
      supportingClaimIds: signalClaims.filter((claim) => claim.claimType === "supporting").map((claim) => claim.id)
    },
    weakestSelectedComparable: {
      comparableId: weakest?.id ?? "unavailable",
      address: weakest?.address ?? "Unavailable",
      reason: weakest
        ? `${weakest.address} is the weakest selected comparable because its support is thinner than the rest of the packet.`
        : "No selected comparable is available.",
      riskClaimIds: skepticClaims.filter((claim) => claim.claim.includes(weakest?.address ?? "")).map((claim) => claim.id)
    },
    signalAnalyst: {
      summary: summarizeSignalAnalyst(packet, signalClaims, strongest?.address),
      strongestEvidence: signalClaims
    },
    skepticAnalyst: {
      summary: summarizeSkepticAnalyst(packet, skepticClaims, weakest?.address),
      concerns: skepticClaims
    },
    counterfactuals,
    analystQuestions,
    memoReadySummary,
    limitations: buildLimitations(packet),
    verification: {
      ok: true,
      errors: [],
      warnings: [],
      verifiedClaimCount: 0,
      rejectedClaimCount: 0
    }
  }

  const verification = verifyEvidenceCourtResult(packet, result)
  return {
    ...result,
    verification
  }
}

export function buildEvidenceCourtResultFromPacket(packet: EvidenceCourtPacket, counterfactuals: CounterfactualCheck[]): EvidenceCourtResult {
  const signalClaims = runSignalAnalyst(packet)
  const skepticClaims = runSkepticAnalyst(packet)
  const strongest = selectStrongestComparable(packet)
  const weakest = selectWeakestComparable(packet)
  const result: EvidenceCourtResult = {
    verdict: buildVerdict(packet, skepticClaims),
    strongestComparable: {
      comparableId: strongest?.id ?? "unavailable",
      address: strongest?.address ?? "Unavailable",
      reason: strongest
        ? `${strongest.address} combines the highest evidence weight with strong comparable probability and match score in the current review set.`
        : "No selected comparable is available.",
      supportingClaimIds: signalClaims.filter((claim) => claim.claimType === "supporting").map((claim) => claim.id)
    },
    weakestSelectedComparable: {
      comparableId: weakest?.id ?? "unavailable",
      address: weakest?.address ?? "Unavailable",
      reason: weakest
        ? `${weakest.address} is the weakest selected comparable because its support is thinner than the rest of the packet.`
        : "No selected comparable is available.",
      riskClaimIds: skepticClaims.filter((claim) => claim.claim.includes(weakest?.address ?? "")).map((claim) => claim.id)
    },
    signalAnalyst: {
      summary: summarizeSignalAnalyst(packet, signalClaims, strongest?.address),
      strongestEvidence: signalClaims
    },
    skepticAnalyst: {
      summary: summarizeSkepticAnalyst(packet, skepticClaims, weakest?.address),
      concerns: skepticClaims
    },
    counterfactuals,
    analystQuestions: generateAnalystQuestions(packet, signalClaims, skepticClaims, counterfactuals, weakest?.address),
    memoReadySummary: generateMemoReadySummary(packet, signalClaims, skepticClaims, counterfactuals, strongest?.address, weakest?.address),
    limitations: buildLimitations(packet),
    verification: {
      ok: true,
      errors: [],
      warnings: [],
      verifiedClaimCount: 0,
      rejectedClaimCount: 0
    }
  }
  return {
    ...result,
    verification: verifyEvidenceCourtResult(packet, result)
  }
}

function buildVerdict(packet: EvidenceCourtPacket, skepticClaims: EvidenceClaim[]) {
  const highSeverityConcerns = skepticClaims.filter((claim) => claim.severity === "high").length

  if (
    packet.valuation.confidenceScore >= 70
    && (packet.valuation.valueSpreadPercent ?? 0) <= 20
    && packet.selectedComparables.length >= 4
    && highSeverityConcerns === 0
  ) {
    return {
      label: "Review set is usable" as const,
      summary: `The review set is usable for analyst discussion because confidence is ${Math.round(packet.valuation.confidenceScore)}%, the spread is controlled, and no major grounding issues were detected. Analyst review still remains required.`
    }
  }

  if (
    packet.valuation.confidenceScore < 55
    || packet.selectedComparables.length < 3
    || (packet.valuation.valueSpreadPercent ?? 0) > 30
    || highSeverityConcerns >= 2
  ) {
    return {
      label: "Review set is weak" as const,
      summary: `The review set is weak because confidence is ${Math.round(packet.valuation.confidenceScore)}%, the packet carries material review concerns, and analyst review is required before export.`
    }
  }

  return {
    label: "Review set needs analyst review" as const,
    summary: `The review set needs analyst review because confidence, spread, or comparable quality still leaves open questions that should be resolved before export.`
  }
}

function summarizeSignalAnalyst(packet: EvidenceCourtPacket, signalClaims: EvidenceClaim[], strongestAddress?: string) {
  const strongestSupport = signalClaims.find((claim) => claim.id === "signal:strongest-comparable")?.claim
  return strongestAddress
    ? `${strongestSupport ?? `${strongestAddress} is the strongest support.`} The current packet uses ${packet.sourceScan.selectedCount} selected comparables to support a midpoint of ${formatCurrency(packet.valuation.midpointEstimate)}.`
    : "No signal summary is available."
}

function summarizeSkepticAnalyst(packet: EvidenceCourtPacket, skepticClaims: EvidenceClaim[], weakestAddress?: string) {
  const majorConcerns = skepticClaims.filter((claim) => claim.severity === "high").length
  if (!skepticClaims.length) {
    return "No skeptic concerns were generated, but analyst review is still required."
  }
  return weakestAddress
    ? `${weakestAddress} is the weakest selected comparable, and the packet currently carries ${majorConcerns} high-severity review concerns.`
    : `The packet currently carries ${majorConcerns} high-severity review concerns and should stay in analyst review.`
}

function generateAnalystQuestions(
  packet: EvidenceCourtPacket,
  _signalClaims: EvidenceClaim[],
  skepticClaims: EvidenceClaim[],
  counterfactuals: CounterfactualCheck[],
  weakestAddress?: string
) {
  const questions = new Set<string>()
  if (weakestAddress) {
    questions.add(`Should ${weakestAddress} remain in the selected set, or does a closer replacement exist?`)
  }
  const materialCounterfactual = counterfactuals.find((check) => Math.abs(check.deltaMidpoint) >= 15000 || Math.abs(check.deltaConfidence) >= 5)
  if (materialCounterfactual) {
    questions.add(`What analyst explanation supports keeping ${materialCounterfactual.label.replace("Remove ", "")} in the final packet?`)
  }
  if (skepticClaims.some((claim) => claim.id === "skeptic:data-boundary")) {
    questions.add("Which real-world source documents should confirm the synthetic/public-style review packet before use?")
  }
  if ((packet.valuation.valueSpreadPercent ?? 0) > 20) {
    questions.add("Can the comparable set be tightened to reduce value spread before export?")
  }
  return Array.from(questions).slice(0, 4)
}

function generateMemoReadySummary(
  packet: EvidenceCourtPacket,
  _signalClaims: EvidenceClaim[],
  skepticClaims: EvidenceClaim[],
  counterfactuals: CounterfactualCheck[],
  strongestAddress?: string,
  weakestAddress?: string
) {
  const counterfactual = counterfactuals
    .slice()
    .sort((left, right) => Math.abs(right.deltaMidpoint) - Math.abs(left.deltaMidpoint))[0]
  const reviewPhrase = skepticClaims.some((claim) => claim.severity === "high")
    ? "needs explicit analyst review"
    : "supports analyst review"
  const summary = [
    `Review Intelligence V2 indicates the current review set ${reviewPhrase} around ${formatCurrency(packet.valuation.midpointEstimate)} with ${packet.sourceScan.selectedCount} selected comparables and ${Math.round(packet.valuation.confidenceScore)}% confidence.`,
    strongestAddress ? `${strongestAddress} is the strongest support.` : undefined,
    weakestAddress ? `${weakestAddress} is the weakest selected comparable and should be reviewed.` : undefined,
    counterfactual ? `${counterfactual.interpretation}` : undefined,
    "Synthetic/public-style demonstration data is not live MLS, not an appraisal, and not a credit decision; analyst review remains required."
  ].filter(Boolean).join(" ")

  return clampWordCount(summary, 140)
}

function buildLimitations(packet: EvidenceCourtPacket) {
  const limitations = [...BASE_LIMITATIONS]
  if (packet.valuation.confidenceScore < 70) {
    limitations.push(`Confidence is ${Math.round(packet.valuation.confidenceScore)}%, so the review set should not be treated as final without analyst review.`)
  }
  if ((packet.valuation.valueSpreadPercent ?? 0) > 20) {
    limitations.push(`The value spread remains ${packet.valuation.valueSpreadPercent}%, which indicates a wider-than-ideal range.`)
  }
  return limitations
}

function selectStrongestComparable(packet: EvidenceCourtPacket) {
  return [...packet.selectedComparables].sort((left, right) =>
    right.evidenceWeight - left.evidenceWeight
    || right.comparableProbability - left.comparableProbability
    || right.matchScore - left.matchScore
    || left.id.localeCompare(right.id)
  )[0]
}

function selectWeakestComparable(packet: EvidenceCourtPacket) {
  return [...packet.selectedComparables].sort((left, right) =>
    left.evidenceWeight - right.evidenceWeight
    || left.comparableProbability - right.comparableProbability
    || right.distanceKm - left.distanceKm
    || left.id.localeCompare(right.id)
  )[0]
}

function clampWordCount(value: string, maxWords: number) {
  const words = value.trim().split(/\s+/)
  if (words.length <= maxWords) {
    return value.trim()
  }
  return `${words.slice(0, maxWords).join(" ")}.`
}
