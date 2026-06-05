"use client";

import clsx from "clsx";
import type { ComparableCardViewModel } from "../../lib/selectors/selectReviewBoardViewModel";
import { ComparableMetricChips } from "./ComparableMetricChips";
import { PropertyImageStrip } from "./PropertyImageStrip";
import { WhyComparableButton } from "./WhyComparableButton";

type ComparableCardProps = {
  card: ComparableCardViewModel;
  onSelect: () => void;
  onAddCandidate?: () => void;
};

export function ComparableCard({ card, onSelect, onAddCandidate }: ComparableCardProps) {
  return (
    <article
      className={clsx(
        "review-comparable-card",
        card.isActive && "active",
        card.isSelected && "selected",
        card.isNewCandidate && "new-candidate"
      )}
      aria-label={`Comparable ${card.rank}: ${card.address}`}
      data-card-id={card.id}
    >
      <PropertyImageStrip
        imageUrl={card.imageUrl}
        propertyType={card.propertyType}
        rank={card.rank}
        isActive={card.isActive}
        isNewCandidate={card.isNewCandidate}
      />
      <div className="review-comparable-card-body">
        <button
          className="review-comparable-title"
          type="button"
          onClick={onSelect}
          aria-pressed={card.isActive}
        >
          <strong>{card.address}</strong>
          <span>{card.neighborhood} / {card.distanceLabel}</span>
        </button>
        <ComparableMetricChips
          salePriceLabel={card.salePriceLabel}
          adjustedValueLabel={card.adjustedValueLabel}
          probabilityLabel={card.probabilityLabel}
        />
        <p className="review-comparable-strength">
          {card.matchScoreLabel} <span aria-hidden="true">·</span> {card.evidenceStrengthLabel}
        </p>
        {card.isNewCandidate && onAddCandidate ? (
          <button className="review-add-candidate-button" type="button" onClick={onAddCandidate}>
            Add to comparison
          </button>
        ) : (
          <WhyComparableButton card={card} />
        )}
      </div>
    </article>
  );
}

