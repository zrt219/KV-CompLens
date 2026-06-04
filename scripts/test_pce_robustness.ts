import { rankComparables, selectTopComparables } from "../packages/core/scoring";
import { estimateValuationRange } from "../packages/core/valuation";
import { defaultMockSubject, syntheticComparables } from "../lib/mockData";
import type { SubjectProperty, ComparableProperty } from "../packages/core/types";

function runRobustnessTest() {
  console.log("Starting 36-iteration PCE robustness test...");
  
  let passed = 0;
  let failed = 0;

  for (let i = 0; i < 36; i++) {
    try {
      // Create a slightly randomized subject for this iteration
      const subject: SubjectProperty = {
        ...defaultMockSubject,
        livingAreaSqft: defaultMockSubject.livingAreaSqft * (0.8 + Math.random() * 0.4),
        yearBuilt: Math.round(defaultMockSubject.yearBuilt - 10 + Math.random() * 20),
        bedrooms: Math.round(Math.random() * 3) + 2,
        bathrooms: Math.round(Math.random() * 2) + 1,
      };

      // Randomize candidate pool slightly
      const pool: ComparableProperty[] = syntheticComparables.map(comp => ({
        ...comp,
        salePrice: comp.salePrice * (0.9 + Math.random() * 0.2),
        livingAreaSqft: comp.livingAreaSqft * (0.9 + Math.random() * 0.2),
        saleDate: new Date(Date.now() - Math.random() * 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
      }));

      // 1. Rank and score
      const ranked = rankComparables(subject, pool);
      
      // 2. Select Top Comps (e.g., 5)
      const selected = selectTopComparables(ranked, 5);
      
      // 3. Estimate Valuation
      const valuation = estimateValuationRange(subject, selected);
      
      // Verification
      if (Number.isNaN(valuation.pointEstimate) || Number.isNaN(valuation.lowEstimate) || Number.isNaN(valuation.highEstimate)) {
        throw new Error(`NaN encountered in valuation! Midpoint: ${valuation.pointEstimate}`);
      }
      
      if (valuation.lowEstimate > valuation.highEstimate) {
        throw new Error(`Invalid range: Low ${valuation.lowEstimate} > High ${valuation.highEstimate}`);
      }

      if (Number.isNaN(valuation.effectiveSampleSize)) {
        throw new Error("NaN encountered in effectiveSampleSize");
      }

      if (Number.isNaN(valuation.confidenceScore)) {
        throw new Error("NaN encountered in confidenceScore");
      }

      passed++;
    } catch (e) {
      console.error(`Iteration ${i + 1} failed:`, e);
      failed++;
    }
  }

  console.log(`\nTest Complete: ${passed} passed, ${failed} failed.`);
  if (failed > 0) {
    process.exit(1);
  }
}

runRobustnessTest();
