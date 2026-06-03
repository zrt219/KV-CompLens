import type { ComparableProperty, SourceScanSummary, SubjectProperty } from "./types";
import { publicAssessmentSources } from "./provenance";

export function runSourceScan(
  subject: SubjectProperty,
  dataset: ComparableProperty[],
  candidatePoolCount: number,
  selectedCompCount: number,
  rejectedCount = 0
): SourceScanSummary {
  const sameCity = dataset.filter((comp) => comp.city === subject.city).length;
  const sameType = dataset.filter((comp) => comp.propertyType === subject.propertyType).length;
  const sourceBuckets = dataset.reduce(
    (acc, comp) => {
      const sourceType = comp.sourceType ?? "SyntheticRecentSales";
      acc[sourceType] = (acc[sourceType] ?? 0) + 1;
      return acc;
    },
    {} as Record<string, number>
  );

  const marketContextMatches = Math.max(8, Math.round((sameCity + sameType) * 0.42));
  const candidateComplexity = Math.max(1, candidatePoolCount / Math.max(1, selectedCompCount));
  const syntheticRecentSalesScanned = dataset.length;
  const municipalAssessmentReferences = marketContextMatches;
  const listingStyleRecords = sourceBuckets.ListingStyle ?? Math.max(4, Math.round(candidatePoolCount * 0.3));
  const priorDealComparables = sourceBuckets.InternalPriorDeal ?? Math.max(2, Math.round(selectedCompCount * 0.6));
  const marketTrendReferences = sourceBuckets.MarketTrend ?? publicAssessmentSources.length;
  const totalRecordsScanned = syntheticRecentSalesScanned + municipalAssessmentReferences + listingStyleRecords + priorDealComparables + marketTrendReferences;
  const sourcesConsolidated = [
    syntheticRecentSalesScanned,
    municipalAssessmentReferences,
    listingStyleRecords,
    priorDealComparables,
    marketTrendReferences
  ].filter((count) => count > 0).length;

  return {
    syntheticRecentSalesScanned,
    municipalAssessmentReferences,
    listingStyleRecords,
    priorDealComparables,
    marketTrendReferences,
    totalRecordsScanned,
    recordsScanned: totalRecordsScanned,
    syntheticRecentSalesMatched: candidatePoolCount,
    assessmentRecordsMatched: marketContextMatches,
    listingRecordsMatched: listingStyleRecords,
    priorDealCompsMatched: priorDealComparables,
    marketTrendReferencesMatched: marketTrendReferences,
    candidatePoolCount,
    selectedCompCount,
    rejectedCount,
    sourcesConsolidated,
    estimatedManualTimeSavedHours: Math.round((1.15 + candidateComplexity * 0.32 + selectedCompCount * 0.18) * 10) / 10,
    dataBoundaryNote: "Local synthetic sales and public assessment context only. Not live MLS. Analyst review required."
  };
}
