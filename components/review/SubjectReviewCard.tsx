import { Home, ShieldCheck } from "lucide-react";
import type { SubjectReviewCardViewModel } from "../../lib/selectors/selectReviewBoardViewModel";
import { PropertyImageStrip } from "./PropertyImageStrip";

type SubjectReviewCardProps = {
  card: SubjectReviewCardViewModel;
};

export function SubjectReviewCard({ card }: SubjectReviewCardProps) {
  return (
    <article className="review-subject-card" aria-label={`Subject property ${card.address}`}>
      <PropertyImageStrip imageUrl={card.imageUrl} propertyType={card.propertyType} isSubject />
      <div className="review-subject-card-body">
        <div className="review-subject-kicker">
          <Home size={14} aria-hidden />
          <span>Subject property</span>
        </div>
        <h4>{card.address}</h4>
        <p>{card.neighborhood} / {card.propertyType}</p>
        <div className="review-subject-metrics" aria-label="Subject valuation summary">
          <span>
            <small>Current estimate</small>
            <b>{card.currentEstimateLabel}</b>
          </span>
          <span>
            <small>Confidence</small>
            <b>{card.confidenceLabel}</b>
          </span>
        </div>
        <span className="review-target-chip">
          <ShieldCheck size={14} aria-hidden />
          Review target
        </span>
      </div>
    </article>
  );
}

