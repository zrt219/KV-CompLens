import { formatCurrency } from "../format";
import type { PceAnalysisState } from "../../hooks/usePceAnalysis";
import { displayConfidenceLevel, selectActiveAdjustedComparable } from "./pceSelectors";

export type QuickAnswer = {
  question: string;
  answer: string;
  detail: string;
};

export type QuickAnswersViewModel = {
  title: string;
  context: string;
  answers: QuickAnswer[];
};

type QuickAnswerPage = "intake" | "sources" | "review" | "adjust" | "export";

type QuickAnswerOptions = {
  page: QuickAnswerPage;
  canRunAnalysis: boolean;
  adjustmentsLocked: boolean;
  reportPrepared: boolean;
  subjectDirty: boolean;
};

export function selectQuickAnswers(state: PceAnalysisState, options: QuickAnswerOptions): QuickAnswersViewModel {
  const snapshot = state.snapshot;
  const confidence = `${Math.round(snapshot.valuation.confidenceScore)}% ${displayConfidenceLevel(snapshot.valuation.confidenceLevel)}`;
  const selectedComparable = selectActiveAdjustedComparable(state);

  if (!state.analysisStarted || options.page === "intake") {
    return {
      title: "Quick Answers",
      context: options.canRunAnalysis ? "Ready to scan" : "Start here",
      answers: [
        {
          question: "What should I do first?",
          answer: options.canRunAnalysis ? "Run the analysis." : "Complete the required property fields.",
          detail: options.canRunAnalysis
            ? "The app will scan local demo sources, rank comparables, build adjustments, and create a review range."
            : "Use the example property for a fast demo, or enter address, city, neighbourhood, type, year, beds, baths, living area, latitude, and longitude."
        },
        {
          question: "Will a value appear before analysis?",
          answer: "No. Values stay hidden until the source scan runs.",
          detail: "This prevents a user from treating incomplete intake data as a valuation result."
        },
        {
          question: "Is this live MLS or an appraisal?",
          answer: "No. It is local synthetic/public-style demo data.",
          detail: "Every result is review support only, not live MLS data, not an appraisal, and not a credit decision."
        }
      ]
    };
  }

  if (options.page === "sources") {
    return {
      title: "Quick Answers",
      context: "Source scan",
      answers: [
        {
          question: "What did the scan find?",
          answer: `${snapshot.sourceScan.sourcesConsolidated} source groups and ${snapshot.sourceScan.recordsScanned} demo records.`,
          detail: `${snapshot.rankedComparables.length} comparables were ranked and ${snapshot.valuation.includedCompCount} were selected for review.`
        },
        {
          question: "What should I check here?",
          answer: "Source quality, duplicates, and low-quality warnings.",
          detail: "The goal is to verify the input quality before trusting the ranked comparable set."
        },
        {
          question: "Where do I go next?",
          answer: "Review the ranked comparables.",
          detail: "Open Review to inspect why each comparable was selected and whether a stronger comp should replace one."
        }
      ]
    };
  }

  if (options.page === "review") {
    return {
      title: "Quick Answers",
      context: "Comparable review",
      answers: [
        {
          question: "What result matters most right now?",
          answer: `${formatCurrency(snapshot.valuation.lowEstimate)} to ${formatCurrency(snapshot.valuation.highEstimate)}, ${confidence} confidence.`,
          detail: "The range is driven by selected adjusted comparable values. It should be reviewed, not treated as a final appraisal."
        },
        {
          question: "Which comparable is in focus?",
          answer: selectedComparable ? `${selectedComparable.address}, ${Math.round(selectedComparable.comparableProbability * 100)}% comparable probability.` : "No comparable selected yet.",
          detail: selectedComparable
            ? "Use Why this comparable? to inspect its fit, risks, and evidence support."
            : "Select a comparable on the board to review its fit and risk flags."
        },
        {
          question: "What does probability mean?",
          answer: "It is a review signal, not a guarantee.",
          detail: "Comparable probability combines similarity and evidence quality so the analyst can decide what deserves inspection first."
        }
      ]
    };
  }

  if (options.page === "adjust") {
    return {
      title: "Quick Answers",
      context: "Adjustment review",
      answers: [
        {
          question: "What are adjustments doing?",
          answer: "They translate sale prices into adjusted observations.",
          detail: "The app adjusts for time, distance, size, beds/baths, age, condition, lot, parking, and outlier effects."
        },
        {
          question: "Can I remove a weak comparable?",
          answer: "Yes. Exclude it and the review recalculates.",
          detail: "Removing a comparable clears the locked/export state so the final package cannot use stale numbers."
        },
        {
          question: "What has to happen before export?",
          answer: options.adjustmentsLocked ? "Adjustments are locked. Export is available." : "Confirm and lock adjustments.",
          detail: "Export stays gated until the analyst confirms the adjustment table."
        }
      ]
    };
  }

  return {
    title: "Quick Answers",
    context: "Export package",
    answers: [
      {
        question: "What will I receive?",
        answer: "A report package with PDF, DOCX, ZIP, HTML, Markdown, JSON, CSV, and audit fallbacks.",
        detail: "All formats are built from the same canonical ExportPacket so the numbers stay consistent."
      },
      {
        question: "What if PDF or Word fails?",
        answer: "The app keeps going and offers a usable fallback.",
        detail: "PDF falls back to print-ready HTML. DOCX falls back to Word-compatible HTML or RTF. ZIP and copy-report stay available if downloads are blocked."
      },
      {
        question: "Can this be used as an appraisal?",
        answer: "No. It is review support only.",
        detail: "The export states the same boundary in every format: not live MLS, not an appraisal, not a credit decision, and analyst review required."
      }
    ]
  };
}
