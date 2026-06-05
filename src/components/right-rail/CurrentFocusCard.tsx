"use client";

import type { Variants } from "framer-motion";
import type { SummaryRailViewModel } from "../../../lib/selectors/selectSummaryRailViewModel";
import { RailMetricRow } from "./RailMetricRow";
import { RailSection } from "./RailSection";
import { RailStatusPill } from "./RailStatusPill";

type CurrentFocusCardProps = {
  focus: SummaryRailViewModel["currentFocus"];
  variants?: Variants;
};

export function CurrentFocusCard({ focus, variants }: CurrentFocusCardProps) {
  return (
    <RailSection title={focus.title} className="current-focus-card" variants={variants}>
      {focus.status && <RailStatusPill label={focus.status.label} tone={focus.status.tone} />}
      <div className="rail-metric-stack">
        {focus.rows.map((metric) => (
          <RailMetricRow key={`${metric.label}-${metric.value}`} metric={metric} />
        ))}
      </div>
      {focus.note && <p className="rail-support-copy">{focus.note}</p>}
    </RailSection>
  );
}
