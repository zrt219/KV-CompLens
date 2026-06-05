import { formatCurrency } from "../format";
import type { RetrievedContext } from "../rag/retrieveReviewContext";
import type { RagFact } from "../rag/sourceRegistry";
import type { ZrtReviewInsight } from "./types";

type ComparableInsightRecord = {
  comparableId: string;
  address: string;
  addressFactId?: string;
  propertyType?: string;
  neighborhood?: string;
  distanceKm?: number;
  distanceKmFactId?: string;
  salePrice?: number;
  salePriceFactId?: string;
  adjustedValue?: number;
  adjustedValueFactId?: string;
  comparableProbability?: number;
  comparableProbabilityFactId?: string;
  matchScore?: number;
  matchScoreFactId?: string;
  evidenceWeight?: number;
  evidenceWeightFactId?: string;
  reasons: Array<{ value: string; factId: string }>;
  cautions: Array<{ value: string; factId: string }>;
  sourceNote?: { value: string; factId: string };
  totalAdjustment?: { value: number; factId: string };
  adjustmentLines: Array<{ value: string; factId: string }>;
};

type FactLookup = {
  lowEstimate?: RagFact;
  midpointEstimate?: RagFact;
  highEstimate?: RagFact;
  confidenceScore?: RagFact;
  confidenceLabel?: RagFact;
  valueSpreadPercent?: RagFact;
  effectiveComparableCount?: RagFact;
  averageComparableProbability?: RagFact;
  averageSourceReliability?: RagFact;
  sourceCount?: RagFact;
  recordsFound?: RagFact;
  comparablesRanked?: RagFact;
  comparablesSelected?: RagFact;
  dataBoundaryNote?: RagFact;
  valuationRiskFacts: RagFact[];
  limitationFacts: RagFact[];
};

export function generateDeterministicZrtReviewInsight(context: RetrievedContext): ZrtReviewInsight {
  const lookup = buildFactLookup(context.facts);
  const comparables = buildComparableRecords(context.facts);
  const strongestComparable = selectStrongestComparable(comparables);
  const weakestComparable = selectWeakestComparable(comparables);
  const confidenceScore = numericValue(lookup.confidenceScore);
  const confidenceLabel = stringValue(lookup.confidenceLabel) || "Review needed";
  const valueSpreadPercent = numericValue(lookup.valueSpreadPercent);
  const effectiveComparableCount = numericValue(lookup.effectiveComparableCount) || comparables.length;
  const averageSourceReliability = numericValue(lookup.averageSourceReliability);
  const analystQuestions = buildAnalystQuestions(comparables, weakestComparable);
  const keyEvidence = buildKeyEvidence({
    comparables,
    strongestComparable,
    lookup,
    effectiveComparableCount
  });
  const keyRisks = buildKeyRisks({
    confidenceScore,
    valueSpreadPercent,
    comparables,
    weakestComparable,
    limitationFacts: lookup.limitationFacts,
    valuationRiskFacts: lookup.valuationRiskFacts
  });
  const verdict = deriveVerdict(confidenceScore, valueSpreadPercent, effectiveComparableCount, keyRisks);
  const confidenceRationale = buildConfidenceRationale({
    confidenceScore,
    confidenceLabel,
    valueSpreadPercent,
    effectiveComparableCount,
    averageSourceReliability,
    lookup,
    verdict
  });
  const summary = buildSummary({
    verdict,
    confidenceScore,
    valueSpreadPercent,
    strongestComparable,
    weakestComparable,
    comparablesCount: comparables.length
  });
  const nextAction = buildNextAction(context.intent, weakestComparable?.address);
  const memoReadySummary = clampWordCount(
    [
      `Review Intelligence V2 marks the packet as ${humanizeVerdict(verdict)} around ${formatCurrency(numericValue(lookup.midpointEstimate))} with ${comparables.length} selected comparables and ${Math.round(confidenceScore)}% confidence.`,
      strongestComparable ? `${strongestComparable.address} is the strongest anchor.` : undefined,
      weakestComparable ? `${weakestComparable.address} should be checked before finalizing the memo.` : undefined,
      `Synthetic/public-style demo data is not live MLS, not an appraisal, and not a credit decision. Analyst review remains required.`
    ].filter(Boolean).join(" "),
    140
  );
  const limitations = uniqueStrings(lookup.limitationFacts.map((fact) => String(fact.value)));

  return {
    title: "Review Set Summary",
    verdict,
    summary,
    strongestComparable: strongestComparable ? {
      comparableId: strongestComparable.comparableId,
      address: strongestComparable.address,
      reason: `${strongestComparable.address} ranks highest on evidence weight, comparable probability, and match score within the selected review set.`,
      factIds: compactFactIds([
        strongestComparable.addressFactId,
        strongestComparable.evidenceWeightFactId,
        strongestComparable.comparableProbabilityFactId,
        strongestComparable.matchScoreFactId
      ])
    } : undefined,
    weakestComparable: weakestComparable ? {
      comparableId: weakestComparable.comparableId,
      address: weakestComparable.address,
      reason: weakestComparable.cautions.length
        ? `${weakestComparable.address} carries the thinnest support because it combines lower evidence weight with flagged cautions in the current packet.`
        : `${weakestComparable.address} is the weakest selected comparable because its evidence weight trails the rest of the packet.`,
      factIds: compactFactIds([
        weakestComparable.addressFactId,
        weakestComparable.evidenceWeightFactId,
        weakestComparable.comparableProbabilityFactId,
        ...weakestComparable.cautions.map((item) => item.factId)
      ])
    } : undefined,
    confidenceRationale,
    keyEvidence,
    keyRisks,
    analystQuestions,
    nextAction,
    memoReadySummary,
    limitations
  };
}

