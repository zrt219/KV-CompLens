"use client";

import clsx from "clsx";
import { CheckCircle2, CircleDot, Sparkles } from "lucide-react";
import type { EvidenceBoardFocus } from "./EvidenceBoard";

type EvidenceBoardLegendProps = {
  focus: EvidenceBoardFocus;
  onFocusChange: (focus: EvidenceBoardFocus) => void;
};

const focusItems: Array<{
  id: Exclude<EvidenceBoardFocus, "all">;
  label: string;
  icon: typeof CircleDot;
  description: string;
}> = [
  {
    id: "subject",
    label: "Subject",
    icon: CircleDot,
    description: "Highlight the subject property and dim the comparables."
  },
  {
    id: "selected",
    label: "Selected comparable",
    icon: CheckCircle2,
    description: "Focus the selected comparable set."
  },
  {
    id: "new",
    label: "New comparable",
    icon: Sparkles,
    description: "Spot the newest comparable candidate."
  }
];

export function EvidenceBoardLegend({ focus, onFocusChange }: EvidenceBoardLegendProps) {
  return (
    <div className="evidence-board-legend" aria-label="Evidence board legend and focus controls">
      {focusItems.map(({ id, label, icon: Icon, description }) => {
        const active = focus === id;

        return (
          <button
            key={id}
            type="button"
            className={clsx(active && "active")}
            aria-pressed={active}
            onClick={() => onFocusChange(active ? "all" : id)}
            title={`${description} Click again to reset the board.`}
          >
            <Icon size={14} aria-hidden="true" />
            {label}
          </button>
        );
      })}
    </div>
  );
}
