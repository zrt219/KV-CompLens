import { factId, type RagFact, type RagPage } from "./sourceRegistry";
import type { ReviewEvidencePack } from "./buildReviewEvidencePack";

export type ReviewIntent =
  | "review_set_summary"
  | "why_this_comparable"
  | "confidence_rationale"
  | "risk_review"
  | "adjustment_summary"
  | "export_summary"
  | "next_action";

export type RetrievedContext = {
  intent: ReviewIntent;
  facts: RagFact[];
  warnings: string[];
};

type RetrieveReviewContextOptions = {
  focusComparableId?: string;
  page?: RagPage;
};

export function retrieveReviewContext(
  pack: ReviewEvidencePack,
  intent: ReviewIntent,
  options: RetrieveReviewContextOptions = {}
): RetrievedContext {
  const warnings: string[] = [];
  const focusComparableId = options.focusComparableId;
  const relevantComparableIds = focusComparableId
    ? [focusComparableId]
    : pack.selectedComparables.map((comp) => comp.id);

  if (intent === "why_this_comparable" && !focusComparableId) {
    warnings.push("No focus comparable was provided for why_this_comparable.");
  }

  if (intent === "adjustment_summary" && !focusComparableId && pack.adjustments.length > 1) {
    warnings.push("Adjustment summary is using the full selected set because no focus comparable was provided.");
  }

  const factGroups: RagFact[][] = [pack.limitationFacts];

  switch (intent) {
    case "review_set_summary":
      factGroups.push(
        pack.subjectFacts,
        coreSourceFacts(pack),
        coreValuationFacts(pack),
        selectedComparableFacts(pack, relevantComparableIds, {
          includeReasons: true,
          includeCautions: true
        }),
        selectedAdjustmentFacts(pack, relevantComparableIds, { includeLines: false }),
        pack.methodologyFacts
      );
      break;
    case "why_this_comparable":
      factGroups.push(
        pack.subjectFacts,
        coreValuationFacts(pack),
        selectedComparableFacts(pack, relevantComparableIds, {
          includeReasons: true,
          includeCautions: true
        }),
        selectedAdjustmentFacts(pack, relevantComparableIds, { includeLines: true }),
        pack.methodologyFacts
      );
      break;
    case "confidence_rationale":
      factGroups.push(
        coreSourceFacts(pack),
        coreValuationFacts(pack),
        valuationRiskFacts(pack),
        selectedComparableFacts(pack, relevantComparableIds, {
          includeReasons: false,
          includeCautions: true
        })
      );
      break;
    case "risk_review":
      factGroups.push(
        coreValuationFacts(pack),
        valuationRiskFacts(pack),
        selectedComparableFacts(pack, relevantComparableIds, {
          includeReasons: false,
          includeCautions: true
        }),
        selectedAdjustmentFacts(pack, relevantComparableIds, { includeLines: false })
      );
      break;
    case "adjustment_summary":
      factGroups.push(
        coreValuationFacts(pack),
        selectedComparableFacts(pack, relevantComparableIds, {
          includeReasons: false,
          includeCautions: true
        }),
        selectedAdjustmentFacts(pack, relevantComparableIds, { includeLines: true })
      );
      break;
    case "export_summary":
      factGroups.push(
        pack.subjectFacts,
        coreSourceFacts(pack),
        coreValuationFacts(pack),
        selectedComparableFacts(pack, relevantComparableIds, {
          includeReasons: false,
          includeCautions: true
        }),
        selectedAdjustmentFacts(pack, relevantComparableIds, { includeLines: false }),
        pack.auditFacts,
        pack.methodologyFacts
      );
      break;
    case "next_action":
      factGroups.push(
        coreSourceFacts(pack),
        coreValuationFacts(pack),
        valuationRiskFacts(pack),
        selectedComparableFacts(pack, relevantComparableIds, {
          includeReasons: false,
          includeCautions: true
        }),
        pack.auditFacts
      );
      break;
    default:
      break;
  }

  return {
    intent,
    facts: dedupeFacts(factGroups.flat()),
    warnings
  };
}

function coreSourceFacts(pack: ReviewEvidencePack) {
  return pack.sourceFacts.filter((fact) => [
    factId.sourceScan("sources_checked"),
    factId.sourceScan("records_found"),
    factId.sourceScan("public_records_matched"),
    factId.candidateRanking("comparables_ranked"),
    factId.sourceScan("comparables_selected"),
    factId.sourceScan("average_source_reliability"),
    factId.sourceScan("data_boundary_note")
  ].includes(fact.id));
}

function coreValuationFacts(pack: ReviewEvidencePack) {
  return pack.valuationFacts.filter((fact) => [
    factId.valuation("low_estimate"),
    factId.valuation("midpoint_estimate"),
    factId.valuation("high_estimate"),
    factId.valuation("confidence_score"),
    factId.valuation("confidence_label"),
    factId.valuation("value_spread_percent"),
    factId.valuation("effective_comparable_count"),
    factId.valuation("average_comparable_probability"),
    factId.valuation("average_source_reliability")
  ].includes(fact.id));
}

function valuationRiskFacts(pack: ReviewEvidencePack) {
  return pack.valuationFacts.filter((fact) => fact.id.startsWith("valuation:risk_flag_"));
}

function selectedComparableFacts(
  pack: ReviewEvidencePack,
  comparableIds: string[],
  options: { includeReasons: boolean; includeCautions: boolean }
) {
  const allowedPrefixes = comparableIds.map((comparableId) => `comparable:${comparableId}:`);
  return pack.comparableFacts.filter((fact) => {
    if (!allowedPrefixes.some((prefix) => fact.id.startsWith(prefix))) {
      return false;
    }
    if (options.includeReasons && fact.id.includes(":reason_")) {
      return true;
    }
    if (options.includeCautions && fact.id.includes(":caution_")) {
      return true;
    }
    return !fact.id.includes(":reason_") && !fact.id.includes(":caution_");
  });
}

function selectedAdjustmentFacts(
  pack: ReviewEvidencePack,
  comparableIds: string[],
  options: { includeLines: boolean }
) {
  const allowedPrefixes = comparableIds.map((comparableId) => `adjustment:${comparableId}:`);
  return pack.adjustmentFacts.filter((fact) => {
    if (!allowedPrefixes.some((prefix) => fact.id.startsWith(prefix))) {
      return false;
    }
    if (options.includeLines) {
      return true;
    }
    return !fact.id.includes(":line_");
  });
}

function dedupeFacts(facts: RagFact[]) {
  const seen = new Set<string>();
  return facts.filter((fact) => {
    if (seen.has(fact.id)) {
      return false;
    }
    seen.add(fact.id);
    return true;
  });
}
