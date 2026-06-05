"use client"

import { AnimatePresence, motion } from "framer-motion";
import { Clipboard, ListChecks, ShieldCheck, X } from "lucide-react";
import { useMemo, useState } from "react";
import type { EvidenceCourtPacket, EvidenceCourtResult } from "../../../lib/review-intelligence-v2/types";
import { ClaimLedger } from "./ClaimLedger";

export function ReviewIntelligenceV2Drawer({
  packet,
  result,
  attached,
  onAddToMemo,
  onClose
}: {
  packet: EvidenceCourtPacket;
  result: EvidenceCourtResult;
  attached: boolean;
  onAddToMemo: () => void;
  onClose: () => void;
}) {
  const [copied, setCopied] = useState(false);
  const [ledgerOpen, setLedgerOpen] = useState(false);
  const claims = useMemo(
    () => [...result.signalAnalyst.strongestEvidence, ...result.skepticAnalyst.concerns],
    [result.signalAnalyst.strongestEvidence, result.skepticAnalyst.concerns]
  );

  async function handleCopy() {
    if (!result.verification.ok || typeof navigator === "undefined" || !navigator.clipboard?.writeText) {
      return;
    }
    await navigator.clipboard.writeText(result.memoReadySummary);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1200);
  }

  return (
    <AnimatePresence>
      <motion.aside className="review-intelligence-backdrop" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
        <motion.section className="review-intelligence-drawer" initial={{ x: 420 }} animate={{ x: 0 }} exit={{ x: 420 }} transition={{ duration: 0.22 }}>
          <div className="review-intelligence-head">
            <div>
              <span className="status-chip confirmed">Review Intelligence</span>
              <h3>Verified from the current analysis snapshot</h3>
              <p>Every explanation is grounded in the current analysis snapshot. Deterministic valuation remains the source of truth.</p>
            </div>
            <button aria-label="Close Review Intelligence drawer" type="button" onClick={onClose}>
              <X size={20} />
            </button>
          </div>

          {result.verification.ok ? (
            <div className="review-intelligence-content">
              <section className="ri-card">
                <div className="ri-card-head">
                  <div>
                    <span className="ri-kicker">Verdict</span>
                    <h3>{result.verdict.label}</h3>
                  </div>
                  <span className="status-chip confirmed">{result.source === "llm_verified" ? "LLM verified" : "Deterministic"}</span>
                </div>
                <p>{result.verdict.summary}</p>
              </section>

              <section className="ri-card">
                <div className="ri-card-head">
                  <div>
                    <span className="ri-kicker">Strongest Comparable</span>
                    <h3>{result.strongestComparable?.address ?? "Unavailable"}</h3>
                  </div>
                </div>
                <p>{result.strongestComparable?.reason ?? "No strongest comparable is available."}</p>
              </section>

              <section className="ri-card">
                <div className="ri-card-head">
                  <div>
                    <span className="ri-kicker">Weakest Comparable</span>
                    <h3>{result.weakestSelectedComparable?.address ?? "Unavailable"}</h3>
                  </div>
                </div>
                <p>{result.weakestSelectedComparable?.reason ?? "No weakest comparable is available."}</p>
              </section>

              <section className="ri-card">
                <div className="ri-card-head">
                  <div>
                    <span className="ri-kicker">Confidence Rationale</span>
                    <h3>{result.insight.confidenceRationale.label}</h3>
                  </div>
                </div>
                <p>{result.insight.confidenceRationale.explanation}</p>
              </section>

              <section className="ri-card">
                <div className="ri-card-head">
                  <div>
                    <span className="ri-kicker">Key Evidence</span>
                    <h3>Verified support points</h3>
                  </div>
                </div>
                <ul className="ri-list">
                  {result.insight.keyEvidence.map((item) => (
                    <li key={item.point}>{item.point}</li>
                  ))}
                </ul>
              </section>

              <section className="ri-card">
                <div className="ri-card-head">
                  <div>
                    <span className="ri-kicker">Key Risks</span>
                    <h3>Review before export</h3>
                  </div>
                </div>
                <ul className="ri-list">
                  {result.insight.keyRisks.map((item) => (
                    <li key={item.risk}>
                      <strong>{item.severity.toUpperCase()}</strong> {item.risk}
                    </li>
                  ))}
                </ul>
              </section>

              <section className="ri-card">
                <div className="ri-card-head">
                  <div>
                    <span className="ri-kicker">Analyst Questions</span>
                    <h3>Open review items</h3>
                  </div>
                </div>
                <ul className="ri-list">
                  {result.analystQuestions.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </section>

              <section className="ri-card">
                <div className="ri-card-head">
                  <div>
                    <span className="ri-kicker">Next Action</span>
                    <h3>Recommended step</h3>
                  </div>
                </div>
                <p>{result.nextAction}</p>
              </section>

              <section className="ri-card">
                <div className="ri-card-head">
                  <div>
                    <span className="ri-kicker">Memo-Ready Summary</span>
                    <h3>Export-safe summary</h3>
                  </div>
                  {attached && (
                    <span className="status-chip confirmed">
                      <ShieldCheck size={14} aria-hidden />
                      Attached
                    </span>
                  )}
                </div>
                <p>{result.memoReadySummary}</p>
              </section>

              <section className="ri-card">
                <div className="ri-card-head">
                  <div>
                    <span className="ri-kicker">Limitations</span>
                    <h3>Required boundaries</h3>
                  </div>
                </div>
                <ul className="ri-list">
                  {result.limitations.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </section>

              <ClaimLedger claims={claims} facts={packet.facts} open={ledgerOpen} />
            </div>
          ) : (
            <section className="ri-card ri-fallback">
              <div className="ri-card-head">
                <div>
                  <span className="ri-kicker">Review Intelligence</span>
                  <h3>Verified insight withheld</h3>
                </div>
              </div>
              <p>The current narrative did not pass verifier checks, so only the safe summary remains visible.</p>
              <p>{result.memoReadySummary}</p>
              <ul className="ri-list">
                {result.limitations.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
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
  );
}
