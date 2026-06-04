import type { EvidenceClaim, EvidenceFact } from "../../../lib/review-intelligence-v2/types"

export function ClaimLedger({
  claims,
  facts,
  open
}: {
  claims: EvidenceClaim[]
  facts: EvidenceFact[]
  open: boolean
}) {
  const factsById = new Map(facts.map((fact) => [fact.id, fact]))

  return (
    <section className={`ri-card ri-ledger ${open ? "open" : ""}`}>
      <div className="ri-card-head">
        <div>
          <span className="ri-kicker">Claim Ledger</span>
          <h3>Public reasoning artifacts</h3>
        </div>
      </div>
      {open ? (
        <div className="ri-ledger-list">
          {claims.map((claim) => (
            <article className="ri-ledger-item" key={claim.id}>
              <div className="ri-ledger-topline">
                <strong>{claim.claimType.replace(/_/g, " ")}</strong>
                <span>{claim.verified ? "Verified" : "Rejected"}</span>
              </div>
              <p>{claim.claim}</p>
              <ul>
                {claim.supportFactIds.map((factId) => {
                  const fact = factsById.get(factId)
                  return (
                    <li key={factId}>
                      <code>{factId}</code>
                      <span>{fact?.label ?? "Missing fact"}</span>
                    </li>
                  )
                })}
              </ul>
            </article>
          ))}
        </div>
      ) : (
        <p>Claim ledger hidden by default. Open it to inspect claim-to-fact grounding.</p>
      )}
    </section>
  )
}
