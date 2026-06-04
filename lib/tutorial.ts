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
    note: "Use the example property if you want to see the full workflow before entering your own review details."
  },
  {
    id: "run-analysis",
    title: "Run the analysis",
    detail: "Click Run Analysis to move from intake into the source scan. The app stays local and does not export anything yet.",
    note: "The analysis creates a local demo review set from the synthetic home data and keeps the next steps locked until results exist."
  },
  {
    id: "source-scan",
    title: "Check sources",
    detail: "Review the source scan summary before moving into homes. The app keeps source counts and records visible.",
    note: "Use this step to confirm how many demo records were scanned and which source groups need review."
  },
  {
    id: "review-homes",
    title: "Review homes",
    detail: "Check the selected homes, surface a stronger comp if needed, and keep the review set transparent.",
    note: "Use Find More Homes when you want the app to surface another candidate for analyst review."
  },
  {
    id: "confirm-export",
    title: "Confirm and export",
    detail: "Lock the adjustments when the review looks right, then generate the memo and review package from the export screen.",
    note: "Export stays blocked until the analysis has run and the adjustments are confirmed."
  }
];
