import type { ReviewInsightSource } from "../review-intelligence/types";

export type ExportFormat = "pdf" | "docx" | "html" | "rtf" | "zip" | "json" | "csv" | "markdown";

export type ExportPacket = {
  meta: {
    reportId: string;
    generatedAt: string;
    fileBaseName: string;
    appName: "KV CompLens";
    reportTitle: string;
    preparedFor?: string;
    preparedBy?: string;
    dataMode: "local-demo" | "production";
  };
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
  valuation: {
    lowEstimate: number;
    midpointEstimate: number;
    highEstimate: number;
    confidenceScore: number;
    confidenceLabel: string;
    valueSpreadPercent?: number;
    effectiveComparableCount?: number;
    riskFlags: string[];
  };
  sourceScan: {
    sourcesChecked: number;
    recordsFound?: number;
    publicRecordsMatched?: number;
    comparablesRanked?: number;
    comparablesSelected: number;
    estimatedTimeSavedHours?: number;
    dataBoundaryNote: string;
  };
  comparables: Array<{
    rank: number;
    id: string;
    address: string;
    neighborhood?: string;
    distanceKm: number;
    salePrice: number;
    adjustedValue: number;
    matchScore: number;
    comparableProbability: number;
    evidenceWeight?: number;
    included: boolean;
    riskFlags: string[];
  }>;
  adjustments: Array<{
    comparableId: string;
    address: string;
    totalAdjustment: number;
    adjustedValue: number;
    lineItems: Array<{
      label: string;
      amount: number;
      rationale: string;
    }>;
  }>;
  reviewIntelligence?: {
    title: string;
    verdict: string;
    strongestComparable: string;
    weakestComparable: string;
    confidenceRationale: string;
    memoReadySummary: string;
    limitations: string[];
    verificationStatus: string;
    source: ReviewInsightSource;
  };
  auditEvents: Array<{
    timestamp: string;
    action: string;
    summary: string;
    actor: string;
  }>;
  limitations: string[];
};

export type ExportResult = {
  ok: boolean;
  format: ExportFormat;
  method: string;
  filename?: string;
  error?: string;
};

export type ExportOptions = {
  requested: Array<"pdf" | "docx" | "html" | "rtf" | "zip" | "csv" | "json">;
  includeFallbacks: boolean;
  simulate?: {
    failPdf?: boolean;
    failDocx?: boolean;
    failDownloads?: boolean;
  };
  onProgress?: (message: string) => void;
};

export type ExportRunResult = {
  ok: boolean;
  requested: string[];
  completed: ExportResult[];
  failed: ExportResult[];
  fallbackUsed: boolean;
  recommendedNextAction: "none" | "open-print-view" | "download-zip-package" | "retry";
};
