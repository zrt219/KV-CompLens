"use client";

import { useEffect, useState } from "react";
import type { CSSProperties } from "react";
import clsx from "clsx";
import { Home } from "lucide-react";
import { ComparableCard } from "../../../components/review/ComparableCard";
import { SubjectReviewCard } from "../../../components/review/SubjectReviewCard";
import { selectReviewBoardViewModel } from "../../../lib/selectors/selectReviewBoardViewModel";
import type { EvidenceBoardFocus, EvidenceBoardProps } from "./EvidenceBoard";
import { EvidenceLinkLayer, type EvidenceLinkSlot } from "./EvidenceLinkLayer";

const compactSlots: EvidenceLinkSlot[] = ["top-left", "bottom-left", "top-right", "bottom-right"];
const fullSlots: EvidenceLinkSlot[] = ["top-left", "mid-left", "bottom-left", "top-right", "bottom-right"];

export function EvidenceBoardCanvas({
  subject,
  selectedComparables,
  remainingCandidates,
  activeComparableId,
  newCandidateId,
  valuation,
  reviewEvidencePacket,
  counterfactualsByComparableId,
  onSelectComparable,
  onAddCandidate,
  autoArrange = true,
  zoomLevel = 100,
  legendFocus = "all"
}: EvidenceBoardProps & { autoArrange?: boolean; zoomLevel?: number; legendFocus?: EvidenceBoardFocus }) {
  const [searchTerm, setSearchTerm] = useState("");
  const [compactBoard, setCompactBoard] = useState(false);

  useEffect(() => {
    function updateBoardDensity() {
      setCompactBoard(window.innerHeight < 940);
    }

    updateBoardDensity();
    window.addEventListener("resize", updateBoardDensity);
    return () => window.removeEventListener("resize", updateBoardDensity);
  }, []);

  const reviewBoard = selectReviewBoardViewModel({
    subject,
    valuation,
    selectedComparables,
    remainingCandidates,
    activeComparableId,
    newCandidateId,
    reviewEvidencePacket,
    counterfactualsByComparableId,
    searchTerm,
    maxVisibleComparables: compactBoard ? 4 : 5
  });
  const slots = compactBoard ? compactSlots : fullSlots;
  const activeId = reviewBoard.activeComparableId;
  const subjectFocusActive = legendFocus === "subject";
  const selectedFocusActive = legendFocus === "selected";
  const newFocusActive = legendFocus === "new";

  return (
    <div className="evidence-board-canvas" aria-label="Comparable evidence board" data-legend-focus={legendFocus}>
      <div className="evidence-board-actions">
        <label className="evidence-search">
          <span>Filter selected comparables</span>
          <input
            type="search"
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
            placeholder="Address, neighbourhood, score"
            aria-label="Filter selected comparables by address, neighbourhood, or score"
          />
        </label>
        <span className="evidence-subject-filter" title="Board anchored to the subject property">
          <Home size={14} aria-hidden="true" />
          Subject anchor
        </span>
      </div>
      <div
        className={clsx("evidence-board-map", !autoArrange && "manual-layout")}
        style={{ "--board-zoom": String(zoomLevel / 100) } as CSSProperties}
      >
        <EvidenceLinkLayer
          comps={reviewBoard.comparableCards.map((card, index) => ({ id: card.id, slot: slots[index] }))}
          activeComparableId={activeId}
          newCandidateId={newCandidateId}
        />
        <div className={clsx("evidence-subject-slot", subjectFocusActive && "focused", legendFocus !== "all" && !subjectFocusActive && "muted")}>
          <SubjectReviewCard card={reviewBoard.subjectCard} />
        </div>
        {reviewBoard.comparableCards.length ? reviewBoard.comparableCards.map((card, index) => (
          <div
            className={clsx(
              "evidence-comp-slot",
              `slot-${slots[index]}`,
              (selectedFocusActive || (newFocusActive && newCandidateId === card.id)) && "focused",
              legendFocus === "subject" && "muted",
              newFocusActive && newCandidateId !== card.id && "muted"
            )}
            key={card.id}
          >
            <ComparableCard
              card={card}
              onSelect={() => onSelectComparable(card.id)}
              onAddCandidate={card.isNewCandidate ? onAddCandidate : undefined}
            />
          </div>
        )) : (
          <div className="evidence-empty-state evidence-search-empty">
            No selected comparables match <strong>{searchTerm}</strong>.
          </div>
        )}
        {reviewBoard.hiddenComparableCount > 0 && (
          <div className="evidence-more-pill">
            +{reviewBoard.hiddenComparableCount} comparable{reviewBoard.hiddenComparableCount === 1 ? "" : "s"}
          </div>
        )}
      </div>
    </div>
  );
}
