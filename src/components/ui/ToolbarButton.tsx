import clsx from "clsx";
import { ButtonHTMLAttributes } from "react";

export function ToolbarButton({ className, ...props }: ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      className={clsx(
        "flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-semibold rounded transition-colors",
        "text-[var(--text-secondary)] hover:bg-[var(--surface-soft)] hover:text-[var(--text-primary)]",
        "disabled:opacity-50 disabled:cursor-not-allowed",
        className
      )}
      {...props}
    />
  );
}
