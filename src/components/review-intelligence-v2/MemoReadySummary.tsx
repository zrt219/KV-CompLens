import { ClipboardCheck } from "lucide-react"

export function MemoReadySummary({
  summary,
  limitations,
  attached
}: {
  summary: string
  limitations: string[]
  attached: boolean
}) {
  return (
    <section className="ri-card">
      <div className="ri-card-head">
        <div>
          <span className="ri-kicker">Memo-Ready Summary</span>
          <h3>Verified from PCE-V2 snapshot</h3>
        </div>
        <span className={`ri-status-chip ${attached ? "confirmed" : "review"}`}>
          <ClipboardCheck size={14} aria-hidden />
          {attached ? "Attached" : "Ready to attach"}
        </span>
      </div>
      <div className="ri-summary-callout">
        <p>{summary}</p>
      </div>
      <div className="ri-limitations">
        <strong>Limitations</strong>
        <ul>
          {limitations.map((limitation) => (
            <li key={limitation}>{limitation}</li>
          ))}
        </ul>
      </div>
    </section>
  )
}
