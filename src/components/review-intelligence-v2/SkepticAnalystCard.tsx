import { AlertTriangle } from "lucide-react"
import type { EvidenceCourtResult } from "../../../lib/review-intelligence-v2/types"

export function SkepticAnalystCard({
  weakestComparable,
  skepticAnalyst
}: {
  weakestComparable: EvidenceCourtResult["weakestSelectedComparable"]
  skepticAnalyst: EvidenceCourtResult["skepticAnalyst"]
}) {
  return (
    <section className="ri-card">
      <div className="ri-card-head">
        <div>
          <span className="ri-kicker">Skeptic Review</span>
          <h3>Weakest Selected Comparable</h3>
        </div>
      </div>
      <div className="ri-summary-callout caution">
        <strong>{weakestComparable.address}</strong>
        <p>{weakestComparable.reason}</p>
      </div>
      <p>{skepticAnalyst.summary}</p>
      <ul className="ri-claim-list caution">
        {skepticAnalyst.concerns.map((claim) => (
          <li key={claim.id}>
            <AlertTriangle size={15} aria-hidden />
            <div>
              <strong>{claim.claimType.replace(/_/g, " ")}</strong>
              <span>{claim.claim}</span>
            </div>
          </li>
        ))}
      </ul>
    </section>
  )
}
