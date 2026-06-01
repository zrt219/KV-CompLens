import { describe, expect, it } from "vitest";
import { fuseValuationSubModels } from "./modelFusion";
import type { ValuationSubModel } from "./types";

describe("model fusion diagnostics", () => {
  it("normalizes reliability over variance weights and returns finite fused estimate", () => {
    const models: ValuationSubModel[] = [
      { id: "a", label: "ComparableEvidenceModel", estimate: 700000, variance: 40000 ** 2, reliability: 0.9, rationale: "test" },
      { id: "b", label: "HedonicFeatureModel", estimate: 650000, variance: 90000 ** 2, reliability: 0.6, rationale: "test" },
      { id: "c", label: "AssessmentAnchorModel", estimate: 690000, variance: 80000 ** 2, reliability: 0.5, rationale: "test" }
    ];
    const fusion = fuseValuationSubModels(models);
    const totalWeight = fusion.modelWeights.reduce((sum, model) => sum + model.weight, 0);

    expect(fusion.finalEstimate).toBeGreaterThan(0);
    expect(fusion.finalVariance).toBeGreaterThan(0);
    expect(totalWeight).toBeCloseTo(1, 2);
    expect(fusion.modelWeights[0].weight).toBeGreaterThan(fusion.modelWeights[1].weight);
  });
});
