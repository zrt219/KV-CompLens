import { syntheticComparables } from "./data";
import { formatCurrency } from "./format";
import { generateUnderwritingMemo } from "./memo";
import { previewCandidateImpact } from "./marginalImpact";
import { scoreComparableProperties, selectTopComparables } from "./scoring";
import { runSourceScan } from "./sourceScan";
import { compareValuationBeforeAfter, estimateValuationRange } from "./valuation";
import type { CompAnalysisResult, ComparableProperty, ScoredComparable, SubjectProperty } from "./types";

export function createBlankSubjectProperty(): SubjectProperty {
  return {
    address: "",
    city: "",
    province: "AB",
    neighbourhood: "",
    propertyType: "Detached",
    yearBuilt: 0,
    bedrooms: 0,
    bathrooms: 0,
    livingAreaSqft: 0,
    lotSizeSqft: 0,
    parking: 0,
    latitude: 0,
    longitude: 0,
    condition: "Average",
    intendedUse: "",
    analystName: ""
  };
}

export function normalizeSubjectProperty(input: SubjectProperty): SubjectProperty {
  return {
    ...input,
    city: input.city.trim(),
    neighbourhood: input.neighbourhood.trim(),
    livingAreaSqft: Number(input.livingAreaSqft),
    lotSizeSqft: Number(input.lotSizeSqft),
    bedrooms: Number(input.bedrooms),
    bathrooms: Number(input.bathrooms),
    parking: Number(input.parking),
    yearBuilt: Number(input.yearBuilt),
    latitude: Number(input.latitude),
    longitude: Number(input.longitude)
  };
}

export function searchComparableProperties(subject: SubjectProperty, dataset: ComparableProperty[] = syntheticComparables) {
  const sameMarket = dataset.filter((comp) => comp.city === subject.city || comp.propertyType === subject.propertyType);
  return sameMarket.length >= 12 ? sameMarket : dataset;
}

export function selectInitialComparables(ranked: ScoredComparable[], max = 5) {
  return selectTopComparables(ranked, max).map((comp) => ({ ...comp, status: "selected" as const, wasSelected: true }));
}

export function selectBestCandidate(ranked: ScoredComparable[], selectedIds: Iterable<string>, subject?: SubjectProperty, currentSelected: ScoredComparable[] = []) {
  const selected = new Set(selectedIds);
  const available = ranked.filter((comp) => !selected.has(comp.id));
  const candidate = subject && currentSelected.length
    ? available
        .map((comp) => ({ comp, impact: previewCandidateImpact(subject, currentSelected, comp) }))
        .sort((a, b) => b.impact.marginalInformationGain - a.impact.marginalInformationGain || b.comp.totalScore - a.comp.totalScore)[0]?.comp
    : available[0];
  return candidate ? { ...candidate, status: "candidate" as const } : undefined;
}

export function previewCandidateAddition(subject: SubjectProperty, selected: ScoredComparable[], candidate: ScoredComparable) {
  return previewCandidateImpact(subject, selected, candidate);
}

export function runCompAnalysis(input: SubjectProperty, options: { selectedComparableIds?: string[]; previousValuation?: CompAnalysisResult["previousValuation"] } = {}): CompAnalysisResult {
  const subject = normalizeSubjectProperty(input);
  const candidates = searchComparableProperties(subject);
  const rankedComparables = scoreComparableProperties(subject, candidates);
  const selectedIdSet = options.selectedComparableIds?.length ? new Set(options.selectedComparableIds) : undefined;
  const selectedComparables = selectedIdSet
    ? rankedComparables.filter((comp) => selectedIdSet.has(comp.id)).map((comp) => ({ ...comp, status: "selected" as const, wasSelected: true }))
    : selectInitialComparables(rankedComparables);
  const candidateComparable = selectBestCandidate(rankedComparables, selectedComparables.map((comp) => comp.id), subject, selectedComparables);
  const valuation = estimateValuationRange(subject, selectedComparables);
  const candidateImpact = candidateComparable ? previewCandidateAddition(subject, selectedComparables, candidateComparable) : undefined;
  const valuationDelta = options.previousValuation ? compareValuationBeforeAfter(options.previousValuation, valuation) : undefined;
  const rejectedComparables = rankedComparables
    .filter((comp) => !selectedComparables.some((selected) => selected.id === comp.id) && comp.id !== candidateComparable?.id)
    .map((comp) => ({ ...comp, status: "rejected" as const, wasRejected: true, rejectionReason: comp.rejectionReason ?? comp.penalties[0] ?? "Lower-ranked than the homes already selected." }));
  const riskFlags = Array.from(new Set([...valuation.riskFlags, ...valuation.adjustedComparables.flatMap((comp) => comp.riskFlags)]));
  const sourceScanSummary = runSourceScan(subject, candidates, rankedComparables.length, selectedComparables.length, rejectedComparables.length);
  const partial = { subject, sourceScanSummary, rankedComparables, selectedComparables, rejectedComparables, candidateComparable, candidateImpact, previousValuation: options.previousValuation, valuationDelta, valuation, riskFlags };
  return {
    ...partial,
    memo: generateUnderwritingMemo(partial),
    analysisStatus: "complete",
    isZeroState: selectedComparables.length === 0
  };
}

export { formatCurrency };
