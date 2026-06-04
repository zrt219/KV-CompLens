import { GitBranchPlus } from "lucide-react"
import { formatCurrency } from "../../../lib/format"
import type { CounterfactualCheck } from "../../../lib/review-intelligence-v2/types"

export function CounterfactualChecks({ checks }: { checks: CounterfactualCheck[] }) {
  return (
    <section className="ri-card">
      <div className="ri-card-head">
        <div>
          <span className="ri-kicker">Counterfactual Checks</span>
          <h3>What changes if a comp is removed?</h3>
        </div>
      </div>
      <div className="ri-check-grid">
        {checks.map((check) => (
          <article className="ri-check-card" key={check.id}>
            <div className="ri-check-head">
              <GitBranchPlus size={15} aria-hidden />
              <strong>{check.label}</strong>
            </div>
            <div className="ri-check-metrics">
              <span>
                <small>Midpoint</small>
                <b>{formatCurrency(check.beforeMidpoint)} {"->"} {formatCurrency(check.afterMidpoint)}</b>
              </span>
              <span>
                <small>Confidence</small>
                <b>{Math.round(check.beforeConfidence)}% {"->"} {Math.round(check.afterConfidence)}%</b>
              </span>
              <span>
                <small>Range impact</small>
                <b>{check.rangeImpact >= 0 ? "+" : "-"}${Math.abs(Math.round(check.rangeImpact)).toLocaleString()}</b>
              </span>
            </div>
            <p>{check.interpretation}</p>
          </article>
        ))}
      </div>
    </section>
  )
}
