import { describe, expect, it } from "vitest";
import { dataProvenanceLabel, publicAssessmentSources } from "./provenance";

describe("public assessment provenance", () => {
  it("documents reference-only public sources without claiming MLS sold-data provenance", () => {
    expect(publicAssessmentSources.length).toBeGreaterThanOrEqual(3);
    expect(dataProvenanceLabel.toLowerCase()).toContain("synthetic");
    expect(dataProvenanceLabel.toLowerCase()).toContain("not mls sold data");
    expect(publicAssessmentSources.every((source) => source.caveat.toLowerCase().includes("not"))).toBe(true);
  });
});
