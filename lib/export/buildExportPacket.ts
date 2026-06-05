import { displayConfidenceLevel } from "../selectors/pceSelectors";
import type { PceAnalysisSnapshot, PceAuditEvent } from "../pce/runPcePipeline";
import { runEvidenceCourt } from "../review-intelligence-v2/runEvidenceCourt";
import type { EvidenceCourtResult } from "../review-intelligence-v2/types";
import type { ReviewIntelligenceAttachment } from "../review-intelligence/types";
import { sanitizeInline } from "./safeText";
import type { ExportPacket } from "./types";

type BuildExportPacketOptions = {
  auditEvents?: PceAuditEvent[];
  includeReviewIntelligence?: boolean;
  reviewIntelligenceResult?: EvidenceCourtResult;
  reviewIntelligenceAttachment?: ReviewIntelligenceAttachment;
  preparedFor?: string;
  preparedBy?: string;
  dataMode?: "local-demo" | "production";
};

const REQUIRED_LIMITATIONS = [
  "Review support only.",
  "Not an appraisal.",
  "Not a credit decision.",
  "Not live MLS data.",
  "Synthetic/public-style demo data.",
  "Analyst review required."
];

export function buildExportPacket(snapshot: PceAnalysisSnapshot, options: BuildExportPacketOptions = {}): ExportPacket {
  if (snapshot.analysisStatus !== "complete" || snapshot.isZeroState) {
    throw new Error("Analysis must run before building an export packet.");
  }

  const auditEvents = options.auditEvents ?? snapshot.auditEvents;
  const attachedInsight = options.reviewIntelligenceAttachment?.insight;
  const attachedSource = options.reviewIntelligenceAttachment?.source;
  const reviewIntelligenceResult = options.includeReviewIntelligence && !options.reviewIntelligenceAttachment
    ? options.reviewIntelligenceResult ?? runEvidenceCourt(snapshot)
    : undefined;
  const subject = snapshot.subject;
  const fileBaseName = [
    "kv-complens",
    slugAddress(subject.address),
    "review-package",
    snapshot.generatedAt.slice(0, 10)
  ].filter(Boolean).join("-");

  return {
    meta: {
      reportId: `kv-${slugAddress(subject.address)}-${snapshot.generatedAt.slice(0, 10)}`,
      generatedAt: snapshot.generatedAt,
      fileBaseName,
      appName: "KV CompLens",
      reportTitle: "KV CompLens Review Package",
      preparedFor: options.preparedFor,
      preparedBy: options.preparedBy ?? subject.analystName,
      dataMode: options.dataMode ?? "local-demo"
    },
    subject: {
      address: subject.address,
      city: subject.city,
      province: subject.province ?? "AB",
      propertyType: subject.propertyType,
      neighborhood: subject.neighbourhood,
      beds: subject.bedrooms,
      baths: subject.bathrooms,
      livingAreaSqft: subject.livingAreaSqft,
      lotSizeSqft: subject.lotSizeSqft || undefined,
      yearBuilt: subject.yearBuilt || undefined,
      condition: subject.condition
    },
    valuation: {
      lowEstimate: snapshot.valuation.lowEstimate,
      midpointEstimate: snapshot.valuation.pointEstimate || snapshot.valuation.midpointEstimate,
      highEstimate: snapshot.valuation.highEstimate,
      confidenceScore: snapshot.valuation.confidenceScore,
      confidenceLabel: displayConfidenceLevel(snapshot.valuation.confidenceLevel),
      valueSpreadPercent: snapshot.valuation.valueSpreadPercent,
      effectiveComparableCount: snapshot.valuation.effectiveSampleSize,
      riskFlags: uniqueStrings([...snapshot.riskFlags, ...snapshot.valuation.riskFlags])
    },
    sourceScan: {
      sourcesChecked: snapshot.sourceScan.sourcesConsolidated,
      recordsFound: snapshot.sourceScan.recordsScanned || snapshot.sourceScan.totalRecordsScanned,
      publicRecordsMatched: snapshot.sourceScan.assessmentRecordsMatched + snapshot.sourceScan.syntheticRecentSalesMatched,
      comparablesRanked: snapshot.rankedComparables.length || snapshot.sourceScan.candidatePoolCount,
      comparablesSelected: snapshot.valuation.includedCompCount,
      estimatedTimeSavedHours: snapshot.sourceScan.estimatedManualTimeSavedHours,
      dataBoundaryNote: snapshot.sourceScan.dataBoundaryNote || "Synthetic/public-style demo data."
    },
    comparables: snapshot.valuation.adjustedComparables.map((comp, index) => ({
      rank: index + 1,
      id: comp.id,
      address: comp.address,
      neighborhood: comp.neighbourhood,
      distanceKm: comp.distanceKm,
      salePrice: comp.salePrice,
      adjustedValue: comp.adjustedValue,
      matchScore: Math.round(comp.totalScore),
      comparableProbability: Math.round(comp.comparableProbability * 100),
      evidenceWeight: Math.round((comp.normalizedEvidenceWeight ?? comp.evidenceWeight) * 100),
      included: true,
      riskFlags: comp.riskFlags
    })),
    adjustments: snapshot.valuation.adjustedComparables.map((comp) => ({
      comparableId: comp.id,
      address: comp.address,
      totalAdjustment: comp.adjustments.total,
      adjustedValue: comp.adjustedValue,
      lineItems: comp.adjustmentLines.map((line) => ({
        label: line.label,
        amount: line.amount,
        rationale: line.rationale
      }))
    })),
    reviewIntelligence: attachedInsight ? {
      title: attachedInsight.title,
      verdict: verdictLabelFromCode(attachedInsight.verdict),
      strongestComparable: attachedInsight.strongestComparable?.address ?? "Unavailable",
      weakestComparable: attachedInsight.weakestComparable?.address ?? "Unavailable",
      confidenceRationale: attachedInsight.confidenceRationale.explanation,
      memoReadySummary: attachedInsight.memoReadySummary,
      limitations: attachedInsight.limitations,
      verificationStatus: options.reviewIntelligenceAttachment?.verification.ok ? "verified" : "review",
      source: attachedSource ?? "deterministic"
    } : reviewIntelligenceResult ? {
      title: reviewIntelligenceResult.title,
      verdict: reviewIntelligenceResult.verdict.label,
      strongestComparable: reviewIntelligenceResult.strongestComparable?.address ?? "Unavailable",
      weakestComparable: reviewIntelligenceResult.weakestSelectedComparable?.address ?? "Unavailable",
      confidenceRationale: reviewIntelligenceResult.insight.confidenceRationale.explanation,
      memoReadySummary: reviewIntelligenceResult.memoReadySummary,
      limitations: reviewIntelligenceResult.limitations,
      verificationStatus: reviewIntelligenceResult.verification.ok ? "verified" : "review",
      source: reviewIntelligenceResult.source
    } : undefined,
    auditEvents: auditEvents.map((event) => ({
      timestamp: event.timestamp,
      action: event.type,
      summary: event.summary,
      actor: event.source
    })),
    limitations: uniqueStrings([
      ...REQUIRED_LIMITATIONS,
      snapshot.sourceScan.dataBoundaryNote,
      ...(attachedInsight?.limitations ?? []),
      ...(reviewIntelligenceResult?.limitations ?? [])
    ])
  };
}

function slugAddress(value: string) {
  return sanitizeInline(value)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .replace(/-+/g, "-");
}

function uniqueStrings(values: string[]) {
  return Array.from(new Set(values.map(sanitizeInline).filter(Boolean)));
}

function verdictLabelFromCode(value: "usable_with_review" | "needs_review" | "weak_packet") {
  if (value === "usable_with_review") {
    return "Review set is usable";
  }
  if (value === "weak_packet") {
    return "Review set is weak";
  }
  return "Review set needs analyst review";
}
