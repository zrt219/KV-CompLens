"use client";

import { motion, useReducedMotion } from "framer-motion";
import type { SummaryRailActionId, SummaryRailViewModel } from "../../../lib/selectors/selectSummaryRailViewModel";
import { CollapsedDetailsCard } from "./CollapsedDetailsCard";
import { CurrentFocusCard } from "./CurrentFocusCard";
import { DecisionSnapshotCard } from "./DecisionSnapshotCard";
import { NextActionCard } from "./NextActionCard";

type SummaryRailProps = {
  viewModel: SummaryRailViewModel;
  onAction: (actionId: SummaryRailActionId) => void;
};

export function SummaryRail({ viewModel, onAction }: SummaryRailProps) {
  const prefersReducedMotion = useReducedMotion();
  const railVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.04
      }
    }
  };
  const cardVariants = {
    hidden: { opacity: 0, y: 10, filter: "blur(3px)" },
    visible: {
      opacity: 1,
      y: 0,
      filter: "blur(0px)",
      transition: { duration: 0.22 }
    }
  };

  return (
    <motion.aside
      className="insights-rail summary-rail"
      aria-label="Summary rail"
      data-page={viewModel.page}
      initial={prefersReducedMotion ? false : "hidden"}
      animate="visible"
      variants={railVariants}
    >
      <div className="insights-head">
        <h2>Summary Rail</h2>
        <span>{viewModel.localOnlyLabel}</span>
      </div>
      <DecisionSnapshotCard snapshot={viewModel.decisionSnapshot} variants={cardVariants} />
      <CurrentFocusCard focus={viewModel.currentFocus} variants={cardVariants} />
      <NextActionCard nextAction={viewModel.nextAction} onAction={onAction} variants={cardVariants} />
      <CollapsedDetailsCard details={viewModel.details} variants={cardVariants} />
    </motion.aside>
  );
}