function buildKeyEvidence({
  comparables,
  strongestComparable,
  lookup,
  effectiveComparableCount
}: {
  comparables: ComparableInsightRecord[];
  strongestComparable?: ComparableInsightRecord;
  lookup: FactLookup;
  effectiveComparableCount: number;
}) {
  const evidence: Array<{ point: string; factIds: string[] }> = [];
  const closestComparable = [...comparables]
    .filter((comp) => typeof comp.distanceKm === "number")
    .sort((left, right) => (left.distanceKm ?? Infinity) - (right.distanceKm ?? Infinity))[0];
  if (closestComparable?.distanceKm !== undefined) {
    evidence.push({
      point: `${closestComparable.address} is the closest selected comparable at ${closestComparable.distanceKm.toFixed(1)} km.`,
      factIds: compactFactIds([closestComparable.addressFactId, closestComparable.distanceKmFactId])
    });
  }
  if (strongestComparable?.comparableProbability !== undefined && strongestComparable.evidenceWeight !== undefined) {
    evidence.push({
      point: `${strongestComparable.address} pairs ${Math.round(strongestComparable.comparableProbability * 100)}% comparable probability with ${Math.round(strongestComparable.evidenceWeight * 100)}% evidence strength.`,
      factIds: compactFactIds([
        strongestComparable.addressFactId,
        strongestComparable.comparableProbabilityFactId,
        strongestComparable.evidenceWeightFactId
      ])
    });
  }
  if (lookup.averageSourceReliability) {
    evidence.push({
      point: `Average source reliability is ${Math.round(numericValue(lookup.averageSourceReliability) * 100)}% across the selected packet.`,
      factIds: [lookup.averageSourceReliability.id]
    });
  }
  if (lookup.effectiveComparableCount) {
    evidence.push({
      point: `${effectiveComparableCount} effective comparables support the current range.`,
      factIds: [lookup.effectiveComparableCount.id]
    });
  }
  const bestAdjustedComparable = [...comparables]
    .filter((comp) => typeof comp.adjustedValue === "number")
    .sort((left, right) => Math.abs((left.adjustedValue ?? 0) - numericValue(lookup.midpointEstimate)) - Math.abs((right.adjustedValue ?? 0) - numericValue(lookup.midpointEstimate)))[0];
  if (bestAdjustedComparable?.adjustedValue !== undefined) {
    evidence.push({
      point: `${bestAdjustedComparable.address} lands near the midpoint at ${formatCurrency(bestAdjustedComparable.adjustedValue)} adjusted value.`,
      factIds: compactFactIds([bestAdjustedComparable.addressFactId, bestAdjustedComparable.adjustedValueFactId, lookup.midpointEstimate?.id])
    });
  }
  return evidence.slice(0, 5);
}

