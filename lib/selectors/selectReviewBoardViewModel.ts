import { formatCurrency } from "../format";
import type { ReviewEvidencePack } from "../rag/buildReviewEvidencePack";
import { retrieveReviewContext } from "../rag/retrieveReviewContext";
import type { CounterfactualCheck } from "../review-intelligence-v2/types";
import type { AdjustedComparable, PropertyType, ScoredComparable, SubjectProperty, ValuationRange } from "../types";

export type ComparableCardViewModel = {
  id: string;
  rank: number;
  propertyType: string;
  address: string;
  neighborhood: string;
  distanceKm: number;
  distanceLabel: string;
  salePriceLabel: string;
  adjustedValueLabel: string;
  probabilityLabel: string;
  matchScoreLabel: string;
  evidenceStrengthLabel: string;
  imageUrl?: string;
  isSelected: boolean;
  isActive: boolean;
  isNewCandidate?: boolean;
  riskFlags: string[];
  topReason?: string;
  topReasons: string[];
  mainCaution: string;
  adjustmentImpactLabel: string;
  sourceNote: string;
  analystReminder: string;
  searchableText: string;
};

export type SubjectReviewCardViewModel = {
  address: string;
  neighborhood: string;
  propertyType: string;
  currentEstimateLabel: string;
  confidenceLabel: string;
  imageUrl?: string;
};

export type ReviewBoardViewModel = {
  subjectCard: SubjectReviewCardViewModel;
  comparableCards: ComparableCardViewModel[];
  activeComparableId?: string;
  hiddenComparableCount: number;
  boardLegend: Array<{ id: string; label: string }>;
  toast?: { title: string; detail: string };
};

type ReviewBoardSelectorInput = {
  subject: SubjectProperty;
  valuation: ValuationRange;
  selectedComparables: AdjustedComparable[];
  remainingCandidates?: ScoredComparable[];
  activeComparableId?: string;
  newCandidateId?: string;
  counterfactualsByComparableId?: Record<string, CounterfactualCheck | undefined>;
  reviewEvidencePacket?: ReviewEvidencePack;
  searchTerm?: string;
  maxVisibleComparables?: number;
};

type ReviewComparableSource = AdjustedComparable | ScoredComparable;

export function selectReviewBoardViewModel(input: ReviewBoardSelectorInput): ReviewBoardViewModel {
  const sortedSelected = sortComparables(input.selectedComparables);
  const normalizedSearch = input.searchTerm?.trim().toLowerCase() ?? "";
  const filteredSelected = normalizedSearch
    ? sortedSelected.filter((comp) => searchableComparableText(comp).includes(normalizedSearch))
    : sortedSelected;
  const newCandidate = input.newCandidateId && input.remainingCandidates
    ? input.remainingCandidates.find((comp) => comp.id === input.newCandidateId)
    : undefined;
  const compsToDisplay: ReviewComparableSource[] = [...filteredSelected];

  if (newCandidate && !compsToDisplay.some((comp) => comp.id === input.newCandidateId)) {
    compsToDisplay.unshift(newCandidate);
  }

  const activeComparableId = input.activeComparableId ?? compsToDisplay[0]?.id;
  const maxVisibleComparables = input.maxVisibleComparables ?? 5;
  const visibleComps = compsToDisplay.slice(0, maxVisibleComparables);

  return {
    subjectCard: createSubjectReviewCardViewModel(input.subject, input.valuation),
    comparableCards: visibleComps.map((comp, index) => createComparableCardViewModel(comp, {
      rank: index + 1,
      activeComparableId,
      isNewCandidate: comp.id === input.newCandidateId,
      counterfactual: input.counterfactualsByComparableId?.[comp.id],
      reviewEvidencePacket: input.reviewEvidencePacket
    })),
    activeComparableId,
    hiddenComparableCount: Math.max(0, compsToDisplay.length - visibleComps.length),
    boardLegend: [
      { id: "subject", label: "Subject" },
      { id: "selected", label: "Selected comparable" },
      { id: "new", label: "New comparable" }
    ]
  };
}

function createSubjectReviewCardViewModel(subject: SubjectProperty, valuation: ValuationRange): SubjectReviewCardViewModel {
  return {
    address: subject.address,
    neighborhood: subject.neighbourhood,
    propertyType: labelPropertyType(subject.propertyType),
    currentEstimateLabel: formatCurrency(valuation.pointEstimate),
    confidenceLabel: valuation.confidenceLevel,
    imageUrl: imageUrlForProperty(subject.propertyType, subject.address, true)
  };
}

