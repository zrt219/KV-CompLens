"use client";

import { useState } from "react";
import type { CSSProperties } from "react";
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
  counterfactualsByComparableId,
  onSelectComparable,
  autoArrange = true,
  zoomLevel = 100
}: EvidenceBoardProps & { autoArrange?: boolean; zoomLevel?: number }) {
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
    <div className="evidence-board-canvas" aria-label="Comparable evidence board">
      <div className="evidence-board-actions">
        <label className="evidence-search">
          <span>Search comparables</span>
          <input
            type="search"
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
            placeholder="Address, area, match"
          />
        </label>
        <span className="evidence-subject-filter">Subject property</span>
      </div>
      <div
        className={clsx("evidence-board-map", !autoArrange && "manual-layout")}
        style={{ "--board-zoom": String(zoomLevel / 100) } as CSSProperties}
      >
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
              counterfactual={counterfactualsByComparableId?.[comp.id]}
              onSelect={() => onSelectComparable(comp.id)}
            />
          </div>
        )) : (
          <div className="evidence-empty-state evidence-search-empty">
            No selected comparables match <strong>{searchTerm}</strong>.
          </div>
        )}
        {hiddenCount > 0 && <div className="evidence-more-pill">+{hiddenCount} more selected comparables</div>}
      </div>
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
