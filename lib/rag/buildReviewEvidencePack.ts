import type { AdjustedComparable } from "../types";
import type { PceAnalysisSnapshot, PceAuditEvent } from "../pce/runPcePipeline";
import { collectFacts, buildFact, factId, REVIEW_LIMITATIONS, REVIEW_METHODOLOGY, type RagFact } from "./sourceRegistry";

export type ReviewEvidenceComparable = {
  id: string;
  address: string;
  propertyType: string;
  neighborhood?: string;
  distanceKm: number;
  salePrice: number;
  adjustedValue: number;
  comparableProbability: number;
  matchScore: number;
  evidenceWeight: number;
  topReasons: string[];
  topCautions: string[];
  riskFlags: string[];
  sourceNote: string;
};

export type ReviewEvidenceAdjustment = {
  comparableId: string;
  address: string;
  totalAdjustment: number;
  adjustedValue: number;
  lineItems: Array<{
    label: string;
    amount: number;
    rationale: string;
    confidence: number;
  }>;
  largestPositiveAdjustment?: string;
  largestNegativeAdjustment?: string;
  exceptionFlags: string[];
};

export type ReviewEvidencePack = {
  packetId: string;
  generatedAt: string;
  subjectFacts: RagFact[];
  sourceFacts: RagFact[];
  comparableFacts: RagFact[];
  adjustmentFacts: RagFact[];
  valuationFacts: RagFact[];
  auditFacts: RagFact[];
  limitationFacts: RagFact[];
  methodologyFacts: RagFact[];
  facts: RagFact[];
  subject: {
    address: string;
    city: string;
    province: string;
    propertyType: string;
    neighborhood?: string;
    beds: number;
    baths: number;
    livingAreaSqft: number;
    lotSizeSqft?: number;
    yearBuilt?: number;
    condition?: string;
  };
  sourceScan: {
    sourcesChecked: number;
    recordsFound: number;
    publicRecordsMatched: number;
    comparablesRanked: number;
    comparablesSelected: number;
    estimatedTimeSavedHours: number;
    averageSourceReliability: number;
    dataBoundaryNote: string;
  };
  valuation: {
    lowEstimate: number;
    midpointEstimate: number;
    highEstimate: number;
    confidenceScore: number;
    confidenceLabel: string;
    valueSpreadPercent: number;
    effectiveComparableCount: number;
    averageComparableProbability: number;
    averageSourceReliability: number;
    riskFlags: string[];
  };
  selectedComparables: ReviewEvidenceComparable[];
  adjustments: ReviewEvidenceAdjustment[];
  auditEvents: PceAuditEvent[];
  limitations: string[];
};

