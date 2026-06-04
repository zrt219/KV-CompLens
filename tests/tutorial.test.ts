import { describe, expect, it } from "vitest";
import { tutorialIntro, tutorialSteps } from "../lib/tutorial";

describe("tutorial content", () => {
  it("describes the intake-first workflow in plain language", () => {
    expect(tutorialIntro).toContain("first time");
    expect(tutorialSteps).toHaveLength(5);
    expect(tutorialSteps.map((step) => step.title)).toEqual([
      "Enter property details",
      "Run the analysis",
      "Check sources",
      "Review comparables",
      "Confirm and export"
    ]);
    expect(tutorialSteps[0].note).toContain("example property");
    expect(tutorialSteps[1].detail).toContain("Run Analysis");
    expect(tutorialSteps[2].detail).toContain("source scan");
    expect(tutorialSteps[4].note).toContain("Export stays blocked");
  });
});