function createComparableCardViewModel(
  comp: ReviewComparableSource,
  options: {
    rank: number;
    activeComparableId?: string;
    isNewCandidate?: boolean;
    counterfactual?: CounterfactualCheck;
    reviewEvidencePacket?: ReviewEvidencePack;
  }
): ComparableCardViewModel {
  const evidenceWeight = Math.round(((comp.normalizedEvidenceWeight ?? comp.evidenceWeight) || 0) * 100);
  const adjustedValue = "adjustedValue" in comp ? comp.adjustedValue : undefined;
  const context = options.reviewEvidencePacket
    ? retrieveReviewContext(options.reviewEvidencePacket, "why_this_comparable", {
        focusComparableId: comp.id,
        page: "review"
      })
    : undefined;
  const topReasons = context
    ? extractContextValues(context.facts, `comparable:${comp.id}:reason_`)
    : (comp.reasons?.length ? comp.reasons : [comp.matchReason]).filter(Boolean).slice(0, 3);
  const cautions = context
    ? extractContextValues(context.facts, `comparable:${comp.id}:caution_`)
    : [...comp.penalties, ...comp.riskFlags].filter(Boolean);
  const adjustmentImpact = context
    ? extractContextAdjustmentImpact(context.facts, comp.id)
    : ("adjustmentLines" in comp ? formatAdjustmentImpact(comp.adjustmentLines) : "Add candidate to calculate adjustments.");
  const sourceNote = context
    ? extractContextSourceNote(context.facts, comp.id)
    : comp.sourceName
      ? `${comp.sourceName}${comp.dataFreshness ? `, ${comp.dataFreshness}` : ""}.`
      : "Local demo source record. Analyst review required.";
  const analystReminder = context?.warnings.length
    ? `${context.warnings[0]} Analyst review required.`
    : options.counterfactual?.interpretation ?? "Use this as review support only. Analyst review required.";

  return {
    id: comp.id,
    rank: options.rank,
    propertyType: labelPropertyType(comp.propertyType),
    address: comp.address,
    neighborhood: comp.neighbourhood,
    distanceKm: comp.distanceKm,
    distanceLabel: `${comp.distanceKm.toFixed(1)} km`,
    salePriceLabel: formatCompactCurrency(comp.salePrice),
    adjustedValueLabel: adjustedValue ? formatCompactCurrency(adjustedValue) : "Pending",
    probabilityLabel: `${Math.round(comp.comparableProbability * 100)}%`,
    matchScoreLabel: `${Math.round(comp.totalScore)} Match`,
    evidenceStrengthLabel: `${evidenceWeight}% strength`,
    imageUrl: imageUrlForProperty(comp.propertyType, comp.address),
    isSelected: !options.isNewCandidate,
    isActive: comp.id === options.activeComparableId,
    isNewCandidate: options.isNewCandidate,
    riskFlags: comp.riskFlags,
    topReason: topReasons[0],
    topReasons,
    mainCaution: cautions[0] ?? "No major caution flagged in the selected packet.",
    adjustmentImpactLabel: adjustmentImpact,
    sourceNote,
    analystReminder,
    searchableText: searchableComparableText(comp)
  };
}

function sortComparables(comps: AdjustedComparable[]) {
  return [...comps].sort((a, b) => {
    const weightDelta = (b.normalizedEvidenceWeight ?? b.evidenceWeight) - (a.normalizedEvidenceWeight ?? a.evidenceWeight);
    return weightDelta || b.totalScore - a.totalScore || a.id.localeCompare(b.id);
  });
}

function searchableComparableText(comp: ReviewComparableSource) {
  return [
    comp.address,
    comp.city,
    comp.neighbourhood,
    comp.propertyType,
    Math.round(comp.totalScore).toString(),
    comp.distanceKm.toFixed(1)
  ].join(" ").toLowerCase();
}

function formatCompactCurrency(value: number) {
  const abs = Math.abs(value);
  const sign = value < 0 ? "-" : "";
  if (abs >= 1_000_000) {
    return `${sign}$${(abs / 1_000_000).toFixed(abs >= 10_000_000 ? 0 : 1)}m`;
  }
  return `${sign}$${Math.round(abs / 1000)}k`;
}

function formatAdjustmentImpact(lines: AdjustedComparable["adjustmentLines"]) {
  if (!lines.length) {
    return "No major line adjustment.";
  }
  const largestLine = [...lines].sort((left, right) => Math.abs(right.amount) - Math.abs(left.amount))[0];
  const direction = largestLine.amount >= 0 ? "+" : "-";
  return `${largestLine.label} ${direction}${formatCompactCurrency(Math.abs(largestLine.amount))}`;
}

function labelPropertyType(propertyType: PropertyType) {
  return propertyType === "SemiDetached" ? "Semi-detached" : propertyType;
}

function imageUrlForProperty(propertyType: PropertyType, seed = "", isSubject = false) {
  const images: Record<PropertyType, string[]> = {
    Detached: ["/property-placeholders/detached-dusk.png", "/property-placeholders/townhome-dusk.png"],
    SemiDetached: ["/property-placeholders/semi-detached-dusk.png", "/property-placeholders/townhome-dusk.png"],
    Townhouse: ["/property-placeholders/townhome-dusk.png", "/property-placeholders/semi-detached-dusk.png"],
    Condo: ["/property-placeholders/condo-dusk.png", "/property-placeholders/townhome-dusk.png"]
  };
  const options = images[propertyType];
  if (isSubject) return options[0];
  const hash = Array.from(seed || propertyType).reduce((sum, char) => sum + char.charCodeAt(0), 0);
  return options[hash % options.length];
}

function extractContextValues(facts: Array<{ id: string; value: string | number | boolean }>, prefix: string) {
  return facts
    .filter((fact) => fact.id.startsWith(prefix))
    .map((fact) => String(fact.value))
    .filter(Boolean)
    .slice(0, 3);
}

function extractContextSourceNote(facts: Array<{ id: string; value: string | number | boolean }>, comparableId: string) {
  return String(
    facts.find((fact) => fact.id === `comparable:${comparableId}:source_note`)?.value
      ?? "Local demo source record. Analyst review required."
  );
}

function extractContextAdjustmentImpact(facts: Array<{ id: string; value: string | number | boolean }>, comparableId: string) {
  const line = facts.find((fact) => fact.id.startsWith(`adjustment:${comparableId}:line_`));
  if (line) {
    return String(line.value);
  }
  const total = facts.find((fact) => fact.id === `adjustment:${comparableId}:total_adjustment`);
  if (typeof total?.value === "number") {
    return `Total adjustment ${total.value >= 0 ? "+" : "-"}$${Math.abs(Math.round(total.value)).toLocaleString()}`;
  }
  return "Adjustment impact pending analyst review.";
}
