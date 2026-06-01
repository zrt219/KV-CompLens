"use client";

import { useState } from "react";
import clsx from "clsx";
import type { AdjustedComparable } from "../../../lib/types";
import type { EvidenceBoardProps } from "./EvidenceBoard";
import { EvidenceComparableCard } from "./EvidenceComparableCard";
import { EvidenceLinkLayer } from "./EvidenceLinkLayer";
import { EvidenceSubjectCard } from "./EvidenceSubjectCard";

const slots = ["top-left", "mid-left", "bottom-left", "top-right", "bottom-right"] as const;

export function EvidenceBoardCanvas({
  subject,
  selectedComparables,
  activeComparableId,
  newCandidateId,
  valuation,
  onSelectComparable,
  onFindCandidate
}: EvidenceBoardProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const sortedComps = sortComparables(selectedComparables);
  const normalizedSearch = searchTerm.trim().toLowerCase();
  const filteredComps = normalizedSearch
    ? sortedComps.filter((comp) => searchableComparableText(comp).includes(normalizedSearch))
    : sortedComps;
  const visibleComps = filteredComps.slice(0, 5);
  const hiddenCount = Math.max(0, filteredComps.length - visibleComps.length);
  const activeId = activeComparableId ?? visibleComps[0]?.id;

  return (
    <div className="evidence-board-canvas">
      <div className="evidence-board-actions">
        <label className="evidence-search">
          <span>Search comparables</span>
          <input
            type="search"
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
            placeholder="Address, area, score"
          />
        </label>
        <span className="evidence-subject-filter">Subject Property</span>
        <button className="canvas-find" type="button" onClick={onFindCandidate}>Find candidate</button>
      </div>
      <EvidenceLinkLayer comps={visibleComps} activeComparableId={activeId} newCandidateId={newCandidateId} />
      <div className="evidence-subject-slot">
        <EvidenceSubjectCard subject={subject} valuation={valuation} />
      </div>
      {visibleComps.length ? visibleComps.map((comp, index) => (
        <div className={clsx("evidence-comp-slot", `slot-${slots[index]}`)} key={comp.id}>
          <EvidenceComparableCard
            comp={comp}
            rank={index + 1}
            active={activeId === comp.id}
            isNew={newCandidateId === comp.id}
            onSelect={() => onSelectComparable(comp.id)}
          />
        </div>
      )) : (
        <div className="evidence-empty-state evidence-search-empty">
          No selected comparables match <strong>{searchTerm}</strong>.
        </div>
      )}
      {hiddenCount > 0 && <div className="evidence-more-pill">+{hiddenCount} more selected comps</div>}
    </div>
  );
}

function sortComparables(comps: AdjustedComparable[]) {
  return [...comps].sort((a, b) => {
    const weightDelta = (b.normalizedEvidenceWeight ?? b.evidenceWeight) - (a.normalizedEvidenceWeight ?? a.evidenceWeight);
    return weightDelta || b.totalScore - a.totalScore || a.id.localeCompare(b.id);
  });
}

function searchableComparableText(comp: AdjustedComparable) {
  return [
    comp.address,
    comp.city,
    comp.neighbourhood,
    comp.propertyType,
    Math.round(comp.totalScore).toString(),
    comp.distanceKm.toFixed(1)
  ].join(" ").toLowerCase();
}