export function buildReviewEvidencePack(snapshot: PceAnalysisSnapshot): ReviewEvidencePack {
  const selectedComparables = snapshot.valuation.adjustedComparables.map((comp) => toReviewEvidenceComparable(comp));
  const adjustments = snapshot.valuation.adjustedComparables.map((comp) => toReviewEvidenceAdjustment(comp));
  const limitations = [
    ...REVIEW_LIMITATIONS,
    snapshot.sourceScan.dataBoundaryNote || REVIEW_LIMITATIONS[0]
  ];

  const subjectFacts = collectFacts(
    [
      buildFact({
        id: factId.subject("address"),
        kind: "subject",
        label: "Subject address",
        value: snapshot.subject.address,
        sourcePath: "snapshot.subject.address",
        confidence: "high",
        page: "intake"
      }),
      buildFact({
        id: factId.subject("city"),
        kind: "subject",
        label: "Subject city",
        value: snapshot.subject.city,
        sourcePath: "snapshot.subject.city",
        confidence: "high",
        page: "intake"
      }),
      buildFact({
        id: factId.subject("province"),
        kind: "subject",
        label: "Subject province",
        value: snapshot.subject.province ?? "AB",
        sourcePath: "snapshot.subject.province",
        confidence: "high",
        page: "intake"
      }),
      buildFact({
        id: factId.subject("property_type"),
        kind: "subject",
        label: "Subject property type",
        value: snapshot.subject.propertyType,
        sourcePath: "snapshot.subject.propertyType",
        confidence: "high",
        page: "intake"
      }),
      buildFact({
        id: factId.subject("neighborhood"),
        kind: "subject",
        label: "Subject neighborhood",
        value: snapshot.subject.neighbourhood,
        sourcePath: "snapshot.subject.neighbourhood",
        confidence: "high",
        page: "intake"
      }),
      buildFact({
        id: factId.subject("beds"),
        kind: "subject",
        label: "Subject bedrooms",
        value: snapshot.subject.bedrooms,
        sourcePath: "snapshot.subject.bedrooms",
        confidence: "high",
        page: "intake"
      }),
      buildFact({
        id: factId.subject("baths"),
        kind: "subject",
        label: "Subject bathrooms",
        value: snapshot.subject.bathrooms,
        sourcePath: "snapshot.subject.bathrooms",
        confidence: "high",
        page: "intake"
      }),
      buildFact({
        id: factId.subject("living_area_sqft"),
        kind: "subject",
        label: "Subject living area",
        value: snapshot.subject.livingAreaSqft,
        sourcePath: "snapshot.subject.livingAreaSqft",
        confidence: "high",
        page: "intake"
      }),
      buildFact({
        id: factId.subject("lot_size_sqft"),
        kind: "subject",
        label: "Subject lot size",
        value: snapshot.subject.lotSizeSqft,
        sourcePath: "snapshot.subject.lotSizeSqft",
        confidence: "medium",
        page: "intake"
      }),
      buildFact({
        id: factId.subject("year_built"),
        kind: "subject",
        label: "Subject year built",
        value: snapshot.subject.yearBuilt,
        sourcePath: "snapshot.subject.yearBuilt",
        confidence: "medium",
        page: "intake"
      }),
      buildFact({
        id: factId.subject("condition"),
        kind: "subject",
        label: "Subject condition",
        value: snapshot.subject.condition,
        sourcePath: "snapshot.subject.condition",
        confidence: "high",
        page: "intake"
      })
    ]
  );

  const sourceFacts = collectFacts(
    [
      buildFact({
        id: factId.sourceScan("sources_checked"),
        kind: "source_scan",
        label: "Sources checked",
        value: snapshot.sourceScan.sourcesConsolidated,
        sourcePath: "snapshot.sourceScan.sourcesConsolidated",
        confidence: "high",
        page: "sources"
      }),
      buildFact({
        id: factId.sourceScan("records_found"),
        kind: "source_scan",
        label: "Records found",
        value: snapshot.sourceScan.recordsScanned,
        sourcePath: "snapshot.sourceScan.recordsScanned",
        confidence: "high",
        page: "sources"
      }),
      buildFact({
        id: factId.sourceScan("public_records_matched"),
        kind: "source_scan",
        label: "Public records matched",
        value: snapshot.sourceScan.assessmentRecordsMatched + snapshot.sourceScan.syntheticRecentSalesMatched,
        sourcePath: "snapshot.sourceScan.assessmentRecordsMatched",
        confidence: "medium",
        page: "sources"
      }),
      buildFact({
        id: factId.candidateRanking("comparables_ranked"),
        kind: "candidate_ranking",
        label: "Comparables ranked",
        value: snapshot.rankedComparables.length || snapshot.sourceScan.candidatePoolCount,
        sourcePath: "snapshot.rankedComparables.length",
        confidence: "high",
        page: "sources"
      }),
      buildFact({
        id: factId.sourceScan("comparables_selected"),
        kind: "source_scan",
        label: "Comparables selected",
        value: snapshot.valuation.includedCompCount,
        sourcePath: "snapshot.valuation.includedCompCount",
        confidence: "high",
        page: "sources"
      }),
      buildFact({
        id: factId.sourceScan("estimated_time_saved_hours"),
        kind: "source_scan",
        label: "Estimated time saved",
        value: snapshot.sourceScan.estimatedManualTimeSavedHours,
        sourcePath: "snapshot.sourceScan.estimatedManualTimeSavedHours",
        confidence: "medium",
        page: "sources"
      }),
      buildFact({
        id: factId.sourceScan("average_source_reliability"),
        kind: "source_scan",
        label: "Average source reliability",
        value: snapshot.valuation.averageSourceReliability,
        sourcePath: "snapshot.valuation.averageSourceReliability",
        confidence: "medium",
        page: "sources"
      }),
      buildFact({
        id: factId.sourceScan("data_boundary_note"),
        kind: "source_scan",
        label: "Data boundary note",
        value: snapshot.sourceScan.dataBoundaryNote || REVIEW_LIMITATIONS[0],
        sourcePath: "snapshot.sourceScan.dataBoundaryNote",
        confidence: "high",
        page: "sources"
      })
    ]
  );

  const valuationFacts = collectFacts(
    [
      buildFact({
        id: factId.valuation("low_estimate"),
        kind: "valuation",
        label: "Low estimate",
        value: snapshot.valuation.lowEstimate,
        sourcePath: "snapshot.valuation.lowEstimate",
        confidence: "high",
        page: "review"
      }),
      buildFact({
        id: factId.valuation("midpoint_estimate"),
        kind: "valuation",
        label: "Midpoint estimate",
        value: snapshot.valuation.midpointEstimate,
        sourcePath: "snapshot.valuation.midpointEstimate",
        confidence: "high",
        page: "review"
      }),
      buildFact({
        id: factId.valuation("high_estimate"),
        kind: "valuation",
        label: "High estimate",
        value: snapshot.valuation.highEstimate,
        sourcePath: "snapshot.valuation.highEstimate",
        confidence: "high",
        page: "review"
      }),
      buildFact({
        id: factId.valuation("confidence_score"),
        kind: "valuation",
        label: "Confidence score",
        value: snapshot.valuation.confidenceScore,
        sourcePath: "snapshot.valuation.confidenceScore",
        confidence: "high",
        page: "review"
      }),
      buildFact({
        id: factId.valuation("confidence_label"),
        kind: "valuation",
        label: "Confidence label",
        value: snapshot.valuation.confidenceLevel,
        sourcePath: "snapshot.valuation.confidenceLevel",
        confidence: "high",
        page: "review"
      }),
      buildFact({
        id: factId.valuation("value_spread_percent"),
        kind: "valuation",
        label: "Value spread percent",
        value: snapshot.valuation.valueSpreadPercent,
        sourcePath: "snapshot.valuation.valueSpreadPercent",
        confidence: "medium",
        page: "review"
      }),
      buildFact({
        id: factId.valuation("effective_comparable_count"),
        kind: "valuation",
        label: "Effective comparable count",
        value: snapshot.valuation.effectiveSampleSize,
        sourcePath: "snapshot.valuation.effectiveSampleSize",
        confidence: "medium",
        page: "review"
      }),
      buildFact({
        id: factId.valuation("average_comparable_probability"),
        kind: "valuation",
        label: "Average comparable probability",
        value: snapshot.valuation.averageComparableProbability,
        sourcePath: "snapshot.valuation.averageComparableProbability",
        confidence: "medium",
        page: "review"
      }),
      buildFact({
        id: factId.valuation("average_source_reliability"),
        kind: "valuation",
        label: "Average source reliability",
        value: snapshot.valuation.averageSourceReliability,
        sourcePath: "snapshot.valuation.averageSourceReliability",
        confidence: "medium",
        page: "review"
      })
    ]
  );

  snapshot.valuation.riskFlags.forEach((flag, index) => {
    const fact = buildFact({
      id: factId.valuation(`risk_flag_${index}`),
      kind: "valuation",
      label: `Valuation risk flag ${index + 1}`,
      value: flag,
      sourcePath: `snapshot.valuation.riskFlags[${index}]`,
      confidence: "medium",
      page: "review"
    });
    if (fact) {
      valuationFacts.push(fact);
    }
  });

  const comparableFacts: RagFact[] = [];
  const adjustmentFacts: RagFact[] = [];

  snapshot.valuation.adjustedComparables.forEach((comp, index) => {
    const evidenceWeight = normalizeEvidenceWeight(comp);
    collectFacts(
      [
        buildFact({
          id: factId.comparable(comp.id, "address"),
          kind: "selected_comparable",
          label: `${comp.address} address`,
          value: comp.address,
          sourcePath: `snapshot.valuation.adjustedComparables[${index}].address`,
          confidence: "high",
          page: "review"
        }),
        buildFact({
          id: factId.comparable(comp.id, "property_type"),
          kind: "selected_comparable",
          label: `${comp.address} property type`,
          value: comp.propertyType,
          sourcePath: `snapshot.valuation.adjustedComparables[${index}].propertyType`,
          confidence: "high",
          page: "review"
        }),
        buildFact({
          id: factId.comparable(comp.id, "neighborhood"),
          kind: "selected_comparable",
          label: `${comp.address} neighborhood`,
          value: comp.neighbourhood,
          sourcePath: `snapshot.valuation.adjustedComparables[${index}].neighbourhood`,
          confidence: "high",
          page: "review"
        }),
        buildFact({
          id: factId.comparable(comp.id, "distance_km"),
          kind: "selected_comparable",
          label: `${comp.address} distance`,
          value: comp.distanceKm,
          sourcePath: `snapshot.valuation.adjustedComparables[${index}].distanceKm`,
          confidence: "high",
          page: "review"
        }),
        buildFact({
          id: factId.comparable(comp.id, "sale_price"),
          kind: "selected_comparable",
          label: `${comp.address} sale price`,
          value: comp.salePrice,
          sourcePath: `snapshot.valuation.adjustedComparables[${index}].salePrice`,
          confidence: "high",
          page: "review"
        }),
        buildFact({
          id: factId.comparable(comp.id, "adjusted_value"),
          kind: "selected_comparable",
          label: `${comp.address} adjusted value`,
          value: comp.adjustedValue,
          sourcePath: `snapshot.valuation.adjustedComparables[${index}].adjustedValue`,
          confidence: "high",
          page: "review"
        }),
        buildFact({
          id: factId.comparable(comp.id, "comparable_probability"),
          kind: "selected_comparable",
          label: `${comp.address} comparable probability`,
          value: comp.comparableProbability,
          sourcePath: `snapshot.valuation.adjustedComparables[${index}].comparableProbability`,
          confidence: "medium",
          page: "review"
        }),
        buildFact({
          id: factId.comparable(comp.id, "match_score"),
          kind: "selected_comparable",
          label: `${comp.address} match score`,
          value: comp.totalScore,
          sourcePath: `snapshot.valuation.adjustedComparables[${index}].totalScore`,
          confidence: "medium",
          page: "review"
        }),
        buildFact({
          id: factId.comparable(comp.id, "evidence_weight"),
          kind: "selected_comparable",
          label: `${comp.address} evidence weight`,
          value: evidenceWeight,
          sourcePath: `snapshot.valuation.adjustedComparables[${index}].normalizedEvidenceWeight`,
          confidence: "medium",
          page: "review"
        }),
        buildFact({
          id: factId.comparable(comp.id, "source_note"),
          kind: "selected_comparable",
          label: `${comp.address} source note`,
          value: comp.sourceName ?? "Local demo source record",
          sourcePath: `snapshot.valuation.adjustedComparables[${index}].sourceName`,
          confidence: "medium",
          page: "review"
        })
      ]
    ).forEach((fact) => comparableFacts.push(fact));

    (comp.reasons?.length ? comp.reasons : [comp.matchReason])
      .filter(Boolean)
      .slice(0, 3)
      .forEach((reason, reasonIndex) => {
        const fact = buildFact({
          id: factId.comparable(comp.id, `reason_${reasonIndex}`),
          kind: "selected_comparable",
          label: `${comp.address} support reason ${reasonIndex + 1}`,
          value: reason,
          sourcePath: `snapshot.valuation.adjustedComparables[${index}].reasons[${reasonIndex}]`,
          confidence: "medium",
          page: "review"
        });
        if (fact) {
          comparableFacts.push(fact);
        }
      });

    [...comp.penalties, ...comp.riskFlags].filter(Boolean).slice(0, 4).forEach((caution, cautionIndex) => {
      const fact = buildFact({
        id: factId.comparable(comp.id, `caution_${cautionIndex}`),
        kind: "selected_comparable",
        label: `${comp.address} caution ${cautionIndex + 1}`,
        value: caution,
        sourcePath: `snapshot.valuation.adjustedComparables[${index}].penalties[${cautionIndex}]`,
        confidence: "medium",
        page: "review"
      });
      if (fact) {
        comparableFacts.push(fact);
      }
    });

    collectFacts(
      [
        buildFact({
          id: factId.adjustment(comp.id, "total_adjustment"),
          kind: "adjustment",
          label: `${comp.address} total adjustment`,
          value: comp.adjustments.total,
          sourcePath: `snapshot.valuation.adjustedComparables[${index}].adjustments.total`,
          confidence: "high",
          page: "adjust"
        }),
        buildFact({
          id: factId.adjustment(comp.id, "adjusted_value"),
          kind: "adjustment",
          label: `${comp.address} adjusted value`,
          value: comp.adjustedValue,
          sourcePath: `snapshot.valuation.adjustedComparables[${index}].adjustedValue`,
          confidence: "high",
          page: "adjust"
        })
      ]
    ).forEach((fact) => adjustmentFacts.push(fact));

    comp.adjustmentLines.forEach((line, lineIndex) => {
      const fact = buildFact({
        id: factId.adjustment(comp.id, `line_${lineIndex}`),
        kind: "adjustment",
        label: `${comp.address} ${line.label}`,
        value: signedAmount(line.amount),
        sourcePath: `snapshot.valuation.adjustedComparables[${index}].adjustmentLines[${lineIndex}].amount`,
        confidence: line.confidence >= 0.7 ? "high" : "medium",
        page: "adjust"
      });
      if (fact) {
        adjustmentFacts.push(fact);
      }
    });
  });

  const auditFacts = collectFacts(
    snapshot.auditEvents.map((event, index) =>
      buildFact({
        id: factId.audit(`${index}_${event.type}`),
        kind: "audit",
        label: `${event.type.replace(/_/g, " ")} audit event`,
        value: event.summary,
        sourcePath: `snapshot.auditEvents[${index}].summary`,
        confidence: "medium",
        page: "export"
      })
    )
  );

  const limitationFacts = collectFacts(
    limitations.map((limitation, index) =>
      buildFact({
        id: factId.limitation(`${index}`),
        kind: "limitation",
        label: `Limitation ${index + 1}`,
        value: limitation,
        sourcePath: index < REVIEW_LIMITATIONS.length ? `static.limitations[${index}]` : "snapshot.sourceScan.dataBoundaryNote",
        confidence: "high",
        page: "export"
      })
    )
  );

  const methodologyFacts = collectFacts(
    REVIEW_METHODOLOGY.map((statement, index) =>
      buildFact({
        id: factId.methodology(`${index}`),
        kind: "methodology",
        label: `Methodology statement ${index + 1}`,
        value: statement,
        sourcePath: `static.methodology[${index}]`,
        confidence: "high",
        page: "review"
      })
    )
  );

  const facts = collectFacts(
    subjectFacts,
    sourceFacts,
    comparableFacts,
    adjustmentFacts,
    valuationFacts,
    auditFacts,
    limitationFacts,
    methodologyFacts
  );

  return {
    packetId: `review-pack-${snapshot.generatedAt}`,
    generatedAt: snapshot.generatedAt,
    subjectFacts,
    sourceFacts,
    comparableFacts,
    adjustmentFacts,
    valuationFacts,
    auditFacts,
    limitationFacts,
    methodologyFacts,
    facts,
    subject: {
      address: snapshot.subject.address,
      city: snapshot.subject.city,
      province: snapshot.subject.province ?? "AB",
      propertyType: snapshot.subject.propertyType,
      neighborhood: snapshot.subject.neighbourhood,
      beds: snapshot.subject.bedrooms,
      baths: snapshot.subject.bathrooms,
      livingAreaSqft: snapshot.subject.livingAreaSqft,
      lotSizeSqft: snapshot.subject.lotSizeSqft || undefined,
      yearBuilt: snapshot.subject.yearBuilt || undefined,
      condition: snapshot.subject.condition
    },
    sourceScan: {
      sourcesChecked: snapshot.sourceScan.sourcesConsolidated,
      recordsFound: snapshot.sourceScan.recordsScanned,
      publicRecordsMatched: snapshot.sourceScan.assessmentRecordsMatched + snapshot.sourceScan.syntheticRecentSalesMatched,
      comparablesRanked: snapshot.rankedComparables.length || snapshot.sourceScan.candidatePoolCount,
      comparablesSelected: snapshot.valuation.includedCompCount,
      estimatedTimeSavedHours: snapshot.sourceScan.estimatedManualTimeSavedHours,
      averageSourceReliability: snapshot.valuation.averageSourceReliability,
      dataBoundaryNote: snapshot.sourceScan.dataBoundaryNote || REVIEW_LIMITATIONS[0]
    },
    valuation: {
      lowEstimate: snapshot.valuation.lowEstimate,
      midpointEstimate: snapshot.valuation.midpointEstimate,
      highEstimate: snapshot.valuation.highEstimate,
      confidenceScore: snapshot.valuation.confidenceScore,
      confidenceLabel: snapshot.valuation.confidenceLevel,
      valueSpreadPercent: snapshot.valuation.valueSpreadPercent,
      effectiveComparableCount: snapshot.valuation.effectiveSampleSize,
      averageComparableProbability: snapshot.valuation.averageComparableProbability,
      averageSourceReliability: snapshot.valuation.averageSourceReliability,
      riskFlags: snapshot.riskFlags.length ? snapshot.riskFlags : snapshot.valuation.riskFlags
    },
    selectedComparables,
    adjustments,
    auditEvents: snapshot.auditEvents,
    limitations
  };
}

