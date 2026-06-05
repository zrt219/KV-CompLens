"use client";

import { ChevronRight } from "lucide-react";
import type { Variants } from "framer-motion";
import type { SummaryRailActionId, SummaryRailViewModel } from "../../../lib/selectors/selectSummaryRailViewModel";
import { RailSection } from "./RailSection";
import { RailStatusPill } from "./RailStatusPill";

type NextActionCardProps = {
  nextAction: SummaryRailViewModel["nextAction"];
  onAction: (actionId: SummaryRailActionId) => void;
  variants?: Variants;
};

export function NextActionCard({ nextAction, onAction, variants }: NextActionCardProps) {
  return (
    <RailSection title={nextAction.title} className="next-action-card" variants={variants}>
      {nextAction.tone && <RailStatusPill label={nextAction.tone === "locked" ? "Locked" : nextAction.tone === "confirmed" ? "Ready" : "Next"} tone={nextAction.tone} />}
      <p className="rail-support-copy">{nextAction.detail}</p>
      <button
        className="rail-action"
        type="button"
        onClick={() => onAction(nextAction.actionId)}
        disabled={nextAction.disabled}
      >
        {nextAction.buttonLabel}
        <ChevronRight size={16} aria-hidden />
      </button>
    </RailSection>
  );
}
