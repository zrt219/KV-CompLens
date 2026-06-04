import type { AdjustedComparable } from "../types"
import type { PceAnalysisSnapshot } from "../pce/runPcePipeline"
import { adjustmentFactId, comparableFactId, riskFactId, sourceScanFactId, subjectFactId, valuationFactId } from "./factIds"
import type { EvidenceCourtPacket, EvidenceFact } from "./types"

const DATA_BOUNDARY_NOTE = "Synthetic/public-style demonstration data. Not live MLS. Analyst review required."

export function buildEvidenceCourtPacket(snapshot: PceAnalysisSnapshot): EvidenceCourtPacket {
  const facts: EvidenceFact[] = []
  const selectedComparables = snapshot.valuation.adjustedComparables

  pushFact(facts, {
    id: subjectFactId("address"),
    kind: "subject",
    label: "Subject address",
    value: snapshot.subject.address,
    sourcePath: "snapshot.subject.address",
    confidence: "high"
  })
  pushFact(facts, {
    id: subjectFactId("city"),
    kind: "subject",
    label: "Subject city",
    value: snapshot.subject.city,
    sourcePath: "snapshot.subject.city",
    confidence: "high"
  })
  pushFact(facts, {
    id: subjectFactId("province"),
    kind: "subject",
    label: "Subject province",
    value: snapshot.subject.province ?? "AB",
    sourcePath: "snapshot.subject.province",
    confidence: "high"
  })
  pushFact(facts, {
    id: subjectFactId("property-type"),
    kind: "subject",
    label: "Subject property type",
    value: snapshot.subject.propertyType,
    sourcePath: "snapshot.subject.propertyType",
    confidence: "high"
  })
  pushFact(facts, {
    id: subjectFactId("neighborhood"),
    kind: "subject",
    label: "Subject neighborhood",
    value: snapshot.subject.neighbourhood,
    sourcePath: "snapshot.subject.neighbourhood",
    confidence: "high"
  })
  pushFact(facts, {
    id: subjectFactId("beds"),
    kind: "subject",
    label: "Subject bedrooms",
    value: snapshot.subject.bedrooms,
    sourcePath: "snapshot.subject.bedrooms",
    confidence: "high"
  })
  pushFact(facts, {
    id: subjectFactId("baths"),
    kind: "subject",
    label: "Subject bathrooms",
    value: snapshot.subject.bathrooms,
    sourcePath: "snapshot.subject.bathrooms",
    confidence: "high"
  })
  pushFact(facts, {
    id: subjectFactId("living-area-sqft"),
    kind: "subject",
    label: "Subject living area",
    value: snapshot.subject.livingAreaSqft,
    sourcePath: "snapshot.subject.livingAreaSqft",
    confidence: "high"
  })
  pushFact(facts, {
    id: subjectFactId("lot-size-sqft"),
    kind: "subject",
    label: "Subject lot size",
    value: snapshot.subject.lotSizeSqft,
    sourcePath: "snapshot.subject.lotSizeSqft",
    confidence: "high"
  })
  pushFact(facts, {
    id: subjectFactId("condition"),
    kind: "subject",
    label: "Subject condition",
    value: snapshot.subject.condition,
    sourcePath: "snapshot.subject.condition",
    confidence: "high"
  })

  pushFact(facts, {
    id: valuationFactId("low-estimate"),
    kind: "valuation",
    label: "Low estimate",
    value: snapshot.valuation.lowEstimate,
    sourcePath: "snapshot.valuation.lowEstimate",
    confidence: "high"
  })
  pushFact(facts, {
    id: valuationFactId("midpoint-estimate"),
    kind: "valuation",
    label: "Midpoint estimate",
    value: snapshot.valuation.midpointEstimate,
    sourcePath: "snapshot.valuation.midpointEstimate",
    confidence: "high"
  })
  pushFact(facts, {
    id: valuationFactId("high-estimate"),
    kind: "valuation",
    label: "High estimate",
    value: snapshot.valuation.highEstimate,
    sourcePath: "snapshot.valuation.highEstimate",
    confidence: "high"
  })
  pushFact(facts, {
    id: valuationFactId("confidence-score"),
    kind: "valuation",
    label: "Confidence score",
    value: snapshot.valuation.confidenceScore,
    sourcePath: "snapshot.valuation.confidenceScore",
    confidence: "high"
  })
  pushFact(facts, {
    id: valuationFactId("confidence-label"),
    kind: "valuation",
    label: "Confidence label",
    value: snapshot.valuation.confidenceLevel,
    sourcePath: "snapshot.valuation.confidenceLevel",
    confidence: "high"
  })
  pushFact(facts, {
    id: valuationFactId("effective-comparable-count"),
    kind: "valuation",
    label: "Effective comparable count",
    value: snapshot.valuation.effectiveSampleSize,
    sourcePath: "snapshot.valuation.effectiveSampleSize",
    confidence: "medium"
  })
  pushFact(facts, {
    id: valuationFactId("value-spread-percent"),
    kind: "valuation",
    label: "Value spread percent",
    value: snapshot.valuation.valueSpreadPercent,
    sourcePath: "snapshot.valuation.valueSpreadPercent",
    confidence: "medium"
  })
  pushFact(facts, {
    id: valuationFactId("evidence-entropy"),
    kind: "valuation",
    label: "Evidence entropy",
    value: snapshot.valuation.evidenceEntropy,
    sourcePath: "snapshot.valuation.evidenceEntropy",
    confidence: "medium"
  })
  pushFact(facts, {
    id: sourceScanFactId("source-count"),
    kind: "source",
    label: "Source groups consolidated",
    value: snapshot.sourceScan.sourcesConsolidated,
    sourcePath: "snapshot.sourceScan.sourcesConsolidated",
    confidence: "high"
  })
  pushFact(facts, {
    id: sourceScanFactId("records-found"),
    kind: "source",
    label: "Records scanned",
    value: snapshot.sourceScan.recordsScanned,
    sourcePath: "snapshot.sourceScan.recordsScanned",
    confidence: "high"
  })
  pushFact(facts, {
    id: sourceScanFactId("candidates-ranked"),
    kind: "source",
    label: "Candidates ranked",
    value: snapshot.sourceScan.candidatePoolCount,
    sourcePath: "snapshot.sourceScan.candidatePoolCount",
    confidence: "high"
  })
  pushFact(facts, {
    id: sourceScanFactId("selected-count"),
    kind: "source",
    label: "Selected comparable count",
    value: snapshot.sourceScan.selectedCompCount,
    sourcePath: "snapshot.sourceScan.selectedCompCount",
    confidence: "high"
  })
  pushFact(facts, {
    id: sourceScanFactId("average-source-reliability"),
    kind: "source",
    label: "Average source reliability",
    value: snapshot.valuation.averageSourceReliability,
    sourcePath: "snapshot.valuation.averageSourceReliability",
    confidence: "medium"
  })
  pushFact(facts, {
    id: sourceScanFactId("data-boundary-note"),
    kind: "source",
    label: "Data boundary note",
    value: DATA_BOUNDARY_NOTE,
    sourcePath: "snapshot.sourceScan.dataBoundaryNote",
    confidence: "high"
  })

  snapshot.valuation.riskFlags.forEach((flag, index) => {
    pushFact(facts, {
      id: riskFactId("valuation", `${index}`),
      kind: "risk",
      label: `Valuation risk flag ${index + 1}`,
      value: flag,
      sourcePath: `snapshot.valuation.riskFlags[${index}]`,
      confidence: "medium"
    })
  })

  selectedComparables.forEach((comp, index) => {
    const evidenceWeight = normalizeEvidenceWeight(comp)
    pushComparableFactSet(facts, comp, index, evidenceWeight)
  })

  return {
    subject: {
      address: snapshot.subject.address,
      city: snapshot.subject.city,
      province: snapshot.subject.province ?? "AB",
      propertyType: snapshot.subject.propertyType,
      neighborhood: snapshot.subject.neighbourhood,
      beds: snapshot.subject.bedrooms,
      baths: snapshot.subject.bathrooms,
      livingAreaSqft: snapshot.subject.livingAreaSqft,
      lotSizeSqft: snapshot.subject.lotSizeSqft,
      condition: snapshot.subject.condition
    },
    valuation: {
      lowEstimate: snapshot.valuation.lowEstimate,
      midpointEstimate: snapshot.valuation.midpointEstimate,
      highEstimate: snapshot.valuation.highEstimate,
      confidenceScore: snapshot.valuation.confidenceScore,
      confidenceLabel: snapshot.valuation.confidenceLevel,
      effectiveComparableCount: snapshot.valuation.effectiveSampleSize,
      valueSpreadPercent: snapshot.valuation.valueSpreadPercent,
      evidenceEntropy: snapshot.valuation.evidenceEntropy,
      riskFlags: snapshot.valuation.riskFlags
    },
    sourceScan: {
      sourceCount: snapshot.sourceScan.sourcesConsolidated,
      recordsFound: snapshot.sourceScan.recordsScanned,
      candidatesRanked: snapshot.sourceScan.candidatePoolCount,
      selectedCount: snapshot.sourceScan.selectedCompCount,
      averageSourceReliability: snapshot.valuation.averageSourceReliability,
      dataBoundaryNote: DATA_BOUNDARY_NOTE
    },
    selectedComparables: selectedComparables.map((comp) => ({
      id: comp.id,
      address: comp.address,
      neighborhood: comp.neighbourhood,
      distanceKm: comp.distanceKm,
      salePrice: comp.salePrice,
      adjustedValue: comp.adjustedValue,
      comparableProbability: comp.comparableProbability,
      matchScore: comp.totalScore,
      evidenceWeight: normalizeEvidenceWeight(comp),
      topReasons: (comp.reasons ?? []).slice(0, 3),
      topPenalties: comp.penalties.slice(0, 3),
      riskFlags: comp.riskFlags
    })),
    adjustments: selectedComparables.map((comp) => {
      const largestPositive = findLargestAdjustment(comp, "positive")
      const largestNegative = findLargestAdjustment(comp, "negative")
      return {
        comparableId: comp.id,
        totalAdjustment: comp.adjustments.total,
        adjustedValue: comp.adjustedValue,
        largestPositiveAdjustment: largestPositive ? `${largestPositive.label} (${signedAmount(largestPositive.amount)})` : undefined,
        largestNegativeAdjustment: largestNegative ? `${largestNegative.label} (${signedAmount(largestNegative.amount)})` : undefined,
        exceptionFlags: Array.from(new Set([...comp.riskFlags, ...comp.penalties.slice(0, 2)]))
      }
    }),
    facts
  }
}