function buildKeyRisks({
  confidenceScore,
  valueSpreadPercent,
  comparables,
  weakestComparable,
  limitationFacts,
  valuationRiskFacts
}: {
  confidenceScore: number;
  valueSpreadPercent: number;
  comparables: ComparableInsightRecord[];
  weakestComparable?: ComparableInsightRecord;
  limitationFacts: RagFact[];
  valuationRiskFacts: RagFact[];
}) {
  const risks: Array<{ risk: string; severity: "low" | "medium" | "high"; factIds: string[] }> = [];

  if (confidenceScore < 55) {
    risks.push({
      risk: `Confidence is ${Math.round(confidenceScore)}%, which keeps the packet in weak review territory.`,
      severity: "high",
      factIds: compactFactIds([findFactId(valuationRiskFacts, "confidence"), "valuation:confidence_score"])
    });
  } else if (confidenceScore < 70) {
    risks.push({
      risk: `Confidence is ${Math.round(confidenceScore)}%, so analyst review is still required before export.`,
      severity: "medium",
      factIds: ["valuation:confidence_score"]
    });
  }

  if (valueSpreadPercent > 30) {
    risks.push({
      risk: `The ${valueSpreadPercent}% value spread is wide for a memo-ready packet.`,
      severity: "high",
      factIds: ["valuation:value_spread_percent"]
    });
  } else if (valueSpreadPercent > 20) {
    risks.push({
      risk: `The ${valueSpreadPercent}% value spread still leaves room for tighter range support.`,
      severity: "medium",
      factIds: ["valuation:value_spread_percent"]
    });
  }

  if (weakestComparable) {
    if ((weakestComparable.evidenceWeight ?? 1) < 0.55) {
      risks.push({
        risk: `${weakestComparable.address} has low evidence weight relative to the rest of the selected set.`,
        severity: "high",
        factIds: compactFactIds([weakestComparable.addressFactId, weakestComparable.evidenceWeightFactId])
      });
    }
    if (weakestComparable.cautions.length) {
      risks.push({
        risk: `${weakestComparable.address} carries review cautions that should be cleared before final export.`,
        severity: "medium",
        factIds: compactFactIds([weakestComparable.addressFactId, ...weakestComparable.cautions.map((item) => item.factId)])
      });
    }
  }

  valuationRiskFacts.slice(0, 2).forEach((fact) => {
    risks.push({
      risk: String(fact.value),
      severity: "medium",
      factIds: [fact.id]
    });
  });

  limitationFacts.slice(0, 2).forEach((fact) => {
    risks.push({
      risk: String(fact.value),
      severity: "low",
      factIds: [fact.id]
    });
  });

  if (!comparables.length) {
    risks.push({
      risk: "No selected comparables are available in the retrieved packet.",
      severity: "high",
      factIds: []
    });
  }

  return uniqueRisks(risks).slice(0, 5);
}

function buildConfidenceRationale({
  confidenceScore,
  confidenceLabel,
  valueSpreadPercent,
  effectiveComparableCount,
  averageSourceReliability,
  lookup,
  verdict
}: {
  confidenceScore: number;
  confidenceLabel: string;
  valueSpreadPercent: number;
  effectiveComparableCount: number;
  averageSourceReliability: number;
  lookup: FactLookup;
  verdict: ZrtReviewInsight["verdict"];
}) {
  return {
    label: `${Math.round(confidenceScore)}% confidence · ${confidenceLabel}`,
    explanation: `The packet is ${humanizeVerdict(verdict)} because confidence is ${Math.round(confidenceScore)}%, the value spread is ${valueSpreadPercent}%, the effective comparable count is ${effectiveComparableCount}, and average source reliability is ${Math.round(averageSourceReliability * 100)}%.`,
    factIds: compactFactIds([
      lookup.confidenceScore?.id,
      lookup.confidenceLabel?.id,
      lookup.valueSpreadPercent?.id,
      lookup.effectiveComparableCount?.id,
      lookup.averageSourceReliability?.id
    ])
  };
}

