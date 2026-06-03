import { describe, expect, it } from "vitest";
import { createAssistantContext, buildLocalAssistantDraft, buildAssistantPrompt } from "../lib/assistant";
import { syntheticComparables } from "../lib/mockData";
import { runPcePipeline } from "../lib/pce/runPcePipeline";
import type { SubjectProperty } from "../lib/types";

const subject: SubjectProperty = {
  id: "SUBJ-ASSIST-001",
  address: "12345 109 St NW",
  city: "Edmonton",
  province: "AB",
  postalCode: "T5G 0A0",
  neighbourhood: "Central McDougall",
  propertyType: "Detached",
  yearBuilt: 2014,
  bedrooms: 4,
  bathrooms: 3,
  livingAreaSqft: 2180,
  lotSizeSqft: 5800,
  parking: 2,
  latitude: 53.5828,
  longitude: -113.5082,
  condition: "Good",
  targetPriceHint: 690000,
  underwritingDate: "2026-05-31"
};

const snapshot = runPcePipeline({
  subject,
  candidates: syntheticComparables,
  generatedAt: "2026-06-01T00:00:00.000Z"
});

describe("assistant draft helpers", () => {
  it("builds a local fallback draft with a truthful trace", () => {
    const draft = buildLocalAssistantDraft(createAssistantContext(subject, snapshot));

    expect(draft.source).toBe("local");
    expect(draft.model).toBe("LOCAL_FALLBACK");
    expect(draft.trace.map((step) => step.label)).toEqual([
      "Goal",
      "Retrieve",
      "Rank",
      "Justify",
      "Draft",
      "Export"
    ]);
    expect(draft.memoBullets[0]).toContain("Value range");
    expect(draft.summary).toContain("Local draft prepared");
    expect(draft.question).toContain("source quality");
    expect(draft.missingFields).toHaveLength(0);
  });

  it("builds a prompt that keeps the valuation deterministic", () => {
    const prompt = buildAssistantPrompt(createAssistantContext(subject, snapshot));

    expect(prompt).toContain("Do not change the value math.");
    expect(prompt).toContain("Return JSON that matches the supplied schema exactly.");
    expect(prompt).toContain("Selected homes:");
    expect(prompt).toContain("Latest audit events:");
  });
});
