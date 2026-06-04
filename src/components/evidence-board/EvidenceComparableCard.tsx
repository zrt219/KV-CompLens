"use client";

import { useMemo, useState } from "react";
import clsx from "clsx";
import { CheckCircle2, ChevronDown, Sparkles } from "lucide-react";
import { formatCurrency } from "../../../lib/agent";
import type { AdjustedComparable } from "../../../lib/types";
import type { CounterfactualCheck } from "../../../lib/review-intelligence-v2/types";
import { PropertyThumbnail } from "../PropertyThumbnail";

type EvidenceComparableCardProps = {
  comp: AdjustedComparable;
  rank: number;
  active: boolean;
  isNew?: boolean;
  counterfactual?: CounterfactualCheck;
  onSelect: () => void;
};

export function EvidenceComparableCard({ comp, rank, active, isNew, counterfactual, onSelect }: EvidenceComparableCardProps) {
  const [detailsOpen, setDetailsOpen] = useState(false);
  const evidenceWeight = Math.round((comp.normalizedEvidenceWeight ?? comp.evidenceWeight) * 100);
  const topReasons = (comp.reasons ?? [comp.matchReason]).slice(0, 3);
  const topCautions = [...comp.penalties, ...comp.riskFlags].slice(0, 2);
  const adjustmentImpact = useMemo(() => {
    if (!comp.adjustmentLines.length) {
      return "No line-level adjustments were recorded."
    }
    const largestLine = [...comp.adjustmentLines].sort((left, right) => Math.abs(right.amount) - Math.abs(left.amount))[0]
    return `${largestLine.label} ${largestLine.amount >= 0 ? "+" : "-"}$${Math.abs(Math.round(largestLine.amount)).toLocaleString()}`
  }, [comp.adjustmentLines])

  return (
    <article
      className={clsx("evidence-comparable-card", active && "active", isNew && "new")}
      aria-label={`Comparable ${rank}: ${comp.address}`}
    >
      <PropertyThumbnail propertyType={comp.propertyType} seed={comp.address} isNew={isNew} compact />
      <span className="evidence-rank">#{rank}</span>
      <div className="evidence-card-body">
        <span className="evidence-card-kicker">
          {isNew ? <Sparkles size={14} aria-hidden="true" /> : <CheckCircle2 size={14} aria-hidden="true" />}
          <span>{isNew ? "New comparable" : "Selected comparable"}</span>
        </span>
        <button
          className="evidence-comparable-select"
          type="button"
          onClick={onSelect}
          aria-pressed={active}
        >
          <strong>{comp.address}</strong>
          <em>{comp.neighbourhood} / {Math.round(comp.distanceKm * 10) / 10} km</em>
        </button>
        <span className="evidence-card-metrics" aria-label="Comparable pricing and match details">
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
        <button className="evidence-why-toggle" type="button" onClick={() => setDetailsOpen((value) => !value)} aria-expanded={detailsOpen}>
          <span>Why this comparable?</span>
          <ChevronDown size={14} aria-hidden className={clsx(detailsOpen && "open")} />
        </button>
        {detailsOpen && (
          <div className="evidence-why-panel">
            <div className="evidence-why-grid">
              <span>
                <small>Comparable probability</small>
                <b>{comp.comparableProbabilityPercent}%</b>
              </span>
              <span>
                <small>Evidence weight</small>
                <b>{evidenceWeight}%</b>
              </span>
              <span>
                <small>Adjustment impact</small>
                <b>{adjustmentImpact}</b>
              </span>
            </div>
            <div>
              <small>Top support reasons</small>
              <ul>
                {topReasons.map((reason) => <li key={reason}>{reason}</li>)}
              </ul>
            </div>
            <div>
              <small>Top cautions</small>
              <ul>
                {(topCautions.length ? topCautions : ["No major cautions flagged in the selected packet."]).map((caution) => <li key={caution}>{caution}</li>)}
              </ul>
            </div>
            <div>
              <small>Counterfactual impact</small>
              <p>{counterfactual?.interpretation ?? "Open Review Intelligence V2 to inspect removal sensitivity for this comparable."}</p>
            </div>
          </div>
        )}
      </div>
    </article>
  );
}
