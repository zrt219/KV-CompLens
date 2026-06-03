export type TutorialStep = {
  id: string;
  title: string;
  detail: string;
  note: string;
};

export const tutorialIntro = "Use this quick walkthrough if you are seeing KV CompLens for the first time.";

export const tutorialSteps: TutorialStep[] = [
  {
    id: "enter-details",
    title: "Enter property details",
    detail: "Fill in the address, city, location, size, and condition. Blank numeric fields stay blank until you type them.",
    note: "Underwriting Tip: Accurate year-built and condition inputs prevent automatic 'missing data' risk penalties later on."
  },
  {
    id: "run-analysis",
    title: "Run the analysis",
    detail: "Click Run Analysis to move from intake into the source scan. The app stays local and does not export anything yet.",
    note: "The PCE engine processes candidates in real-time, computing an unbiased baseline using the Master Equation."
  },
  {
    id: "source-scan",
    title: "Check sources",
    detail: "Review the source scan summary before moving into homes. The app keeps source counts and records visible.",
    note: "Underwriting Tip: Watch the Effective Comp Count (N_eff). This mathematically measures data diversity; 5 unique comps is better than 10 identical ones."
  },
  {
    id: "review-homes",
    title: "Review homes",
    detail: "Check the selected homes, surface a stronger comp if needed, and keep the review set transparent.",
    note: "Underwriting Tip: Pay attention to the Information Gain when adding a comp. High gain means the comp significantly reduces the conformal risk buffer."
  },
  {
    id: "confirm-export",
    title: "Confirm and export",
    detail: "Lock the adjustments when the review looks right, then generate the memo and review package from the export screen.",
    note: "The final valuation range utilizes Conformal Prediction (q_alpha) to strictly guarantee the coverage of the estimate based on historical residuals."
  }
];