function buildSummary({
  verdict,
  confidenceScore,
  valueSpreadPercent,
  strongestComparable,
  weakestComparable,
  comparablesCount
}: {
  verdict: ZrtReviewInsight["verdict"];
  confidenceScore: number;
  valueSpreadPercent: number;
  strongestComparable?: ComparableInsightRecord;
  weakestComparable?: ComparableInsightRecord;
  comparablesCount: number;
}) {
  return [
    `The current review set is ${humanizeVerdict(verdict)} with ${comparablesCount} selected comparables and ${Math.round(confidenceScore)}% confidence.`,
    `The adjusted-value spread is ${valueSpreadPercent}%, which sets the current range boundary.`,
    strongestComparable ? `${strongestComparable.address} is the strongest support in the selected set.` : undefined,
    weakestComparable ? `${weakestComparable.address} is the weakest selected comparable and should be reviewed before export.` : undefined
  ].filter(Boolean).join(" ");
}

function buildAnalystQuestions(comparables: ComparableInsightRecord[], weakestComparable?: ComparableInsightRecord) {
  const questions = new Set<string>();
  if (weakestComparable) {
    questions.add(`Should ${weakestComparable.address} remain in the selected set?`);
  }
  const largestAdjustmentComparable = [...comparables]
    .filter((comp) => comp.totalAdjustment)
    .sort((left, right) => Math.abs(right.totalAdjustment?.value ?? 0) - Math.abs(left.totalAdjustment?.value ?? 0))[0];
  if (largestAdjustmentComparable?.totalAdjustment) {
    questions.add(`Does ${largestAdjustmentComparable.address} need another review for its largest adjustment?`);
  }
  questions.add("Would another recent nearby sale reduce the current range width?");
  return Array.from(questions).slice(0, 3);
}

function buildNextAction(intent: RetrievedContext["intent"], weakestAddress?: string) {
  if (intent === "adjustment_summary") {
    return "Confirm adjustment assumptions before moving to export.";
  }
  if (intent === "export_summary") {
    return "Export the report package after analyst approval.";
  }
  return weakestAddress
    ? `Proceed to adjustments after checking ${weakestAddress}.`
    : "Proceed to adjustments after checking the weakest support point.";
}

function deriveVerdict(
  confidenceScore: number,
  valueSpreadPercent: number,
  effectiveComparableCount: number,
  risks: ZrtReviewInsight["keyRisks"]
): ZrtReviewInsight["verdict"] {
  const hasMajorRisk = risks.some((risk) => risk.severity === "high");
  if (confidenceScore < 55 || hasMajorRisk || effectiveComparableCount < 3) {
    return "weak_packet";
  }
  if (confidenceScore < 70 || valueSpreadPercent > 20) {
    return "needs_review";
  }
  return "usable_with_review";
}

function buildComparableRecords(facts: RagFact[]) {
  const records = new Map<string, ComparableInsightRecord>();
  facts
    .filter((fact) => fact.id.startsWith("comparable:") || fact.id.startsWith("adjustment:"))
    .forEach((fact) => {
      const [kind, comparableId, ...fieldParts] = fact.id.split(":");
      if (!comparableId || !fieldParts.length) {
        return;
      }
      const field = fieldParts.join(":");
      const record: ComparableInsightRecord = records.get(comparableId) ?? {
        comparableId,
        address: "",
        reasons: [],
        cautions: [],
        adjustmentLines: []
      };
      if (kind === "comparable") {
        switch (field) {
          case "address":
            record.address = String(fact.value);
            record.addressFactId = fact.id;
            break;
          case "property_type":
            record.propertyType = String(fact.value);
            break;
          case "neighborhood":
            record.neighborhood = String(fact.value);
            break;
          case "distance_km":
            record.distanceKm = numericValue(fact);
            record.distanceKmFactId = fact.id;
            break;
          case "sale_price":
            record.salePrice = numericValue(fact);
            record.salePriceFactId = fact.id;
            break;
          case "adjusted_value":
            record.adjustedValue = numericValue(fact);
            record.adjustedValueFactId = fact.id;
            break;
          case "comparable_probability":
            record.comparableProbability = numericValue(fact);
            record.comparableProbabilityFactId = fact.id;
            break;
          case "match_score":
            record.matchScore = numericValue(fact);
            record.matchScoreFactId = fact.id;
            break;
          case "evidence_weight":
            record.evidenceWeight = numericValue(fact);
            record.evidenceWeightFactId = fact.id;
            break;
          case "source_note":
            record.sourceNote = { value: String(fact.value), factId: fact.id };
            break;
          default:
            if (field.startsWith("reason_")) {
              record.reasons.push({ value: String(fact.value), factId: fact.id });
            }
            if (field.startsWith("caution_")) {
              record.cautions.push({ value: String(fact.value), factId: fact.id });
            }
            break;
        }
      } else if (kind === "adjustment") {
        if (field === "total_adjustment") {
          record.totalAdjustment = { value: numericValue(fact), factId: fact.id };
        } else {
          record.adjustmentLines.push({ value: String(fact.value), factId: fact.id });
        }
      }
      records.set(comparableId, record);
    });
  return Array.from(records.values()).filter((record) => record.address);
}

