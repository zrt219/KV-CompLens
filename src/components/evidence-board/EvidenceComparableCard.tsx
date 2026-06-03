"use client";

import clsx from "clsx";
import { CheckCircle2, Sparkles } from "lucide-react";
import { formatCurrency } from "../../../lib/agent";
import type { AdjustedComparable } from "../../../lib/types";
import { PropertyThumbnail } from "../PropertyThumbnail";

type EvidenceComparableCardProps = {
  comp: AdjustedComparable;
  rank: number;
  active: boolean;
  isNew?: boolean;
  onSelect: () => void;
};

export function EvidenceComparableCard({ comp, rank, active, isNew, onSelect }: EvidenceComparableCardProps) {
  const evidenceWeight = Math.round((comp.normalizedEvidenceWeight ?? comp.evidenceWeight) * 100);

  return (
    <button
      className={clsx("evidence-comparable-card", active && "active", isNew && "new")}
      type="button"
      onClick={onSelect}
      aria-pressed={active}
      aria-label={`Comparable ${rank}: ${comp.address}`}
    >
      <PropertyThumbnail propertyType={comp.propertyType} seed={comp.address} isNew={isNew} compact />
      <span className="evidence-rank">#{rank}</span>
      <span className="evidence-card-body">
        <span className="evidence-card-kicker">
          {isNew ? <Sparkles size={14} aria-hidden="true" /> : <CheckCircle2 size={14} aria-hidden="true" />}
          <span>{isNew ? "New home" : "Selected home"}</span>
        </span>
        <strong>{comp.address}</strong>
        <em>{comp.neighbourhood} / {Math.round(comp.distanceKm * 10) / 10} km</em>
        <span className="evidence-card-metrics" aria-label="Home pricing and match details">
          <span>
            <small>Sale</small>
            <b>{formatCurrency(comp.salePrice)}</b>
          </span>
          <span>
            <small>Adjusted</small>
            <b>{formatCurrency(comp.adjustedValue)}</b>
          </span>
          <span>
            <small>Prob.</small>
            <b>{comp.comparableProbabilityPercent}%</b>
          </span>
        </span>
        <span className="evidence-card-footer">{Math.round(comp.totalScore)} Match / {evidenceWeight}% strength</span>
      </span>
    </button>
  );
}
