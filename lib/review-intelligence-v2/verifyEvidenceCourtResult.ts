import type { EvidenceClaim, EvidenceCourtPacket, EvidenceCourtResult, EvidenceCourtVerification } from "./types"

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
]

export function verifyEvidenceCourtResult(packet: EvidenceCourtPacket, result: EvidenceCourtResult): EvidenceCourtVerification {
  const errors: string[] = []
  const warnings: string[] = []
  const factsById = new Map(packet.facts.map((fact) => [fact.id, fact]))
  const comparableIds = new Set(packet.selectedComparables.map((comp) => comp.id))
  const comparableAddresses = new Set(packet.selectedComparables.map((comp) => comp.address))
  const allowedCurrencyValues = new Set<number>([
    packet.valuation.lowEstimate,
    packet.valuation.midpointEstimate,
    packet.valuation.highEstimate,
    ...packet.selectedComparables.flatMap((comp) => [comp.salePrice, comp.adjustedValue]),
    ...packet.adjustments.map((adjustment) => Math.abs(adjustment.totalAdjustment))
  ].map((value) => Math.round(Math.abs(value))))

  if (!comparableIds.has(result.strongestComparable.comparableId)) {
    errors.push("Strongest comparable id is not present in the packet.")
  }
  if (!comparableIds.has(result.weakestSelectedComparable.comparableId)) {
    errors.push("Weakest comparable id is not present in the packet.")
  }
  if (!comparableAddresses.has(result.strongestComparable.address)) {
    errors.push("Strongest comparable address is not present in the packet.")
  }
  if (!comparableAddresses.has(result.weakestSelectedComparable.address)) {
    errors.push("Weakest comparable address is not present in the packet.")
  }

  const allClaims = [...result.signalAnalyst.strongestEvidence, ...result.skepticAnalyst.concerns]
  allClaims.forEach((claim) => {
    if (!claim.supportFactIds.length) {
      errors.push(`Claim ${claim.id} has no support facts.`)
    }
    claim.supportFactIds.forEach((factId) => {
      if (!factsById.has(factId)) {
        errors.push(`Claim ${claim.id} references missing fact ${factId}.`)
      }
    })
  })

  const textBlocks = collectTextBlocks(result)
  textBlocks.forEach((block) => {
    FORBIDDEN_PHRASES.forEach((phrase) => {
      if (containsForbiddenPhrase(block, phrase)) {
        errors.push(`Forbidden phrase detected: ${phrase}.`)
      }
    })
  })

  extractCurrencyValues(textBlocks.join(" ")).forEach((value) => {
    if (!allowedCurrencyValues.has(value)) {
      errors.push(`Unrecognized currency value referenced: ${value}.`)
    }
  })

  const normalizedLimitations = result.limitations.map((item) => item.toLowerCase())
  if (!normalizedLimitations.some((item) => item.includes("synthetic/public-style"))) {
    errors.push("Limitations must mention synthetic/public-style data.")
  }
  if (!normalizedLimitations.some((item) => item.includes("not live mls"))) {
    errors.push("Limitations must mention not live MLS.")
  }
  if (!normalizedLimitations.some((item) => item.includes("not an appraisal") || item.includes("not appraisal"))) {
    errors.push("Limitations must mention not an appraisal.")
  }
  if (!normalizedLimitations.some((item) => item.includes("not a credit decision") || item.includes("not credit decision"))) {
    errors.push("Limitations must mention not a credit decision.")
  }
  if (!normalizedLimitations.some((item) => item.includes("analyst review required"))) {
    errors.push("Limitations must mention analyst review required.")
  }

  if (packet.valuation.confidenceScore < 55 && result.verdict.label === "Review set is usable") {
    errors.push("Low-confidence review sets cannot be labeled usable.")
  }
  const hasHighSeverityConcern = result.skepticAnalyst.concerns.some((claim) => claim.severity === "high")
  if ((hasHighSeverityConcern || packet.valuation.riskFlags.length > 0) && !result.verdict.summary.toLowerCase().includes("analyst review")) {
    errors.push("Verdict summary must mention analyst review when major risks exist.")
  }

  if (wordCount(result.memoReadySummary) > 140) {
    errors.push("Memo summary exceeds 140 words.")
  }

  if (result.strongestComparable.supportingClaimIds.some((claimId) => !allClaims.some((claim) => claim.id === claimId))) {
    errors.push("Strongest comparable references missing supporting claim ids.")
  }
  if (result.weakestSelectedComparable.riskClaimIds.some((claimId) => !allClaims.some((claim) => claim.id === claimId))) {
    errors.push("Weakest comparable references missing risk claim ids.")
  }

  result.counterfactuals.forEach((check) => {
    if (check.comparableId && !comparableIds.has(check.comparableId)) {
      errors.push(`Counterfactual ${check.id} references an unknown comparable.`)
    }
  })

  const verifiedClaimCount = allClaims.filter((claim) => claim.verified).length
  const rejectedClaimCount = allClaims.length - verifiedClaimCount + errors.length

  if (!result.signalAnalyst.strongestEvidence.some((claim) => claim.id === "signal:strongest-comparable")) {
    warnings.push("Signal analyst summary is missing the strongest comparable claim.")
  }
  if (!result.skepticAnalyst.concerns.length) {
    warnings.push("Skeptic analyst returned no concerns.")
  }

  return {
    ok: errors.length === 0,
    errors,
    warnings,
    verifiedClaimCount,
    rejectedClaimCount
  }
}

