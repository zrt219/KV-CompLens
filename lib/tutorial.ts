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
    note: "The example property is optional and only appears if you choose it."
  },
  {
    id: "run-analysis",
    title: "Run the analysis",
    detail: "Click Run Analysis to move from intake into the source scan. The app stays local and does not export anything yet.",
    note: "The button stays disabled until the required details are complete."
  },
  {
    id: "source-scan",
    title: "Check sources",
    detail: "Review the source scan summary before moving into homes. The app keeps source counts and records visible.",
    note: "The source scan is a separate step from home review."
  },
  {
    id: "review-homes",
    title: "Review homes",
    detail: "Check the selected homes, surface a stronger comp if needed, and keep the review set transparent.",
    note: "You can find more homes if you want a wider review set."
  },
  {
    id: "confirm-export",
    title: "Confirm and export",
    detail: "Lock the adjustments when the review looks right, then generate the memo and review package from the export screen.",
    note: "Export stays blocked until the review is ready."
  }
];
