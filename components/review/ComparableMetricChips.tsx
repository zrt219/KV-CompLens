import type { ComparableCardViewModel } from "../../lib/selectors/selectReviewBoardViewModel";

type ComparableMetricChipsProps = Pick<
  ComparableCardViewModel,
  "salePriceLabel" | "adjustedValueLabel" | "probabilityLabel"
>;

export function ComparableMetricChips({
  salePriceLabel,
  adjustedValueLabel,
  probabilityLabel
}: ComparableMetricChipsProps) {
  return (
    <div className="review-comparable-metric-chips" aria-label="Comparable sale, adjusted value, and probability">
      <span>
        <small>Sale</small>
        <b>{salePriceLabel}</b>
      </span>
      <span>
        <small title="Adjusted value">Adj.</small>
        <b>{adjustedValueLabel}</b>
      </span>
      <span>
        <small>Prob.</small>
        <b>{probabilityLabel}</b>
      </span>
    </div>
  );
}