export function safeEvidenceCourtFallback(packet: EvidenceCourtPacket, message = "The review set needs analyst review before it can be attached to the memo.") {
  const strongest = packet.selectedComparables[0]
  return {
    verdict: {
      label: "Review set needs analyst review" as const,
      summary: message
    },
    strongestComparable: {
      comparableId: strongest?.id ?? "unavailable",
      address: strongest?.address ?? "Unavailable",
      reason: "Verified review intelligence is unavailable.",
      supportingClaimIds: []
    },
    weakestSelectedComparable: {
      comparableId: strongest?.id ?? "unavailable",
      address: strongest?.address ?? "Unavailable",
      reason: "Verified review intelligence is unavailable.",
      riskClaimIds: []
    },
    signalAnalyst: {
      summary: "Verified review intelligence is unavailable.",
      strongestEvidence: [] as EvidenceClaim[]
    },
    skepticAnalyst: {
      summary: "Analyst review remains required.",
      concerns: [] as EvidenceClaim[]
    },
    counterfactuals: [],
    analystQuestions: ["Should the current review set be regenerated before export?"],
    memoReadySummary: "Review Intelligence V2 is unavailable for attachment. Synthetic/public-style demonstration data is not live MLS, not an appraisal, and not a credit decision; analyst review remains required.",
    limitations: [
      "Synthetic/public-style demonstration data. Not live MLS. Analyst review required.",
      "This output is not an appraisal.",
      "This output is not a credit decision."
    ],
    verification: {
      ok: false,
      errors: [message],
      warnings: [],
      verifiedClaimCount: 0,
      rejectedClaimCount: 1
    }
  }
}

function collectTextBlocks(result: EvidenceCourtResult) {
  return [
    result.verdict.summary,
    result.strongestComparable.reason,
    result.weakestSelectedComparable.reason,
    result.signalAnalyst.summary,
    result.skepticAnalyst.summary,
    result.memoReadySummary,
    ...result.analystQuestions,
    ...result.limitations,
    ...result.signalAnalyst.strongestEvidence.map((claim) => claim.claim),
    ...result.skepticAnalyst.concerns.map((claim) => claim.claim),
    ...result.counterfactuals.map((check) => check.interpretation)
  ]
}

function extractCurrencyValues(text: string) {
  return Array.from(text.matchAll(/\$([\d,]+)/g)).map((match) => Number(match[1].replace(/,/g, "")))
}

function wordCount(value: string) {
  return value.trim().split(/\s+/).filter(Boolean).length
}

function containsForbiddenPhrase(block: string, phrase: string) {
  const normalized = block.toLowerCase()
  if (!normalized.includes(phrase)) {
    return false
  }
  if (phrase === "live mls" && normalized.includes("not live mls")) {
    return false
  }
  if (
    phrase === "credit decision"
    && (
      normalized.includes("not a credit decision")
      || normalized.includes("not credit decision")
      || normalized.includes("replace a credit decision")
      || normalized.includes("replace credit decision")
    )
  ) {
    return false
  }
  return true
}
