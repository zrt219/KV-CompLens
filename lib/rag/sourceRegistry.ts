export type RagPage = "intake" | "sources" | "review" | "adjust" | "export";

export type RagSourceKind =
  | "subject"
  | "source_scan"
  | "candidate_ranking"
  | "selected_comparable"
  | "adjustment"
  | "valuation"
  | "review_intelligence"
  | "audit"
  | "limitation"
  | "methodology";

export type RagFact = {
  id: string;
  kind: RagSourceKind;
  label: string;
  value: string | number | boolean;
  sourcePath: string;
  confidence: "high" | "medium" | "low";
  page: RagPage;
};

export const REVIEW_LIMITATIONS = [
  "Synthetic/public-style demo data.",
  "Not live MLS data.",
  "Not an appraisal.",
  "Not a credit decision.",
  "Analyst review required."
] as const;

export const REVIEW_METHODOLOGY = [
  "PCE-V2 computes valuation, confidence, and comparable selection.",
  "Review Intelligence V2 explains verified PCE-V2 evidence only.",
  "No retrieved fact, no claim."
] as const;

export const factId = {
  subject: (field: string) => `subject:${field}`,
  sourceScan: (field: string) => `source_scan:${field}`,
  candidateRanking: (field: string) => `candidate_ranking:${field}`,
  valuation: (field: string) => `valuation:${field}`,
  comparable: (comparableId: string, field: string) => `comparable:${comparableId}:${field}`,
  adjustment: (comparableId: string, field: string) => `adjustment:${comparableId}:${field}`,
  reviewIntelligence: (field: string) => `review_intelligence:${field}`,
  audit: (field: string) => `audit:${field}`,
  limitation: (field: string) => `limitation:${field}`,
  methodology: (field: string) => `methodology:${field}`
};

export function buildFact(
  fact: Omit<RagFact, "value"> & { value: RagFact["value"] | undefined | null }
): RagFact | undefined {
  if (fact.value === undefined || fact.value === null || fact.value === "") {
    return undefined;
  }
  return {
    id: fact.id,
    kind: fact.kind,
    label: fact.label,
    value: fact.value,
    sourcePath: fact.sourcePath,
    confidence: fact.confidence,
    page: fact.page
  };
}

export function collectFacts(...factGroups: Array<Array<RagFact | undefined>>): RagFact[] {
  const facts: RagFact[] = [];
  factGroups.flat().forEach((fact) => {
    if (fact) {
      facts.push(fact);
    }
  });
  return facts;
}