function toReviewEvidenceComparable(comp: AdjustedComparable): ReviewEvidenceComparable {
  return {
    id: comp.id,
    address: comp.address,
    propertyType: comp.propertyType,
    neighborhood: comp.neighbourhood,
    distanceKm: comp.distanceKm,
    salePrice: comp.salePrice,
    adjustedValue: comp.adjustedValue,
    comparableProbability: comp.comparableProbability,
    matchScore: comp.totalScore,
    evidenceWeight: normalizeEvidenceWeight(comp),
    topReasons: (comp.reasons?.length ? comp.reasons : [comp.matchReason]).filter(Boolean).slice(0, 3),
    topCautions: [...comp.penalties, ...comp.riskFlags].filter(Boolean).slice(0, 4),
    riskFlags: comp.riskFlags,
    sourceNote: comp.sourceName
      ? `${comp.sourceName}${comp.dataFreshness ? `, ${comp.dataFreshness}` : ""}.`
      : "Local demo source record. Analyst review required."
  };
}

function toReviewEvidenceAdjustment(comp: AdjustedComparable): ReviewEvidenceAdjustment {
  const largestPositive = findLargestAdjustment(comp, "positive");
  const largestNegative = findLargestAdjustment(comp, "negative");
  return {
    comparableId: comp.id,
    address: comp.address,
    totalAdjustment: comp.adjustments.total,
    adjustedValue: comp.adjustedValue,
    lineItems: comp.adjustmentLines.map((line) => ({
      label: line.label,
      amount: line.amount,
      rationale: line.rationale,
      confidence: line.confidence
    })),
    largestPositiveAdjustment: largestPositive ? `${largestPositive.label} (${signedAmount(largestPositive.amount)})` : undefined,
    largestNegativeAdjustment: largestNegative ? `${largestNegative.label} (${signedAmount(largestNegative.amount)})` : undefined,
    exceptionFlags: Array.from(new Set([...comp.riskFlags, ...comp.penalties.slice(0, 2)]))
  };
}

function findLargestAdjustment(comp: AdjustedComparable, direction: "positive" | "negative") {
  const filtered = comp.adjustmentLines.filter((line) => direction === "positive" ? line.amount > 0 : line.amount < 0);
  if (!filtered.length) {
    return undefined;
  }
  return [...filtered].sort((left, right) => Math.abs(right.amount) - Math.abs(left.amount))[0];
}

function normalizeEvidenceWeight(comp: AdjustedComparable) {
  return Number((comp.normalizedEvidenceWeight ?? comp.evidenceWeight).toFixed(4));
}

function signedAmount(amount: number) {
  const rounded = Math.round(amount);
  return `${rounded >= 0 ? "+" : "-"}$${Math.abs(rounded).toLocaleString()}`;
}
