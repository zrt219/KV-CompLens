"use client";

import clsx from "clsx";
type EvidenceLinkLayerProps = {
  comps: Array<{ id: string; slot: EvidenceLinkSlot }>;
  activeComparableId?: string;
  newCandidateId?: string;
};

export type EvidenceLinkSlot = "top-left" | "mid-left" | "bottom-left" | "top-right" | "mid-right" | "bottom-right";

const paths: Record<EvidenceLinkSlot, string> = {
  "top-left": "M 500 330 C 380 260, 300 180, 195 126",
  "mid-left": "M 500 330 C 370 326, 286 326, 178 330",
  "bottom-left": "M 500 330 C 380 410, 302 496, 196 548",
  "top-right": "M 500 330 C 620 260, 696 180, 805 126",
  "mid-right": "M 500 330 C 626 326, 710 326, 822 330",
  "bottom-right": "M 500 330 C 620 416, 696 512, 805 548"
};

export function EvidenceLinkLayer({ comps, activeComparableId, newCandidateId }: EvidenceLinkLayerProps) {
  return (
    <svg
      className="evidence-link-layer"
      viewBox="0 0 1000 680"
      preserveAspectRatio="none"
      aria-hidden="true"
      focusable="false"
    >
      <defs>
        <linearGradient id="evidence-link-gradient" x1="0" x2="1" y1="0" y2="1">
          <stop offset="0" stopColor="currentColor" stopOpacity="0.16" />
          <stop offset="0.5" stopColor="currentColor" stopOpacity="0.54" />
          <stop offset="1" stopColor="currentColor" stopOpacity="0.16" />
        </linearGradient>
      </defs>
      {comps.map((comp) => {
        const isActive = comp.id === activeComparableId;
        const isNew = comp.id === newCandidateId;

        return (
          <path
            className={clsx("evidence-link", isActive && "active", isNew && "new")}
            d={paths[comp.slot]}
            key={comp.id}
            fill="none"
            stroke="url(#evidence-link-gradient)"
            strokeWidth={isActive ? 2.4 : 1.1}
            strokeLinecap="round"
            strokeDasharray={isNew ? "10 8" : undefined}
          />
        );
      })}
    </svg>
  );
}
