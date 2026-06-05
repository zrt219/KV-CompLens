"use client";

import type { Variants } from "framer-motion";
import type { SummaryRailViewModel } from "../../../lib/selectors/selectSummaryRailViewModel";
import { RailMetricRow } from "./RailMetricRow";
import { RailSection } from "./RailSection";

type DecisionSnapshotCardProps = {
  snapshot: SummaryRailViewModel["decisionSnapshot"];
  variants?: Variants;
};

export function DecisionSnapshotCard({ snapshot, variants }: DecisionSnapshotCardProps) {
  return (
    <RailSection title="Decision Snapshot" className="decision-snapshot-card value-card" variants={variants}>
      <span className="rail-kicker">{snapshot.rangeLabel}</span>
      <strong className="rail-major-value">{snapshot.rangeValue}</strong>
      <div className="rail-metric-stack">
        {snapshot.metrics.map((metric) => (
          <RailMetricRow key={`${metric.label}-${metric.value}`} metric={metric} />
        ))}
      </div>
      <small className="rail-method-note">{snapshot.note}</small>
    </RailSection>
  );
}
