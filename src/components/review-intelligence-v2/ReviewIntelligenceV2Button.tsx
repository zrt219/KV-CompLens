"use client"

import clsx from "clsx"
import { Scale, ShieldCheck } from "lucide-react"

export function ReviewIntelligenceV2Button({
  attached,
  disabled,
  onClick
}: {
  attached: boolean
  disabled?: boolean
  onClick: () => void
}) {
  return (
    <button
      className={clsx("review-intelligence-button", attached && "attached")}
      type="button"
      onClick={onClick}
      disabled={disabled}
    >
      {attached ? <ShieldCheck size={17} aria-hidden /> : <Scale size={17} aria-hidden />}
      {attached ? "Review Set Explained" : "Explain Review Set"}
    </button>
  )
}
