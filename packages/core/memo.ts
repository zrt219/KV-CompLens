import { formatCurrency } from "./format";
import type { CompAnalysisResult } from "./types";

export function generateUnderwritingMemo(result: Omit<CompAnalysisResult, "memo">): string {
  const selected = result.valuation.adjustedComparables;
  const excluded = result.rankedComparables.filter((comp) => !selected.some((used) => used.id === comp.id)).slice(0, 4);
  const risks = result.riskFlags.length ? result.riskFlags.join("; ") : "No major comp-quality flags in selected set.";
  const compLines = selected
    .map((comp, index) => {
      return `${index + 1}. ${comp.address}, ${comp.city}: score ${comp.totalScore}/100; comparable probability ${comp.comparableProbabilityPercent}%; energy quality ${Math.round(comp.energyQuality * 100)}%; source reliability ${Math.round(comp.sourceReliability * 100)}%; normalized evidence weight ${Math.round((comp.normalizedEvidenceWeight ?? 0) * 100)}%; sale ${formatCurrency(comp.salePrice)}; adjusted observation ${formatCurrency(comp.adjustedValue)}; ${comp.matchReason}.`;
    })
    .join("\n");
  const excludedLines = excluded.length
    ? excluded.map((comp) => `- ${comp.address}: ranked lower because ${comp.riskFlags[0] ?? comp.matchReason}.`).join("\n")
    : "- No lower-ranked candidates remain outside the selected set.";
  const adjustmentAverage = selected.length
    ? Math.round(selected.reduce((sum, comp) => sum + comp.adjustments.total, 0) / selected.length)
    : 0;

  return [
    "Subject Property Summary",
    `${result.subject.address}, ${result.subject.city}, AB is analyzed as a ${result.subject.propertyType} property with ${result.subject.bedrooms} beds, ${result.subject.bathrooms} baths, ${result.subject.livingAreaSqft.toLocaleString()} sqft, ${result.subject.lotSizeSqft.toLocaleString()} sqft lot, ${result.subject.condition.toLowerCase()} condition, and ${result.subject.parking} parking stalls.`,
    "Source Scan Summary",
    `${result.sourceScanSummary.recordsScanned} local demo records scanned; ${result.sourceScanSummary.candidatePoolCount} candidate comps ranked; ${result.sourceScanSummary.selectedCompCount} selected for valuation. ${result.sourceScanSummary.dataBoundaryNote}`,
    "Selected Comparable Sales",
    compLines,
    "Excluded / Lower-Ranked Candidates",
    excludedLines,
    "Adjustment Summary",
    `Adjustments include square footage, beds/baths, age, condition, parking, and lot size. Average total adjustment across selected comps is ${formatCurrency(adjustmentAverage)}.`,
    "PCE-V2 Evidence Reconciliation",
    `PCE-V2 treats subject value as a latent variable and each adjusted comparable sale as uncertain evidence. The valuation path uses comparable probability, evidence energy quality, Bayesian-style source reliability, robust price-per-square-foot outlier checks, precision weighting, effective sample size (${result.valuation.effectiveSampleSize}), evidence balance (${Math.round(result.valuation.evidenceEntropy * 100)}%), and a conformal-style residual buffer (${formatCurrency(result.valuation.residualBuffer)}). Weighted adjusted mean is ${formatCurrency(result.valuation.weightedAdjustedMean)}, posterior midpoint is ${formatCurrency(result.valuation.pointEstimate)}, and diagnostic model-fusion estimate is ${formatCurrency(result.valuation.modelFusion.finalEstimate)}.`,
    "Indicated Value Range",
    `Residual-buffered posterior range: ${formatCurrency(result.valuation.lowEstimate)} to ${formatCurrency(result.valuation.highEstimate)}, with point estimate ${formatCurrency(result.valuation.pointEstimate)}.`,
    "Confidence and Risk Flags",
    `${result.valuation.confidenceScore}% ${result.valuation.confidenceLevel} confidence. ${result.valuation.confidenceRationale} Risk flags: ${risks}`,
    "Analyst Review Notes",
    "This is deterministic underwriting support only. It is not an appraisal, not an automated credit decision, and not live MLS analysis.",
    "Recommended Next Steps",
    "Review the selected comps, confirm adjustment assumptions, verify any real-world source documents, and require analyst approval before relying on the memo in a lending file."
  ].join("\n\n");
}
