import { formatCurrency } from "./agent";
import type { PceAnalysisSnapshot } from "./pce/runPcePipeline";
import type { SubjectProperty } from "./types";

export type AssistantTraceState = "confirmed" | "review" | "ready" | "simulated";

export type AssistantTraceStep = {
  label: string;
  detail: string;
  state: AssistantTraceState;
};

export type AssistantDraft = {
  source: "openai" | "local";
  model: string;
  summary: string;
  recommendation: string;
  question: string;
  trace: AssistantTraceStep[];
  memoBullets: string[];
  missingFields: string[];
};

export type AssistantContext = {
  subject: SubjectProperty;
  snapshot: PceAnalysisSnapshot;
};

export const assistantDraftSchema = {
  type: "object",
  additionalProperties: false,
  properties: {
    source: { type: "string", enum: ["openai", "local"] },
    model: { type: "string" },
    summary: { type: "string" },
    recommendation: { type: "string" },
    question: { type: "string" },
    trace: {
      type: "array",
      minItems: 5,
      maxItems: 6,
      items: {
        type: "object",
        additionalProperties: false,
        properties: {
          label: { type: "string" },
          detail: { type: "string" },
          state: { type: "string", enum: ["confirmed", "review", "ready", "simulated"] }
        },
        required: ["label", "detail", "state"]
      }
    },
    memoBullets: {
      type: "array",
      minItems: 3,
      maxItems: 5,
      items: { type: "string" }
    },
    missingFields: {
      type: "array",
      items: { type: "string" }
    }
  },
  required: ["source", "model", "summary", "recommendation", "question", "trace", "memoBullets", "missingFields"]
} as const;

export function buildAssistantPrompt(context: AssistantContext) {
  const { subject, snapshot } = context;
  const selectedComparables = snapshot.valuation.adjustedComparables.slice(0, 5);
  const auditTrail = snapshot.auditEvents.slice(-4);

  return [
    "You are drafting a concise review-support memo for KV CompLens.",
    "The valuation engine is deterministic. Do not change the value math.",
    "Use the provided facts only. Keep the output structured and plain-English.",
    "Return JSON that matches the supplied schema exactly.",
    "",
    "Subject:",
    `- Address: ${subject.address}, ${subject.city}, ${subject.province ?? "AB"}`,
    `- Property type: ${subject.propertyType}`,
    `- Living area: ${subject.livingAreaSqft} sq ft`,
    `- Beds/Baths: ${subject.bedrooms} / ${subject.bathrooms}`,
    `- Condition: ${subject.condition}`,
    "",
    "Review facts:",
    `- Source scan: ${snapshot.sourceScan.sourcesConsolidated} sources, ${snapshot.sourceScan.recordsScanned} records`,
    `- Selected homes: ${snapshot.valuation.includedCompCount}`,
    `- Value range: ${formatCurrency(snapshot.valuation.lowEstimate)} to ${formatCurrency(snapshot.valuation.highEstimate)}`,
    `- Point estimate: ${formatCurrency(snapshot.valuation.pointEstimate)}`,
    `- Confidence: ${snapshot.valuation.confidenceScore}% ${snapshot.valuation.confidenceLevel}`,
    `- Average match chance: ${Math.round(snapshot.valuation.averageComparableProbability * 100)}%`,
    `- Average source reliability: ${Math.round(snapshot.valuation.averageSourceReliability * 100)}%`,
    `- Effective sample size: ${snapshot.valuation.effectiveSampleSize}`,
    "",
    "Selected homes:",
    ...selectedComparables.map((comp, index) =>
      `${index + 1}. ${comp.address} | sale ${formatCurrency(comp.salePrice)} | adjusted ${formatCurrency(comp.adjustedValue)} | ${comp.distanceKm.toFixed(1)} km | score ${Math.round(comp.totalScore)}`
    ),
    "",
    "Latest audit events:",
    ...auditTrail.map((event) => `- ${event.timestamp} | ${event.type} | ${event.status} | ${event.summary}`),
    "",
    "Memo reminder:",
    "Explain why the selected homes support the range, mention any visible review flags, and keep the final export boundary truthful."
  ].join("\n");
}