function selectStrongestComparable(comparables: ComparableInsightRecord[]) {
  return [...comparables].sort((left, right) =>
    (right.evidenceWeight ?? 0) - (left.evidenceWeight ?? 0)
    || (right.comparableProbability ?? 0) - (left.comparableProbability ?? 0)
    || (right.matchScore ?? 0) - (left.matchScore ?? 0)
    || left.comparableId.localeCompare(right.comparableId)
  )[0];
}

function selectWeakestComparable(comparables: ComparableInsightRecord[]) {
  return [...comparables].sort((left, right) =>
    (left.evidenceWeight ?? 1) - (right.evidenceWeight ?? 1)
    || right.cautions.length - left.cautions.length
    || (left.comparableProbability ?? 1) - (right.comparableProbability ?? 1)
    || (right.distanceKm ?? 0) - (left.distanceKm ?? 0)
    || left.comparableId.localeCompare(right.comparableId)
  )[0];
}

function buildFactLookup(facts: RagFact[]): FactLookup {
  const byId = new Map(facts.map((fact) => [fact.id, fact]));
  return {
    lowEstimate: byId.get("valuation:low_estimate"),
    midpointEstimate: byId.get("valuation:midpoint_estimate"),
    highEstimate: byId.get("valuation:high_estimate"),
    confidenceScore: byId.get("valuation:confidence_score"),
    confidenceLabel: byId.get("valuation:confidence_label"),
    valueSpreadPercent: byId.get("valuation:value_spread_percent"),
    effectiveComparableCount: byId.get("valuation:effective_comparable_count"),
    averageComparableProbability: byId.get("valuation:average_comparable_probability"),
    averageSourceReliability: byId.get("valuation:average_source_reliability"),
    sourceCount: byId.get("source_scan:sources_checked"),
    recordsFound: byId.get("source_scan:records_found"),
    comparablesRanked: byId.get("candidate_ranking:comparables_ranked"),
    comparablesSelected: byId.get("source_scan:comparables_selected"),
    dataBoundaryNote: byId.get("source_scan:data_boundary_note"),
    valuationRiskFacts: facts.filter((fact) => fact.id.startsWith("valuation:risk_flag_")),
    limitationFacts: facts.filter((fact) => fact.kind === "limitation")
  };
}

function numericValue(fact?: RagFact) {
  return typeof fact?.value === "number" ? fact.value : 0;
}

function stringValue(fact?: RagFact) {
  return typeof fact?.value === "string" ? fact.value : "";
}

function uniqueStrings(values: string[]) {
  return Array.from(new Set(values.filter(Boolean)));
}

function uniqueRisks(risks: ZrtReviewInsight["keyRisks"]) {
  const seen = new Set<string>();
  return risks.filter((risk) => {
    if (seen.has(risk.risk)) {
      return false;
    }
    seen.add(risk.risk);
    return true;
  });
}

function compactFactIds(values: Array<string | undefined>) {
  return Array.from(new Set(values.filter((value): value is string => Boolean(value))));
}

function clampWordCount(value: string, maxWords: number) {
  const words = value.trim().split(/\s+/).filter(Boolean);
  if (words.length <= maxWords) {
    return value.trim();
  }
  return `${words.slice(0, maxWords).join(" ")}.`;
}

function humanizeVerdict(verdict: ZrtReviewInsight["verdict"]) {
  if (verdict === "usable_with_review") {
    return "usable with review";
  }
  if (verdict === "weak_packet") {
    return "a weak packet";
  }
  return "in analyst review";
}

function findFactId(facts: RagFact[], pattern: string) {
  return facts.find((fact) => fact.id.includes(pattern))?.id;
}
