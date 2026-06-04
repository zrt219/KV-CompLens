export type EvidenceFact = {
  id: string
  kind:
    | "subject"
    | "source"
    | "valuation"
    | "comparable"
    | "adjustment"
    | "risk"
    | "audit"
  label: string
  value: string | number | boolean
  sourcePath: string
  confidence: "high" | "medium" | "low"
}

export type EvidenceClaim = {
  id: string
  claim: string
  claimType:
    | "supporting"
    | "risk"
    | "counterfactual"
    | "limitation"
    | "next_action"
    | "memo"
  supportFactIds: string[]
  severity?: "low" | "medium" | "high"
  verified: boolean
}

export type EvidenceCourtPacket = {
  subject: {
    address: string
    city: string
    province: string
    propertyType: string
    neighborhood?: string
    beds: number
    baths: number
    livingAreaSqft: number
    lotSizeSqft?: number
    condition?: string
  }
  valuation: {
    lowEstimate: number
    midpointEstimate: number
    highEstimate: number
    confidenceScore: number
    confidenceLabel: string
    effectiveComparableCount?: number
    valueSpreadPercent?: number
    evidenceEntropy?: number
    riskFlags: string[]
  }
  sourceScan: {
    sourceCount: number
    recordsFound?: number
    candidatesRanked?: number
    selectedCount: number
    averageSourceReliability?: number
    dataBoundaryNote: string
  }
  selectedComparables: Array<{
    id: string
    address: string
    neighborhood?: string
    distanceKm: number
    salePrice: number
    adjustedValue: number
    comparableProbability: number
    matchScore: number
    evidenceWeight: number
    topReasons: string[]
    topPenalties: string[]
    riskFlags: string[]
  }>
  adjustments: Array<{
    comparableId: string
    totalAdjustment: number
    adjustedValue: number
    largestPositiveAdjustment?: string
    largestNegativeAdjustment?: string
    exceptionFlags: string[]
  }>
  facts: EvidenceFact[]
}

export type CounterfactualCheck = {
  id: string
  label: string
  comparableId?: string
  beforeMidpoint: number
  afterMidpoint: number
  deltaMidpoint: number
  beforeConfidence: number
  afterConfidence: number
  deltaConfidence: number
  rangeImpact: number
  interpretation: string
}

export type EvidenceCourtVerification = {
  ok: boolean
  errors: string[]
  warnings: string[]
  verifiedClaimCount: number
  rejectedClaimCount: number
}

export type EvidenceCourtResult = {
  verdict: {
    label:
      | "Review set is usable"
      | "Review set needs analyst review"
      | "Review set is weak"
    summary: string
  }
  strongestComparable: {
    comparableId: string
    address: string
    reason: string
    supportingClaimIds: string[]
  }
  weakestSelectedComparable: {
    comparableId: string
    address: string
    reason: string
    riskClaimIds: string[]
  }
  signalAnalyst: {
    summary: string
    strongestEvidence: EvidenceClaim[]
  }
  skepticAnalyst: {
    summary: string
    concerns: EvidenceClaim[]
  }
  counterfactuals: CounterfactualCheck[]
  analystQuestions: string[]
  memoReadySummary: string
  limitations: string[]
  verification: EvidenceCourtVerification
}
