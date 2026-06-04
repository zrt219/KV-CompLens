import { adjustmentFactId, comparableFactId, sourceScanFactId, valuationFactId } from "./factIds"
import type { EvidenceClaim, EvidenceCourtPacket } from "./types"

export function runSkepticAnalyst(packet: EvidenceCourtPacket): EvidenceClaim[] {
  const concerns: EvidenceClaim[] = []
  const factIds = new Set(packet.facts.map((fact) => fact.id))
  const weakest = selectWeakestComparable(packet)

  if (weakest) {
    concerns.push({
      id: "skeptic:weakest-comparable",
      claim: `${weakest.address} should be reviewed because it is the weakest selected comparable by evidence weight.`,
      claimType: "risk",
      supportFactIds: [
        comparableFactId(weakest.id, "address"),
        comparableFactId(weakest.id, "evidence-weight"),
        comparableFactId(weakest.id, "comparable-probability")
      ],
      severity: weakest.evidenceWeight < 0.08 ? "high" : "medium",
      verified: true
    })
  }

  packet.selectedComparables.forEach((comp) => {
    if (comp.distanceKm >= 18) {
      concerns.push({
        id: `skeptic:distance:${comp.id}`,
        claim: `${comp.address} is farther than preferred for a tight review set and should be checked for location drift.`,
        claimType: "risk",
        supportFactIds: [
          comparableFactId(comp.id, "address"),
          comparableFactId(comp.id, "distance-km")
        ],
        severity: "high",
        verified: true
      })
    } else if (comp.distanceKm >= 10) {
      concerns.push({
        id: `skeptic:distance:${comp.id}`,
        claim: `${comp.address} is outside the closest cluster of selected comparables and merits a location check.`,
        claimType: "risk",
        supportFactIds: [
          comparableFactId(comp.id, "address"),
          comparableFactId(comp.id, "distance-km")
        ],
        severity: "medium",
        verified: true
      })
    }

    if (comp.comparableProbability < 0.28 || comp.evidenceWeight < 0.05) {
      concerns.push({
        id: `skeptic:low-weight:${comp.id}`,
        claim: `${comp.address} contributes weak support because its comparable probability or evidence weight is near the lower bound.`,
        claimType: "risk",
        supportFactIds: [
          comparableFactId(comp.id, "address"),
          comparableFactId(comp.id, "comparable-probability"),
          comparableFactId(comp.id, "evidence-weight")
        ],
        severity: "high",
        verified: true
      })
    }

    const adjustmentFlags = packet.adjustments.find((adjustment) => adjustment.comparableId === comp.id)?.exceptionFlags ?? []
    if (adjustmentFlags.length) {
      concerns.push({
        id: `skeptic:adjustment-exceptions:${comp.id}`,
        claim: `${comp.address} carries adjustment or review exceptions that should be explained before export.`,
        claimType: "risk",
        supportFactIds: [
          adjustmentFactId(comp.id, "total-adjustment"),
          comparableFactId(comp.id, "risk-flag-0"),
          comparableFactId(comp.id, "penalty-0")
        ].filter((factId) => factIds.has(factId)),
        severity: "medium",
        verified: true
      })
    }
  })

  if ((packet.valuation.valueSpreadPercent ?? 0) > 20) {
    concerns.push({
      id: "skeptic:value-spread",
      claim: "The selected comparable set still produces a wide value spread, which lowers confidence in the review range.",
      claimType: "risk",
      supportFactIds: [
        valuationFactId("value-spread-percent"),
        valuationFactId("confidence-score")
      ],
      severity: (packet.valuation.valueSpreadPercent ?? 0) > 30 ? "high" : "medium",
      verified: true
    })
  }

  if (packet.valuation.confidenceScore < 70) {
    concerns.push({
      id: "skeptic:confidence",
      claim: "Confidence remains below the preferred threshold, so analyst review should stay explicit in any memo-ready summary.",
      claimType: "risk",
      supportFactIds: [
        valuationFactId("confidence-score"),
        valuationFactId("confidence-label")
      ],
      severity: packet.valuation.confidenceScore < 55 ? "high" : "medium",
      verified: true
    })
  }

  concerns.push({
    id: "skeptic:data-boundary",
    claim: "Synthetic/public-style data boundaries limit business use and require analyst confirmation against real-world source documents.",
    claimType: "limitation",
    supportFactIds: [
      sourceScanFactId("data-boundary-note"),
      sourceScanFactId("average-source-reliability")
    ],
    severity: "medium",
    verified: true
  })

  return dedupeClaims(concerns)
}

function selectWeakestComparable(packet: EvidenceCourtPacket) {
  return [...packet.selectedComparables].sort((left, right) =>
    left.evidenceWeight - right.evidenceWeight
    || left.comparableProbability - right.comparableProbability
    || right.distanceKm - left.distanceKm
    || left.id.localeCompare(right.id)
  )[0]
}

function dedupeClaims(claims: EvidenceClaim[]) {
  const seen = new Set<string>()
  return claims.filter((claim) => {
    const key = claim.claim
    if (seen.has(key)) {
      return false
    }
    seen.add(key)
    return true
  })
}
