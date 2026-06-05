import clsx from "clsx";
import { ReactNode } from "react";

type StatusChipProps = {
  variant?: "ready" | "waiting" | "locked" | "complete" | "warning" | "error" | "local" | "demo";
  children: ReactNode;
  className?: string;
  title?: string;
  "data-tooltip"?: string;
};

export function StatusChip({ variant = "waiting", children, className, ...props }: StatusChipProps) {
  return (
    <span className={clsx("status-chip", variant, className)} {...props}>
      {children}
    </span>
  );
}
