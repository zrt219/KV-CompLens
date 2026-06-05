"use client";

import clsx from "clsx";
import { ChevronRight, X } from "lucide-react";
import { useId, useState } from "react";
import type { ComparableCardViewModel } from "../../lib/selectors/selectReviewBoardViewModel";

type WhyComparableButtonProps = {
  card: ComparableCardViewModel;
};

export function WhyComparableButton({ card }: WhyComparableButtonProps) {
  const [open, setOpen] = useState(false);
  const panelId = useId();
  const supportReason = card.topReasons[0] ?? card.topReason ?? "Comparable selected from the ranked review set.";

  return (
    <div className="why-comparable-control">
      <button
        className="why-comparable-button"
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-expanded={open}
        aria-controls={panelId}
        aria-label={`Open comparable explanation for ${card.address}`}
      >
        <span>Why this comparable?</span>
        <ChevronRight size={15} aria-hidden className={clsx(open && "open")} />
      </button>
      {open && (
        <section className="why-comparable-popover" id={panelId} role="dialog" aria-label={`Why ${card.address} fits`}>
          <div className="why-comparable-popover-head">
            <strong>Comparable fit</strong>
            <button type="button" onClick={() => setOpen(false)} aria-label="Close comparable explanation">
              <X size={14} aria-hidden />
            </button>
          </div>
          <div className="why-comparable-facts">
            <span>
              <small>Probability</small>
              <b>{card.probabilityLabel}</b>
            </span>
            <span>
              <small>Evidence</small>
              <b>{card.evidenceStrengthLabel}</b>
            </span>
            <span>
              <small>Impact</small>
              <b>{card.adjustmentImpactLabel}</b>
            </span>
          </div>
          <ul className="why-comparable-bullets">
            <li><strong>Support:</strong> {supportReason}</li>
            <li><strong>Watch:</strong> {card.mainCaution}</li>
            <li><strong>Analyst check:</strong> {card.analystReminder}</li>
          </ul>
        </section>
      )}
    </div>
  );
}