export function buildLocalAssistantDraft(context: AssistantContext): AssistantDraft {
  const { subject, snapshot } = context;
  const selectedComparables = snapshot.valuation.adjustedComparables.slice(0, 3);
  const missingFields = buildMissingFieldNotes(subject);
  const model = "LOCAL_FALLBACK";
  const source: AssistantDraft["source"] = "local";
  const summary = snapshot.analysisStatus === "complete"
    ? `Local draft prepared for ${subject.address || "the current property"}. It can summarize ${snapshot.valuation.includedCompCount} homes without changing the deterministic valuation.`
    : "Run the analysis to generate the assistant draft.";
  const recommendation = snapshot.analysisStatus === "complete"
    ? snapshot.valuation.confidenceScore >= 70
      ? "The review set looks ready for export. Keep the deterministic value as the source of truth."
      : "Review the weakest comparable before exporting so the memo can note the unresolved evidence."
    : "Complete the source scan and review set before drafting the memo.";
  const question = missingFields.length
    ? `Confirm the remaining intake fields: ${missingFields.join(", ")}.`
    : "Should the export memo foreground source quality or adjustment rationale?";

  return {
    source,
    model,
    summary,
    recommendation,
    question,
    trace: [
      {
        label: "Goal",
        detail: "Frame the review around a local-only comparable-property memo.",
        state: snapshot.analysisStatus === "complete" ? "confirmed" : "review"
      },
      {
        label: "Retrieve",
        detail: `Load the subject, source scan, and ${snapshot.valuation.includedCompCount} selected homes.`,
        state: snapshot.analysisStatus === "complete" ? "confirmed" : "review"
      },
      {
        label: "Rank",
        detail: `Preserve the deterministic ranking, value range, and ${snapshot.valuation.confidenceScore}% confidence output.`,
        state: snapshot.analysisStatus === "complete" ? "confirmed" : "review"
      },
      {
        label: "Justify",
        detail: selectedComparables.length
          ? `Use ${selectedComparables.map((comp) => comp.address).join(", ")} as the memo anchor points.`
          : "Explain why the current review set is incomplete.",
        state: snapshot.analysisStatus === "complete" ? "ready" : "review"
      },
      {
        label: "Draft",
        detail: "Write a memo-ready summary without changing the valuation engine.",
        state: snapshot.analysisStatus === "complete" ? "ready" : "simulated"
      },
      {
        label: "Export",
        detail: "Package the memo, adjustment notes, and audit log for the final judge handoff.",
        state: snapshot.analysisStatus === "complete" ? "ready" : "simulated"
      }
    ],
    memoBullets: snapshot.analysisStatus === "complete"
      ? [
        `Value range: ${formatCurrency(snapshot.valuation.lowEstimate)} to ${formatCurrency(snapshot.valuation.highEstimate)}.`,
        `Confidence: ${snapshot.valuation.confidenceScore}% ${snapshot.valuation.confidenceLevel}.`,
        selectedComparables.length
          ? `Best anchor: ${selectedComparables[0].address} at ${formatCurrency(selectedComparables[0].adjustedValue)} adjusted value.`
          : "No comparable homes selected yet."
      ]
      : [
        "No assistant memo yet.",
        "Run the analysis to populate the review set.",
        "The deterministic valuation will remain the source of truth."
      ],
    missingFields
  };
}

export function normalizeAssistantDraft(candidate: unknown, fallback: AssistantDraft): AssistantDraft {
  if (!candidate || typeof candidate !== "object") {
    return fallback;
  }

  const value = candidate as Partial<AssistantDraft> & { trace?: unknown; memoBullets?: unknown; missingFields?: unknown };

  return {
    source: value.source === "openai" ? "openai" : fallback.source,
    model: typeof value.model === "string" && value.model.trim() ? value.model.trim() : fallback.model,
    summary: typeof value.summary === "string" && value.summary.trim() ? value.summary.trim() : fallback.summary,
    recommendation: typeof value.recommendation === "string" && value.recommendation.trim() ? value.recommendation.trim() : fallback.recommendation,
    question: typeof value.question === "string" && value.question.trim() ? value.question.trim() : fallback.question,
    trace: normalizeTrace(value.trace, fallback.trace),
    memoBullets: normalizeStringArray(value.memoBullets, fallback.memoBullets),
    missingFields: normalizeStringArray(value.missingFields, fallback.missingFields)
  };
}

export function createAssistantContext(subject: SubjectProperty, snapshot: PceAnalysisSnapshot): AssistantContext {
  return { subject, snapshot };
}

function normalizeTrace(candidate: unknown, fallback: AssistantTraceStep[]): AssistantTraceStep[] {
  if (!Array.isArray(candidate) || candidate.length === 0) {
    return fallback;
  }

  const trace = candidate
    .map((item) => {
      if (!item || typeof item !== "object") {
        return undefined;
      }
      const value = item as Partial<AssistantTraceStep>;
      const state = value.state === "confirmed" || value.state === "review" || value.state === "ready" || value.state === "simulated"
        ? value.state
        : undefined;
      if (!state) return undefined;
      return {
        label: typeof value.label === "string" && value.label.trim() ? value.label.trim() : "Step",
        detail: typeof value.detail === "string" && value.detail.trim() ? value.detail.trim() : "No detail provided.",
        state
      };
    })
    .filter((step): step is AssistantTraceStep => Boolean(step));

  return trace.length ? trace : fallback;
}

function normalizeStringArray(candidate: unknown, fallback: string[]) {
  if (!Array.isArray(candidate)) {
    return fallback;
  }

  const values = candidate
    .filter((item): item is string => typeof item === "string")
    .map((item) => item.trim())
    .filter(Boolean);

  return values.length ? values : fallback;
}

function buildMissingFieldNotes(subject: SubjectProperty) {
  const missing = [
    !subject.address.trim() ? "Address" : undefined,
    !subject.city.trim() ? "City" : undefined,
    !subject.neighbourhood.trim() ? "Neighbourhood" : undefined,
    subject.yearBuilt <= 0 ? "Year built" : undefined,
    subject.bedrooms <= 0 ? "Bedrooms" : undefined,
    subject.bathrooms <= 0 ? "Bathrooms" : undefined,
    subject.livingAreaSqft <= 0 ? "Living area" : undefined,
    subject.latitude === 0 ? "Latitude" : undefined,
    subject.longitude === 0 ? "Longitude" : undefined
  ].filter((item): item is string => Boolean(item));

  return missing.length ? missing : [];
}
