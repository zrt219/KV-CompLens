import { describe, expect, it } from "vitest";
import { createInitialPceState } from "../hooks/usePceAnalysis";
import { syntheticComparables } from "../lib/mockData";
import { selectReviewBoardViewModel } from "../lib/selectors/selectReviewBoardViewModel";
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

describe("selectReviewBoardViewModel", () => {
  it("formats comparable card values for compact review cards", () => {
    const state = createInitialPceState(subject, syntheticComparables, "2026-06-05T12:00:00.000Z");
    const viewModel = selectReviewBoardViewModel({
      subject: state.snapshot.subject,
      valuation: state.snapshot.valuation,
      selectedComparables: state.snapshot.valuation.adjustedComparables,
      activeComparableId: state.activeComparableId,
      maxVisibleComparables: 5
    });
    const firstCard = viewModel.comparableCards[0];

    expect(viewModel.subjectCard.currentEstimateLabel).toMatch(/^\$/);
    expect(firstCard.salePriceLabel).toMatch(/^\$\d+k$/);
    expect(firstCard.adjustedValueLabel).toMatch(/^\$\d+k$/);
    expect(firstCard.probabilityLabel).toMatch(/^\d+%$/);
    expect(firstCard.matchScoreLabel).toMatch(/Match$/);
    expect(firstCard.evidenceStrengthLabel).toMatch(/strength$/);
    expect(firstCard.topReasons.length).toBeGreaterThan(0);
  });

  it("limits visible cards and reports hidden comparables for short viewports", () => {
    const state = createInitialPceState(subject, syntheticComparables, "2026-06-05T12:00:00.000Z");
    const viewModel = selectReviewBoardViewModel({
      subject: state.snapshot.subject,
      valuation: state.snapshot.valuation,
      selectedComparables: state.snapshot.valuation.adjustedComparables,
      activeComparableId: state.activeComparableId,
      maxVisibleComparables: 4
    });

    expect(viewModel.comparableCards).toHaveLength(4);
    expect(viewModel.hiddenComparableCount).toBeGreaterThan(0);
    expect(viewModel.comparableCards.some((card) => card.isActive)).toBe(true);
  });

  it("filters search text without exposing private reasoning terms", () => {
    const state = createInitialPceState(subject, syntheticComparables, "2026-06-05T12:00:00.000Z");
    const viewModel = selectReviewBoardViewModel({
      subject: state.snapshot.subject,
      valuation: state.snapshot.valuation,
      selectedComparables: state.snapshot.valuation.adjustedComparables,
      searchTerm: "Central",
      maxVisibleComparables: 5
    });
    const text = JSON.stringify(viewModel);

    expect(viewModel.comparableCards.length).toBeGreaterThan(0);
    expect(text).not.toMatch(/Agent Reasoning Trace|chain-of-thought/i);
  });
});

