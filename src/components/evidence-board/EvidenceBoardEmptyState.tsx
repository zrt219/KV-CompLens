"use client";

import { SearchCheck } from "lucide-react";
import type { SubjectProperty } from "../../../lib/types";
import { PropertyThumbnail } from "../PropertyThumbnail";

type EvidenceBoardEmptyStateProps = {
  subject: SubjectProperty;
  onRunAnalysis: () => void;
};

export function EvidenceBoardEmptyState({ subject, onRunAnalysis }: EvidenceBoardEmptyStateProps) {
  return (
    <div className="evidence-board-empty" role="status" aria-label="Evidence board awaiting analysis">
      <PropertyThumbnail propertyType={subject.propertyType} seed={subject.address} isSubject />
      <div>
        <span className="evidence-card-kicker">
          <SearchCheck size={14} aria-hidden="true" />
          Clean evidence board
        </span>
        <h4>No comparables selected yet</h4>
        <p>{subject.address}, {subject.city} is ready for deterministic comparable selection.</p>
      </div>
      <button className="canvas-find" type="button" onClick={onRunAnalysis}>
        Run analysis
      </button>
    </div>
  );
}
