"use client";

import { useEffect, useState } from "react";
import { ChevronDown, X } from "lucide-react";
import clsx from "clsx";
import type { Variants } from "framer-motion";
import type { SummaryRailDetail } from "../../../lib/selectors/selectSummaryRailViewModel";
import { RailMetricRow } from "./RailMetricRow";
import { RailSection } from "./RailSection";

type CollapsedDetailsCardProps = {
  details: SummaryRailDetail[];
  variants?: Variants;
};

export function CollapsedDetailsCard({ details, variants }: CollapsedDetailsCardProps) {
  const [openDetailId, setOpenDetailId] = useState<string>();
  const openDetail = details.find((detail) => detail.id === openDetailId);

  useEffect(() => {
    function closeOnEscape(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setOpenDetailId(undefined);
      }
    }

    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, []);

  return (
    <RailSection title="Details" className="collapsed-details-card" variants={variants}>
      <div className="rail-detail-list">
        {details.map((detail) => {
          const active = detail.id === openDetailId;
          return (
            <button
              className={clsx("rail-detail-row", active && "active")}
              key={detail.id}
              type="button"
              aria-expanded={active}
              onClick={() => setOpenDetailId(active ? undefined : detail.id)}
            >
              <span>{detail.label}</span>
              <em>{detail.count}</em>
              <ChevronDown size={16} aria-hidden />
            </button>
          );
        })}
      </div>

      {openDetail && (
        <div className="rail-detail-panel" aria-live="polite">
          <div className="rail-detail-panel-head">
            <strong>{openDetail.label}</strong>
            <button type="button" onClick={() => setOpenDetailId(undefined)} aria-label={`Close ${openDetail.label}`}>
              <X size={15} aria-hidden />
            </button>
          </div>
          <div className="rail-metric-stack">
            {openDetail.rows.map((metric) => (
              <RailMetricRow key={`${openDetail.id}-${metric.label}-${metric.value}`} metric={metric} />
            ))}
          </div>
          {openDetail.note && <small className="rail-method-note">{openDetail.note}</small>}
        </div>
      )}
    </RailSection>
  );
}
