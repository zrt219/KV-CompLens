"use client";

import type { SummaryRailMetric } from "../../../lib/selectors/selectSummaryRailViewModel";
import { RailStatusPill } from "./RailStatusPill";

type RailMetricRowProps = {
  metric: SummaryRailMetric;
};

export function RailMetricRow({ metric }: RailMetricRowProps) {
  const valueText = String(metric.value);
  const isLongValue = valueText.length > 22;

  return (
    <div className={isLongValue ? "rail-metric-row is-long-value" : "rail-metric-row"}>
      <span>{metric.label}</span>
      <strong>{metric.value}</strong>
      {metric.tone && <RailStatusPill label={statusLabel(metric.tone)} tone={metric.tone} />}
    </div>
  );
}

function statusLabel(tone: NonNullable<SummaryRailMetric["tone"]>) {
  if (tone === "confirmed") return "Confirmed";
  if (tone === "ready") return "Ready";
  if (tone === "locked") return "Locked";
  if (tone === "review") return "Needs review";
  return "Info";
}
