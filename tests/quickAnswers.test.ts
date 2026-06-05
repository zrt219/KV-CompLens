import { describe, expect, it } from "vitest";
import { createBlankPceState, createInitialPceState } from "../hooks/usePceAnalysis";
import { syntheticComparables } from "../lib/mockData";
import { selectQuickAnswers } from "../lib/selectors/selectQuickAnswers";
import type { SubjectProperty } from "../lib/types";

const subject: SubjectProperty = {
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
  condition: "Good"
};

describe("selectQuickAnswers", () => {
  it("answers first-run intake questions without showing a fake value", () => {
    const viewModel = selectQuickAnswers(createBlankPceState(), {
      page: "intake",
      canRunAnalysis: false,
      adjustmentsLocked: false,
      reportPrepared: false,
      subjectDirty: false
    });

    expect(viewModel.answers).toHaveLength(3);
    expect(viewModel.answers[0].question).toBe("What should I do first?");
    expect(viewModel.answers.map((answer) => answer.answer).join(" ")).not.toMatch(/\$[0-9]/);
  });

  it("surfaces data-boundary language on every page", () => {
    const state = createInitialPceState(subject, syntheticComparables, "2026-06-04T12:00:00.000Z");
    const pages = ["sources", "review", "adjust", "export"] as const;

    for (const page of pages) {
      const viewModel = selectQuickAnswers(state, {
        page,
        canRunAnalysis: true,
        adjustmentsLocked: page === "export",
        reportPrepared: false,
        subjectDirty: false
      });
      const text = viewModel.answers.map((answer) => `${answer.answer} ${answer.detail}`).join(" ");

      expect(viewModel.answers).toHaveLength(3);
      expect(text).not.toMatch(/Agent Reasoning Trace|chain-of-thought/i);
      expect(text).toMatch(/review|analyst|appraisal|credit|MLS|fallback|source|comparable/i);
    }
  });

  it("explains export resilience in the export page answers", () => {
    const state = createInitialPceState(subject, syntheticComparables, "2026-06-04T12:00:00.000Z");
    const viewModel = selectQuickAnswers(state, {
      page: "export",
      canRunAnalysis: true,
      adjustmentsLocked: true,
      reportPrepared: false,
      subjectDirty: false
    });
    const text = viewModel.answers.map((answer) => `${answer.question} ${answer.answer} ${answer.detail}`).join(" ");

    expect(text).toContain("PDF");
    expect(text).toContain("DOCX");
    expect(text).toContain("ZIP");
    expect(text).toContain("not live MLS");
  });
});