export function dataBoundaryNote() {
  return DATA_BOUNDARY_NOTE
}

function pushComparableFactSet(facts: EvidenceFact[], comp: AdjustedComparable, index: number, evidenceWeight: number) {
  pushFact(facts, {
    id: comparableFactId(comp.id, "address"),
    kind: "comparable",
    label: `${comp.address} address`,
    value: comp.address,
    sourcePath: `snapshot.valuation.adjustedComparables[${index}].address`,
    confidence: "high"
  })
  pushFact(facts, {
    id: comparableFactId(comp.id, "neighborhood"),
    kind: "comparable",
    label: `${comp.address} neighborhood`,
    value: comp.neighbourhood,
    sourcePath: `snapshot.valuation.adjustedComparables[${index}].neighbourhood`,
    confidence: "high"
  })
  pushFact(facts, {
    id: comparableFactId(comp.id, "distance-km"),
    kind: "comparable",
    label: `${comp.address} distance`,
    value: comp.distanceKm,
    sourcePath: `snapshot.valuation.adjustedComparables[${index}].distanceKm`,
    confidence: "high"
  })
  pushFact(facts, {
    id: comparableFactId(comp.id, "sale-price"),
    kind: "comparable",
    label: `${comp.address} sale price`,
    value: comp.salePrice,
    sourcePath: `snapshot.valuation.adjustedComparables[${index}].salePrice`,
    confidence: "high"
  })
  pushFact(facts, {
    id: comparableFactId(comp.id, "adjusted-value"),
    kind: "comparable",
    label: `${comp.address} adjusted value`,
    value: comp.adjustedValue,
    sourcePath: `snapshot.valuation.adjustedComparables[${index}].adjustedValue`,
    confidence: "high"
  })
  pushFact(facts, {
    id: comparableFactId(comp.id, "comparable-probability"),
    kind: "comparable",
    label: `${comp.address} comparable probability`,
    value: comp.comparableProbability,
    sourcePath: `snapshot.valuation.adjustedComparables[${index}].comparableProbability`,
    confidence: "medium"
  })
  pushFact(facts, {
    id: comparableFactId(comp.id, "match-score"),
    kind: "comparable",
    label: `${comp.address} match score`,
    value: comp.totalScore,
    sourcePath: `snapshot.valuation.adjustedComparables[${index}].totalScore`,
    confidence: "medium"
  })
  pushFact(facts, {
    id: comparableFactId(comp.id, "evidence-weight"),
    kind: "comparable",
    label: `${comp.address} evidence weight`,
    value: evidenceWeight,
    sourcePath: `snapshot.valuation.adjustedComparables[${index}].normalizedEvidenceWeight`,
    confidence: "medium"
  })
  ;(comp.reasons ?? []).slice(0, 3).forEach((reason, reasonIndex) => {
    pushFact(facts, {
      id: comparableFactId(comp.id, `reason-${reasonIndex}`),
      kind: "comparable",
      label: `${comp.address} support reason ${reasonIndex + 1}`,
      value: reason,
      sourcePath: `snapshot.valuation.adjustedComparables[${index}].reasons[${reasonIndex}]`,
      confidence: "medium"
    })
  })
  comp.penalties.slice(0, 3).forEach((penalty, penaltyIndex) => {
    pushFact(facts, {
      id: comparableFactId(comp.id, `penalty-${penaltyIndex}`),
      kind: "risk",
      label: `${comp.address} caution ${penaltyIndex + 1}`,
      value: penalty,
      sourcePath: `snapshot.valuation.adjustedComparables[${index}].penalties[${penaltyIndex}]`,
      confidence: "medium"
    })
  })
  comp.riskFlags.forEach((flag, riskIndex) => {
    pushFact(facts, {
      id: comparableFactId(comp.id, `risk-flag-${riskIndex}`),
      kind: "risk",
      label: `${comp.address} risk flag ${riskIndex + 1}`,
      value: flag,
      sourcePath: `snapshot.valuation.adjustedComparables[${index}].riskFlags[${riskIndex}]`,
      confidence: "medium"
    })
  })
  pushFact(facts, {
    id: adjustmentFactId(comp.id, "total-adjustment"),
    kind: "adjustment",
    label: `${comp.address} total adjustment`,
    value: comp.adjustments.total,
    sourcePath: `snapshot.valuation.adjustedComparables[${index}].adjustments.total`,
    confidence: "high"
  })
  comp.adjustmentLines.forEach((line, lineIndex) => {
    pushFact(facts, {
      id: adjustmentFactId(comp.id, `line-${lineIndex}`),
      kind: "adjustment",
      label: `${comp.address} ${line.label}`,
      value: signedAmount(line.amount),
      sourcePath: `snapshot.valuation.adjustedComparables[${index}].adjustmentLines[${lineIndex}].amount`,
      confidence: line.confidence >= 0.7 ? "high" : "medium"
    })
  })
  const largestPositive = findLargestAdjustment(comp, "positive")
  if (largestPositive) {
    pushFact(facts, {
      id: adjustmentFactId(comp.id, "largest-positive-adjustment"),
      kind: "adjustment",
      label: `${comp.address} largest positive adjustment`,
      value: `${largestPositive.label} (${signedAmount(largestPositive.amount)})`,
      sourcePath: `snapshot.valuation.adjustedComparables[${index}].adjustmentLines`,
      confidence: "medium"
    })
  }
  const largestNegative = findLargestAdjustment(comp, "negative")
  if (largestNegative) {
    pushFact(facts, {
      id: adjustmentFactId(comp.id, "largest-negative-adjustment"),
      kind: "adjustment",
      label: `${comp.address} largest negative adjustment`,
      value: `${largestNegative.label} (${signedAmount(largestNegative.amount)})`,
      sourcePath: `snapshot.valuation.adjustedComparables[${index}].adjustmentLines`,
      confidence: "medium"
    })
  }
}

function findLargestAdjustment(comp: AdjustedComparable, direction: "positive" | "negative") {
  const filtered = comp.adjustmentLines.filter((line) => direction === "positive" ? line.amount > 0 : line.amount < 0)
  if (!filtered.length) {
    return undefined
  }
  return [...filtered].sort((left, right) => Math.abs(right.amount) - Math.abs(left.amount))[0]
}

function normalizeEvidenceWeight(comp: AdjustedComparable) {
  return Number((comp.normalizedEvidenceWeight ?? comp.evidenceWeight).toFixed(4))
}

function pushFact(facts: EvidenceFact[], fact: EvidenceFact) {
  facts.push(fact)
}

function signedAmount(amount: number) {
  const rounded = Math.round(amount)
  return `${rounded >= 0 ? "+" : "-"}$${Math.abs(rounded).toLocaleString()}`
}
