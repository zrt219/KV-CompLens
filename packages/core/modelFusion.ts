import type { AdjustedComparable, SubjectProperty, ValuationSubModel } from "./types";
import { roundToThousand } from "./adjustments";

export type ModelFusionResult = {
  finalEstimate: number;
  finalVariance: number;
  modelWeights: Array<{
    id: string;
    label: string;
    weight: number;
  }>;
  subModels: ValuationSubModel[];
};

function conditionRank(condition: SubjectProperty["condition"]) {
  return { Poor: 0, Average: 1, Good: 2, Renovated: 3, New: 4 }[condition];
}

export function createValuationSubModels(
  subject: SubjectProperty,
  adjustedComparables: AdjustedComparable[],
  posteriorMean: number,
  posteriorVariance: number,
  weightedAdjustedMean: number
): ValuationSubModel[] {
  const localPpsf = adjustedComparables.length
    ? adjustedComparables.reduce((sum, comp) => sum + comp.salePrice / comp.livingAreaSqft, 0) / adjustedComparables.length
    : (subject.targetPriceHint ?? posteriorMean) / Math.max(1, subject.livingAreaSqft);
  const featureEstimate =
    subject.livingAreaSqft * localPpsf +
    subject.bedrooms * 9000 +
    subject.bathrooms * 6500 +
    conditionRank(subject.condition) * 8500;
  const trendEstimate = adjustedComparables.length
    ? adjustedComparables.reduce((sum, comp) => sum + comp.salePrice + comp.adjustments.time, 0) / adjustedComparables.length
    : posteriorMean;
  const assessmentAnchor = subject.targetPriceHint ?? weightedAdjustedMean;

  return [
    {
      id: "comparable-evidence",
      label: "Primary evidence",
      estimate: roundToThousand(posteriorMean),
      variance: posteriorVariance,
      reliability: 0.9,
      rationale: "Primary estimate from the selected comparables and their review support."
    },
    {
      id: "hedonic-feature",
      label: "Feature check",
      estimate: roundToThousand(featureEstimate),
      variance: Math.pow(85000, 2),
      reliability: 0.58,
      rationale: "Feature-based check from size, beds, baths, and condition."
    },
    {
      id: "market-trend",
      label: "Trend check",
      estimate: roundToThousand(trendEstimate),
      variance: Math.pow(90000, 2),
      reliability: 0.52,
      rationale: "Selected sale evidence adjusted for timing only."
    },
    {
      id: "assessment-anchor",
      label: "Local anchor",
      estimate: roundToThousand(assessmentAnchor),
      variance: Math.pow(95000, 2),
      reliability: 0.5,
      rationale: "Local anchor from the subject price hint or review context."
    }
  ];
}

export function fuseValuationSubModels(subModels: ValuationSubModel[]): ModelFusionResult {
  const rawWeights = subModels.map((model) => model.variance > 0 ? model.reliability / model.variance : 0);
  const totalWeight = rawWeights.reduce((sum, weight) => sum + weight, 0);
  const weights = rawWeights.map((weight) => totalWeight > 0 ? weight / totalWeight : 1 / Math.max(1, subModels.length));
  const finalEstimate = subModels.reduce((sum, model, index) => sum + model.estimate * (weights[index] ?? 0), 0);
  const finalVariance = subModels.reduce((sum, model, index) => {
    const weight = weights[index] ?? 0;
    return sum + weight * (model.variance + Math.pow(model.estimate - finalEstimate, 2));
  }, 0);

  return {
    finalEstimate: roundToThousand(finalEstimate),
    finalVariance,
    modelWeights: subModels.map((model, index) => ({
      id: model.id,
      label: model.label,
      weight: Math.round((weights[index] ?? 0) * 1000) / 1000
    })),
    subModels
  };
}
