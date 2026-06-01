import type { ComparableProperty, SourceType } from "./types";
import { clamp01 } from "./probability";

type Prior = { alpha: number; beta: number; verifiedRecords: number; totalRecords: number };

const SOURCE_PRIORS: Record<SourceType, Prior> = {
  SyntheticRecentSales: { alpha: 8, beta: 3, verifiedRecords: 18, totalRecords: 24 },
  MunicipalAssessment: { alpha: 6, beta: 4, verifiedRecords: 15, totalRecords: 22 },
  ListingStyle: { alpha: 5, beta: 5, verifiedRecords: 12, totalRecords: 22 },
  InternalPriorDeal: { alpha: 9, beta: 2, verifiedRecords: 16, totalRecords: 19 },
  MarketTrend: { alpha: 5, beta: 6, verifiedRecords: 9, totalRecords: 19 }
};

function sourceTypeFor(comp: ComparableProperty): SourceType {
  return comp.sourceType ?? "SyntheticRecentSales";
}

export function sourceReliabilityPrior(sourceType: SourceType) {
  const prior = SOURCE_PRIORS[sourceType];
  return (prior.alpha + prior.verifiedRecords) / (prior.alpha + prior.beta + prior.totalRecords);
}

export function missingDataPenalty(comp: ComparableProperty) {
  const missingCondition = comp.condition ? 0 : 0.05;
  const missingLotSize = comp.lotSizeSqft > 0 ? 0 : 0.04;
  const missingParking = Number.isFinite(comp.parking) && comp.parking >= 0 ? 0 : 0.03;
  const staleFreshness = comp.dataFreshness?.toLowerCase().includes("stale") ? 0.05 : 0;
  return missingCondition + missingLotSize + missingParking + staleFreshness;
}

export function calculateSourceReliability(comp: ComparableProperty) {
  const priorQuality = sourceReliabilityPrior(sourceTypeFor(comp));
  const statedConfidence = comp.sourceConfidence;
  const blended = statedConfidence ? priorQuality * 0.68 + statedConfidence * 0.32 : priorQuality;
  return Math.max(0.35, Math.min(0.98, clamp01(blended - missingDataPenalty(comp))));
}
