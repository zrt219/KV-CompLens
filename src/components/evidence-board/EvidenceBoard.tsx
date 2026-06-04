"use client";

import { useState } from "react";
import clsx from "clsx";
import { Minus, Plus, Search } from "lucide-react";
import { formatCurrency } from "../../../lib/agent";
import type { AdjustedComparable, ScoredComparable, SubjectProperty, ValuationRange } from "../../../lib/types";
import type { CounterfactualCheck } from "../../../lib/review-intelligence-v2/types";
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
  counterfactualsByComparableId?: Record<string, CounterfactualCheck | undefined>;
  onSelectComparable: (id: string) => void;
  onFindCandidate: () => void;
  onRunAnalysis: () => void;
};

export function EvidenceBoard(props: EvidenceBoardProps) {
  const { selectedComparables, onFindCandidate, onRunAnalysis } = props;
  const [boardMode, setBoardMode] = useState<"board" | "table">("board");
  const [autoArrange, setAutoArrange] = useState(true);
  const [zoomLevel, setZoomLevel] = useState(100);

  return (
    <section className="evidence-board" aria-label="Selected comparables board">
      <div className="evidence-board-head">
        <div>
          <h3>Evidence Board</h3>
          <span>Selected comparables and source support</span>
        </div>
        <div className="evidence-board-controls" aria-label="Evidence board display mode">
          <button className="evidence-find-button" type="button" onClick={onFindCandidate}>
            <Search size={14} />
            Find More
          </button>
          <label className={clsx("evidence-auto-toggle", autoArrange && "active")}>
            <input
              type="checkbox"
              checked={autoArrange}
              onChange={(event) => setAutoArrange(event.target.checked)}
            />
            <span aria-hidden="true"><i /></span>
            Auto Arrange
          </label>
          <div className="evidence-zoom-group" aria-label="Evidence board zoom">
            <button type="button" aria-label="Zoom out" onClick={() => setZoomLevel((value) => Math.max(85, value - 5))} disabled={zoomLevel <= 85}><Minus size={14} /></button>
            <span>{zoomLevel}%</span>
            <button type="button" aria-label="Zoom in" onClick={() => setZoomLevel((value) => Math.min(110, value + 5))} disabled={zoomLevel >= 110}><Plus size={14} /></button>
          </div>
          <div className="evidence-mode-group" aria-label="Evidence display mode">
            <button type="button" className={clsx(boardMode === "board" && "active")} aria-pressed={boardMode === "board"} onClick={() => setBoardMode("board")}>Board</button>
            <button type="button" className={clsx(boardMode === "table" && "active")} aria-pressed={boardMode === "table"} onClick={() => setBoardMode("table")}>Table</button>
          </div>
          <EvidenceBoardLegend />
        </div>
      </div>
      {selectedComparables.length ? (
        boardMode === "board" ? (
          <EvidenceBoardCanvas {...props} autoArrange={autoArrange} zoomLevel={zoomLevel} />
        ) : (
          <EvidenceBoardTable selectedComparables={selectedComparables} activeComparableId={props.activeComparableId} onSelectComparable={props.onSelectComparable} />
        )
      ) : (
        <EvidenceBoardEmptyState subject={props.subject} onRunAnalysis={onRunAnalysis} />
      )}
    </section>
  );
}

function EvidenceBoardTable({
  selectedComparables,
  activeComparableId,
  onSelectComparable,
  counterfactualsByComparableId
}: {
  selectedComparables: AdjustedComparable[];
  activeComparableId?: string;
  onSelectComparable: (id: string) => void;
  counterfactualsByComparableId?: Record<string, CounterfactualCheck | undefined>;
}) {
  return (
    <div className="evidence-board-table" aria-label="Selected comparables table">
      <table>
        <thead>
          <tr>
            <th scope="col">Comparable</th>
            <th scope="col">Area</th>
            <th scope="col">Sale</th>
            <th scope="col">Adjusted</th>
            <th scope="col">Score</th>
            <th scope="col">Probability</th>
            <th scope="col">Sensitivity</th>
          </tr>
        </thead>
        <tbody>
          {selectedComparables.map((comp) => (
            <tr key={comp.id} className={clsx(activeComparableId === comp.id && "active")}>
              <td>
                <button type="button" onClick={() => onSelectComparable(comp.id)}>
                  <strong>{comp.address}</strong>
                  <span>{comp.propertyType}</span>
                </button>
              </td>
              <td>{comp.neighbourhood} / {comp.distanceKm.toFixed(1)} km</td>
              <td>{formatCurrency(comp.salePrice)}</td>
              <td>{formatCurrency(comp.adjustedValue)}</td>
              <td>{Math.round(comp.totalScore)}/100</td>
              <td>{comp.comparableProbabilityPercent}%</td>
              <td>{counterfactualsByComparableId?.[comp.id]?.interpretation ?? "Open Review Intelligence for sensitivity checks."}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
