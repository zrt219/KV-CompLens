"use client"

import { useMemo, useState } from "react"
import { AnimatePresence, motion } from "framer-motion"
import { Clipboard, ListChecks, X } from "lucide-react"
import type { EvidenceCourtPacket, EvidenceCourtResult } from "../../../lib/review-intelligence-v2/types"
import { AnalystQuestions } from "./AnalystQuestions"
import { ClaimLedger } from "./ClaimLedger"
import { CounterfactualChecks } from "./CounterfactualChecks"
import { EvidenceVerdictCard } from "./EvidenceVerdictCard"
import { MemoReadySummary } from "./MemoReadySummary"
import { SignalAnalystCard } from "./SignalAnalystCard"
import { SkepticAnalystCard } from "./SkepticAnalystCard"

export function ReviewIntelligenceV2Drawer({
  packet,
  result,
  attached,
  onAddToMemo,
  onClose
}: {
  packet: EvidenceCourtPacket
  result: EvidenceCourtResult
  attached: boolean
  onAddToMemo: () => void
  onClose: () => void
}) {
  const [ledgerOpen, setLedgerOpen] = useState(false)
  const [copied, setCopied] = useState(false)

  const claims = useMemo(
    () => [...result.signalAnalyst.strongestEvidence, ...result.skepticAnalyst.concerns],
    [result.signalAnalyst.strongestEvidence, result.skepticAnalyst.concerns]
  )

  async function handleCopy() {
    if (!result.verification.ok || typeof navigator === "undefined" || !navigator.clipboard?.writeText) {
      return
    }
    await navigator.clipboard.writeText(result.memoReadySummary)
    setCopied(true)
    window.setTimeout(() => setCopied(false), 1200)
  }

  return (
    <AnimatePresence>
      <motion.aside className="review-intelligence-backdrop" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
        <motion.section className="review-intelligence-drawer" initial={{ x: 420 }} animate={{ x: 0 }} exit={{ x: 420 }} transition={{ duration: 0.22 }}>
          <div className="review-intelligence-head">
            <div>
              <span className="status-chip confirmed">Review Intelligence V2</span>
              <h3>Verified from PCE-V2 snapshot</h3>
              <p>Public reasoning artifacts only. Deterministic valuation remains the source of truth.</p>
            </div>
            <button aria-label="Close Review Intelligence drawer" type="button" onClick={onClose}>
              <X size={20} />
            </button>
          </div>

          {result.verification.ok ? (
            <div className="review-intelligence-content">
              <EvidenceVerdictCard verdict={result.verdict} verification={result.verification} attached={attached} />
              <SignalAnalystCard strongestComparable={result.strongestComparable} signalAnalyst={result.signalAnalyst} />
              <SkepticAnalystCard weakestComparable={result.weakestSelectedComparable} skepticAnalyst={result.skepticAnalyst} />
              <CounterfactualChecks checks={result.counterfactuals} />
              <AnalystQuestions questions={result.analystQuestions} />
              <MemoReadySummary summary={result.memoReadySummary} limitations={result.limitations} attached={attached} />
              <ClaimLedger claims={claims} facts={packet.facts} open={ledgerOpen} />
            </div>
          ) : (
            <section className="ri-card ri-fallback">
              <div className="ri-card-head">
                <div>
                  <span className="ri-kicker">Review Intelligence V2</span>
                  <h3>Review set needs analyst review</h3>
                </div>
              </div>
              <p>The review result did not pass verifier checks, so unsafe reasoning has been withheld from the normal UI.</p>
              <MemoReadySummary summary={result.memoReadySummary} limitations={result.limitations} attached={attached} />
              {process.env.NODE_ENV !== "production" && (
                <div className="ri-dev-diagnostics">
                  <strong>Verifier diagnostics</strong>
                  <ul>
                    {result.verification.errors.map((error) => <li key={error}>{error}</li>)}
                    {result.verification.warnings.map((warning) => <li key={warning}>{warning}</li>)}
                  </ul>
                </div>
              )}
            </section>
          )}

          <div className="review-intelligence-actions">
            <button type="button" onClick={onAddToMemo} disabled={attached || !result.verification.ok}>
              <Clipboard size={16} aria-hidden />
              {attached ? "Added to Memo" : "Add to Memo"}
            </button>
            <button type="button" onClick={handleCopy} disabled={!result.verification.ok}>
              <Clipboard size={16} aria-hidden />
              {copied ? "Summary Copied" : "Copy Summary"}
            </button>
            <button type="button" onClick={() => setLedgerOpen((value) => !value)}>
              <ListChecks size={16} aria-hidden />
              {ledgerOpen ? "Hide Claim Ledger" : "View Claim Ledger"}
            </button>
            <button type="button" onClick={onClose}>
              Close
            </button>
          </div>
        </motion.section>
      </motion.aside>
    </AnimatePresence>
  )
}
