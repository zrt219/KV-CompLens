"use client";

import { CheckCircle2, Info, Lock, PackageCheck } from "lucide-react";
import clsx from "clsx";
import type { SummaryRailTone } from "../../../lib/selectors/selectSummaryRailViewModel";

type RailStatusPillProps = {
  label: string;
  tone?: SummaryRailTone;
};

export function RailStatusPill({ label, tone = "neutral" }: RailStatusPillProps) {
  const Icon = tone === "confirmed"
    ? CheckCircle2
    : tone === "ready"
      ? PackageCheck
      : tone === "locked"
        ? Lock
        : Info;

  return (
    <span className={clsx("rail-status-pill", tone)}>
      <Icon size={13} aria-hidden />
      {label}
    </span>
  );
}
