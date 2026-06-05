"use client";

import type { ReactNode } from "react";
import { motion } from "framer-motion";
import type { Variants } from "framer-motion";
import clsx from "clsx";

type RailSectionProps = {
  title: string;
  children: ReactNode;
  className?: string;
  variants?: Variants;
};

export function RailSection({ title, children, className, variants }: RailSectionProps) {
  return (
    <motion.section className={clsx("insight-card summary-rail-card", className)} variants={variants}>
      <span className="card-label">{title}</span>
      {children}
    </motion.section>
  );
}
