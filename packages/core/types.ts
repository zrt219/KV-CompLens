export type PropertyType = "Detached" | "SemiDetached" | "Townhouse" | "Condo";
export type PropertyCondition = "Poor" | "Average" | "Good" | "Renovated" | "New";
export type ComparableStatus = "selected" | "candidate" | "new" | "rejected";
export type SourceType = "SyntheticRecentSales" | "MunicipalAssessment" | "ListingStyle" | "InternalPriorDeal" | "MarketTrend";

export type ComparableProperty = {
  id: string;
  address: string;
  city: string;
  province?: "AB";
  postalCode?: string;
  neighbourhood: string;
  propertyType: PropertyType;
  yearBuilt: number;
  bedrooms: number;
  bathrooms: number;
  livingAreaSqft: number;
  lotSizeSqft: number;
  parking: number;
  saleDate: string;
  salePrice: number;
  pricePerSqft?: number;
  latitude: number;
  longitude: number;
  condition: PropertyCondition;
  sourceName?: string;
  sourceType?: SourceType;
  dataFreshness?: string;
  sourceConfidence?: number;
  status?: ComparableStatus;
  wasSelected?: boolean;
  wasRejected?: boolean;
  rejectionReason?: string;
};

export type SubjectProperty = Omit<ComparableProperty, "id" | "saleDate" | "salePrice"> & {
  id?: string;
  targetPriceHint?: number;
  priorEstimate?: number;
  assessmentAnchor?: number;
  dealName?: string;
  borrowerType?: string;
  underwritingDate?: string;
  targetUnderwritingDate?: string;
  intendedUse?: string;
  analystName?: string;
};

export type ScoreBreakdown = {
  locationScore: number;
  propertyTypeScore: number;
  sizeScore: number;
  bedroomBathroomScore: number;
  saleRecencyScore: number;
  ageConditionScore: number;
  pricePerSqftScore: number;
  sourceReliabilityScore: number;
};

export type GateResult = {
  passed: boolean;
  severity: "pass" | "warn" | "fail";
  reasons: string[];
  penalty: number;
};

export type ScoredComparable = ComparableProperty & {
  totalScore: number;
  rawScore: number;
  breakdown: ScoreBreakdown;
  factorScores: ScoreBreakdown;
  eligibility: GateResult;
  matchReason: string;
  riskFlags: string[];
  penalties: string[];
  distanceKm: number;
  daysSinceSale: number;
  pricePerSqft: number;
  comparableProbability: number;
  comparableProbabilityPercent: number;
  sourceReliability: number;
  missingDataPenalty: number;
  evidenceEnergy: number;
  energyQuality: number;
  energyReasons: string[];
  outlierProbability: number;
  robustZScore: number;
  uncertaintyVariance: number;
  precision: number;
  evidenceWeight: number;
  normalizedEvidenceWeight?: number;
  riskSeverity: number;
  status?: ComparableStatus;
  reasons?: string[];
};

export type AdjustmentLine = {
  key: "time" | "location" | "size" | "bedsBaths" | "age" | "condition" | "lot" | "parking" | "outlier";
  label: string;
  amount: number;
  rationale: string;
  direction: "up" | "down" | "neutral";
  confidence: number;
  reviewType: "automatic" | "analyst-reviewed";
};

export type AdjustmentBreakdown = {
  time: number;
  location: number;
  squareFootage: number;
  bedroomsBathrooms: number;
  age: number;
  condition: number;
  parking: number;
  lotSize: number;
  outlier: number;
  total: number;
};

export type AdjustedComparable = ScoredComparable & {
  adjustedValue: number;
  adjustments: AdjustmentBreakdown;
  adjustmentLines: AdjustmentLine[];
};

export type ValuationRange = {
  lowEstimate: number;
  pointEstimate: number;
  midpointEstimate: number;
  highEstimate: number;
  confidenceScore: number;
  confidenceLevel: "Review Required" | "Low" | "Medium" | "High";
  confidenceRationale: string;
  valueDispersion: number;
  valueSpreadPercent: number;
  rangeWidth: number;
  posteriorMean: number;
  posteriorVariance: number;
  posteriorStd: number;
  weightedAdjustedMean: number;
  weightedP20: number;
  weightedP80: number;
  residualBuffer: number;
  effectiveSampleSize: number;
  evidenceEntropy: number;
  averageComparableProbability: number;
  averageSourceReliability: number;
  averageRecency: number;
  normalizedRiskSeverity: number;
  averageSimilarity: number;
  riskFlags: string[];
  includedCompCount: number;
  adjustedComparables: AdjustedComparable[];
  subModels: ValuationSubModel[];
  modelFusion: ModelFusionResult;
};

export type ValuationDelta = {
  lowDelta: number;
  pointDelta: number;
  highDelta: number;
  confidenceDelta: number;
  compCountDelta: number;
  rangeWidthDelta: number;
  rangeNarrowed: boolean;
  effectiveSampleSizeDelta?: number;
  entropyDelta?: number;
  riskSeverityDelta?: number;
  marginalInformationGain?: number;
};

export type ValuationSubModel = {
  id: string;
  label: string;
  estimate: number;
  variance: number;
  reliability: number;
  rationale: string;
};

export type ModelFusionResult = {
  finalEstimate: number;
  finalVariance: number;
  modelWeights: Array<{
    id: string;
    label: string;
    weight: number;
  }>;
};

export type CandidateImpact = {
  valuation: ValuationRange;
  delta: ValuationDelta;
  beforeValuation: ValuationRange;
  afterValuation: ValuationRange;
  deltaConfidence: number;
  deltaMidpoint: number;
  deltaRangeWidth: number;
  deltaEffectiveSampleSize: number;
  deltaEntropy: number;
  riskChange: number;
  marginalInformationGain: number;
  improvementReasons: string[];
  addedRisks: string[];
};

export type SourceScanSummary = {
  syntheticRecentSalesScanned: number;
  municipalAssessmentReferences: number;
  listingStyleRecords: number;
  priorDealComparables: number;
  marketTrendReferences: number;
  totalRecordsScanned: number;
  recordsScanned: number;
  syntheticRecentSalesMatched: number;
  assessmentRecordsMatched: number;
  listingRecordsMatched: number;
  priorDealCompsMatched: number;
  marketTrendReferencesMatched: number;
  candidatePoolCount: number;
  selectedCompCount: number;
  rejectedCount: number;
  sourcesConsolidated: number;
  estimatedManualTimeSavedHours: number;
  dataBoundaryNote: string;
};

export type CompAnalysisResult = {
  subject: SubjectProperty;
  sourceScanSummary: SourceScanSummary;
  rankedComparables: ScoredComparable[];
  selectedComparables: ScoredComparable[];
  rejectedComparables: ScoredComparable[];
  candidateComparable?: ScoredComparable;
  candidateImpact?: CandidateImpact;
  previousValuation?: ValuationRange;
  valuationDelta?: ValuationDelta;
  valuation: ValuationRange;
  memo: string;
  riskFlags: string[];
};
