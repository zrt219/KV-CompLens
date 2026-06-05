import clsx from "clsx";
import { ReactNode } from "react";

type ButtonGroupProps = {
  children: ReactNode;
  className?: string;
};

export function ButtonGroup({ children, className }: ButtonGroupProps) {
  return (
    <div className={clsx("btn-group flex items-center gap-2", className)}>
      {children}
    </div>
  );
}
