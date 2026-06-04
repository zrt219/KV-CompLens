import { CheckCircle2 } from "lucide-react"
import type { EvidenceClaim, EvidenceCourtResult } from "../../../lib/review-intelligence-v2/types"

export function SignalAnalystCard({
  strongestComparable,
  signalAnalyst
}: {
  strongestComparable: EvidenceCourtResult["strongestComparable"]
  signalAnalyst: EvidenceCourtResult["signalAnalyst"]
}) {
  return (
    <section className="ri-card">
      <div className="ri-card-head">
        <div>
          <span className="ri-kicker">Evidence Supporting the Review</span>
          <h3>Strongest Comparable</h3>
        </div>
      </div>
      <div className="ri-summary-callout">
        <strong>{strongestComparable.address}</strong>
        <p>{strongestComparable.reason}</p>
      </div>
      <p>{signalAnalyst.summary}</p>
      <ul className="ri-claim-list">
        {signalAnalyst.strongestEvidence.map((claim) => (
          <li key={claim.id}>
            <CheckCircle2 size={15} aria-hidden />
            <div>
              <strong>{claimLabel(claim)}</strong>
              <span>{claim.claim}</span>
            </div>
          </li>
        ))}
      </ul>
    </section>
  )
}

function claimLabel(claim: EvidenceClaim) {
  return claim.claimType.replace(/_/g, " ")
}
