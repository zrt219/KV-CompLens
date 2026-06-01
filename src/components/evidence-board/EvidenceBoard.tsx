"use client";

import type { AdjustedComparable, ScoredComparable, SubjectProperty, ValuationRange } from "../../../lib/types";
import { EvidenceBoardCanvas } from "./EvidenceBoardCanvas";
import { EvidenceBoardLegend } from "./EvidenceBoardLegend";
import { EvidenceBoardEmptyState } from "./EvidenceBoardEmptyState";

export type EvidenceBoardProps = {
  subject: SubjectProperty;
  selectedComparables: AdjustedComparable[];
  remainingCandidates: ScoredComparable[];
  activeComparableId?: string;
  newCandidateId?: string;
  valuation: ValuationRange;
  onSelectComparable: (id: string) => void;
  onFindCandidate: () => void;
  onRunAnalysis: () => void;
};

export function EvidenceBoard(props: EvidenceBoardProps) {
  const { selectedComparables, onRunAnalysis } = props;

  return (
    <section className="evidence-board" aria-label="PCE evidence board">
      <div className="evidence-board-head">
        <div>
          <h3>Evidence Board</h3>
          <span>PCE-V2 deterministic comparable evidence</span>
        </div>
        <div className="evidence-board-controls" aria-label="Evidence board display mode">
          <span className="evidence-board-mode">Board</span>
          <button type="button" disabled aria-disabled="true" title="Table mode is not available in this view.">Table</button>
          <EvidenceBoardLegend />
        </div>
      </div>
      {selectedComparables.length ? (
        <EvidenceBoardCanvas {...props} />
      ) : (
        <EvidenceBoardEmptyState subject={props.subject} onRunAnalysis={onRunAnalysis} />
      )}
    </section>
  );
}
