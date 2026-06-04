import { AlertTriangle, CheckCircle2, ShieldCheck } from "lucide-react"
import type { EvidenceCourtResult } from "../../../lib/review-intelligence-v2/types"

export function EvidenceVerdictCard({
  verdict,
  verification,
  attached
}: {
  verdict: EvidenceCourtResult["verdict"]
  verification: EvidenceCourtResult["verification"]
  attached: boolean
}) {
  const VerdictIcon = verdict.label === "Review set is usable"
    ? CheckCircle2
    : verdict.label === "Review set is weak"
      ? AlertTriangle
      : ShieldCheck

  return (
    <section className="ri-card">
      <div className="ri-card-head">
        <div>
          <span className="ri-kicker">Evidence Verdict</span>
          <h3>{verdict.label}</h3>
        </div>
        <span className={`ri-status-chip ${verification.ok ? "confirmed" : "review"}`}>
          <VerdictIcon size={14} aria-hidden />
          {verification.ok ? "Verified" : "Review Required"}
        </span>
      </div>
      <p>{verdict.summary}</p>
      <div className="ri-meta-grid">
        <div>
          <small>Attachment</small>
          <strong>{attached ? "Added to memo" : "Not attached"}</strong>
        </div>
        <div>
          <small>Verified claims</small>
          <strong>{verification.verifiedClaimCount}</strong>
        </div>
        <div>
          <small>Warnings</small>
          <strong>{verification.warnings.length}</strong>
        </div>
      </div>
    </section>
  )
}
