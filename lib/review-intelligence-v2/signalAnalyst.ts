import { comparableFactId, sourceScanFactId, valuationFactId } from "./factIds"
import type { EvidenceClaim, EvidenceCourtPacket } from "./types"

export function runSignalAnalyst(packet: EvidenceCourtPacket): EvidenceClaim[] {
  const strongest = selectStrongestComparable(packet)
  if (!strongest) {
    return [
      {
        id: "signal:no-comparables",
        claim: "No selected comparables are available yet, so the review set cannot support a value conclusion.",
        claimType: "next_action",
        supportFactIds: [sourceScanFactId("selected-count")],
        severity: "high",
        verified: true
      }
    ]
  }

  return [
    {
      id: "signal:strongest-comparable",
      claim: `${strongest.address} is the strongest support because it carries the highest evidence weight in the selected review set.`,
      claimType: "supporting",
      supportFactIds: [
        comparableFactId(strongest.id, "address"),
        comparableFactId(strongest.id, "evidence-weight"),
        comparableFactId(strongest.id, "comparable-probability"),
        comparableFactId(strongest.id, "match-score")
      ],
      severity: "low",
      verified: true
    },
    {
      id: "signal:selected-count",
      claim: `The review set currently includes ${packet.sourceScan.selectedCount} selected comparables.`,
      claimType: "supporting",
      supportFactIds: [sourceScanFactId("selected-count")],
      severity: "low",
      verified: true
    },
    {
      id: "signal:value-range",
      claim: `The indicated value range is anchored by adjusted comparable values and supports a midpoint estimate of ${packet.valuation.midpointEstimate.toLocaleString("en-CA")}.`,
      claimType: "supporting",
      supportFactIds: [
        valuationFactId("low-estimate"),
        valuationFactId("midpoint-estimate"),
        valuationFactId("high-estimate"),
        comparableFactId(strongest.id, "adjusted-value")
      ],
      severity: "low",
      verified: true
    },
    {
      id: "signal:memo",
      claim: "Memo-ready language should emphasize deterministic valuation support, comparable selection quality, and analyst review boundaries.",
      claimType: "memo",
      supportFactIds: [
        valuationFactId("confidence-score"),
        valuationFactId("confidence-label"),
        sourceScanFactId("data-boundary-note")
      ],
      severity: "low",
      verified: true
    }
  ]
}

function selectStrongestComparable(packet: EvidenceCourtPacket) {
  return [...packet.selectedComparables].sort((left, right) =>
    right.evidenceWeight - left.evidenceWeight
    || right.comparableProbability - left.comparableProbability
    || right.matchScore - left.matchScore
    || left.id.localeCompare(right.id)
  )[0]
}
