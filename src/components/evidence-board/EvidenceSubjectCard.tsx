"use client";

import { Home, ShieldCheck } from "lucide-react";
import { formatCurrency } from "../../../lib/agent";
import type { SubjectProperty, ValuationRange } from "../../../lib/types";
import { PropertyThumbnail } from "../PropertyThumbnail";

type EvidenceSubjectCardProps = {
  subject: SubjectProperty;
  valuation: ValuationRange;
};

export function EvidenceSubjectCard({ subject, valuation }: EvidenceSubjectCardProps) {
  return (
    <article className="evidence-subject-card" aria-label={`Subject property ${subject.address}`}>
      <PropertyThumbnail propertyType={subject.propertyType} seed={subject.address} isSubject />
      <div className="evidence-card-body">
        <div className="evidence-card-kicker">
          <Home size={14} aria-hidden="true" />
          <span>Property</span>
        </div>
        <h4>{subject.address}</h4>
        <p>{subject.neighbourhood} / {subject.propertyType}</p>
        <div className="evidence-card-metrics" aria-label="Subject valuation summary">
          <span>
            <small>Current estimate</small>
            <b>{formatCurrency(valuation.pointEstimate)}</b>
          </span>
          <span>
            <small>Confidence</small>
            <b>{valuation.confidenceLevel}</b>
          </span>
        </div>
        <div className="evidence-status-chip confirmed">
          <ShieldCheck size={14} aria-hidden="true" />
          <span>Review target</span>
        </div>
      </div>
    </article>
  );
}
