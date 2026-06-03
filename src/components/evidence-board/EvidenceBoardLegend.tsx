"use client";

import { CheckCircle2, CircleDot, Sparkles } from "lucide-react";

export function EvidenceBoardLegend() {
  return (
    <div className="evidence-board-legend" aria-label="Evidence board legend">
      <span>
        <CircleDot size={14} aria-hidden="true" />
        Subject
      </span>
      <span>
        <CheckCircle2 size={14} aria-hidden="true" />
        Selected home
      </span>
      <span>
        <Sparkles size={14} aria-hidden="true" />
        New home
      </span>
    </div>
  );
}
