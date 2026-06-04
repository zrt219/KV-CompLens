import { formatCurrency } from "./format";
import type { CompAnalysisResult } from "./types";

export function generateUnderwritingMemo(result: Omit<CompAnalysisResult, "memo">): string {
  const selected = result.valuation.adjustedComparables;
  const excluded = result.rankedComparables.filter((comp) => !selected.some((used) => used.id === comp.id)).slice(0, 4);
  const risks = result.riskFlags.length ? result.riskFlags.join("; ") : "No major review flags in the selected comparables.";
  const compLines = selected
    .map((comp, index) => {
      return `${index + 1}. ${comp.address}, ${comp.city}: score ${comp.totalScore}/100; comparable probability ${comp.comparableProbabilityPercent}%; evidence quality ${Math.round(comp.energyQuality * 100)}%; source reliability ${Math.round(comp.sourceReliability * 100)}%; evidence weight ${Math.round((comp.normalizedEvidenceWeight ?? 0) * 100)}%; sale ${formatCurrency(comp.salePrice)}; adjusted observation ${formatCurrency(comp.adjustedValue)}; ${comp.matchReason}.`;
    })
    .join("\n");
  const excludedLines = excluded.length
    ? excluded.map((comp) => `- ${comp.address}: ranked lower because ${comp.riskFlags[0] ?? comp.matchReason}.`).join("\n")
    : "- No lower-ranked comparables remain outside the review set.";
  const adjustmentAverage = selected.length
    ? Math.round(selected.reduce((sum, comp) => sum + comp.adjustments.total, 0) / selected.length)
    : 0;

  return [
    "Subject Details",
    `${result.subject.address}, ${result.subject.city}, AB is analyzed as a ${result.subject.propertyType} property with ${result.subject.bedrooms} beds, ${result.subject.bathrooms} baths, ${result.subject.livingAreaSqft.toLocaleString()} sqft, ${result.subject.lotSizeSqft.toLocaleString()} sqft lot, ${result.subject.condition.toLowerCase()} condition, and ${result.subject.parking} parking stalls.`,
    "Review Set",
    `${result.sourceScanSummary.recordsScanned} local demo records scanned; ${result.sourceScanSummary.candidatePoolCount} comparable candidates ranked; ${result.sourceScanSummary.selectedCompCount} selected for review. ${result.sourceScanSummary.dataBoundaryNote}`,
    "Selected Comparables",
    compLines,
    "Comparables Not Selected",
    excludedLines,
    "Adjustment Summary",
    `Adjustments cover square footage, beds/baths, age, condition, parking, and lot size. Average total adjustment across the selected comparables is ${formatCurrency(adjustmentAverage)}.`,
    "Review Summary",
    `The estimate combines the selected comparables, their source quality, sale timing, and a buffer for comparables that vary more widely. Review depth is ${result.valuation.effectiveSampleSize}. Evidence mix is ${Math.round(result.valuation.evidenceEntropy * 100)}%. System estimate is ${formatCurrency(result.valuation.modelFusion.finalEstimate)}.`,
    "Method Note",
    "Cross-platform evidence model. Proprietary methods are not disclosed.",
    "Indicated Value Range",
    `Final range: ${formatCurrency(result.valuation.lowEstimate)} to ${formatCurrency(result.valuation.highEstimate)}, with point estimate ${formatCurrency(result.valuation.pointEstimate)}.`,
    "Confidence and Risk Flags",
    `${result.valuation.confidenceScore}% ${result.valuation.confidenceLevel} confidence. ${result.valuation.confidenceRationale} Risk flags: ${risks}`,
    "Analyst Review Notes",
    "This is deterministic review support only. It is not an appraisal, not an automated credit decision, and not live MLS analysis.",
    "Recommended Next Steps",
    "Review the selected comparables, confirm adjustment assumptions, verify any real-world source documents, and require analyst approval before relying on the memo in a lending file."
  ].join("\n\n");
}
