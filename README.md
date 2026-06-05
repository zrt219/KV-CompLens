# KV CompLens

<img width="1024" height="1024" alt="kv_complens_banner_1780644632429" src="https://github.com/user-attachments/assets/f1f95e29-6db1-43bf-b4d8-b88133781004" />

KV CompLens is a deterministic underwriting-support prototype for Alberta residential comparable-property analysis, built for the KV Capital AI Engineer Hackathon.

It is not a real-estate chatbot, appraisal engine, credit decision system, MLS ingestion product, or production underwriting platform. It is a reviewer-facing AI product surface that demonstrates how comparable evidence can be retrieved, scored, adjusted, reconciled, documented, and exported with transparent deterministic logic.

## Live Project

- Public app: [kv-complens.vercel.app](https://kv-complens.vercel.app)
- Repository: [zrt219/KV-CompLens](https://github.com/zrt219/KV-CompLens)
- Hackathon build log: [ai-engineering/hackathon/kv-complens-build-log.md](ai-engineering/hackathon/kv-complens-build-log.md)
- Final handoff index: [ai-engineering/hackathon/kv-complens-final-handoff.md](ai-engineering/hackathon/kv-complens-final-handoff.md)
- Engineering source of truth: [ai-engineering/source-of-truth.md](ai-engineering/source-of-truth.md)
- Stack: `Next.js`, `React`, `TypeScript`, `Vitest`

## Builder / Proof of Work

Built by ZRT / Zhane Grey.

- GitHub: [github.com/zrt219](https://github.com/zrt219)
- Live demo: [kv-complens.vercel.app](https://kv-complens.vercel.app)
- LinkedIn: [zhane-grey-987258395](https://www.linkedin.com/in/zhane-grey-987258395)
- Portfolio: TODO

## Reviewer Summary

KV CompLens separates deterministic valuation from reviewer-facing explanation. A cross-platform evidence model ranks comparable sales from structured inputs and source reliability, while Review Intelligence V2 converts only verified snapshot facts into a public reasoning layer that can be attached to export artifacts.

The project is designed to show:

- deterministic comparable ranking and evidence reconciliation
- reviewable adjustment logic and value-range framing
- human-in-the-loop workflow design
- snapshot-driven export generation
- verified public reasoning artifacts without exposing chain-of-thought
- truthful demo-data boundaries and employer-safe copy
- evidence-driven QA and handoff documentation

## Rubric Alignment

| Dimension | Evidence in This Repo |
|-----------|----------------------|
| **Code quality** | `packages/core/` plus `tests/` with 64 passing tests across 19 files |
| **Agent and LLM design** | `lib/review-intelligence-v2/` grounded in deterministic snapshot facts and verified before export |
| **ML and data thinking** | `packages/core/scoring.ts`, `packages/core/sourceReliability.ts`, `packages/core/valuation.ts` |
| **Communication** | This README, `PRODUCT.md`, `.ralphplan/`, and `ai-engineering/` handoff docs |
| **Pragmatism** | Synthetic data labeling, scope cuts, local-first review flow, and explicit non-production boundaries |

## End-To-End Workflow

```txt
Subject Intake
-> Source Scan
-> Review Comparables
-> Adjustments
-> Export Package
```

Detailed review surfaces live inside those five steps:

- discovery and deeper candidate exploration stay inside the review step
- adjustment tables and range impact stay inside the adjustments step
- memo content and export generation stay inside the export step
- Review Intelligence V2 only appears in export after explicit `Add to Memo`

Core deterministic state flow:

```txt
subject + candidates
-> run evidence pipeline
-> analysis snapshot
-> reducer state
-> selectors
-> UI screens
```

## Review Intelligence V2

Review Intelligence V2 is a deterministic, verifier-gated reasoning layer built from `PceAnalysisSnapshot` only.

No retrieved fact, no claim.

The LLM layer does not determine value. It explains verified PCE-V2 evidence.

Review Intelligence exposes public reasoning artifacts, not raw chain-of-thought.

It provides:

- verdict, strongest comparable, and weakest comparable
- per-comparable `Why this comparable?` reasoning on the Evidence Board
- counterfactual checks that rerun the deterministic pipeline with one selected comparable removed
- analyst questions and limitations
- memo-ready summary and optional claim-ledger appendix
- explicit attachment state recorded as `review_intelligence_v2_added_to_memo`

It does not:

- determine value
- replace the deterministic valuation pipeline
- expose chain-of-thought
- claim live MLS, appraisal, or credit-decision authority

## Architecture

```txt
src/app/page.tsx                    Main underwriting workspace
src/app/globals.css                 Product styling and responsive layout
src/app/api/export/route.ts         Server-backed export route
hooks/usePceAnalysis.ts             Reducer-driven UI state and selectors
lib/pce/runPcePipeline.ts           Canonical UI-facing evidence snapshot pipeline
lib/pce/exportPackage.ts            PDF/CSV/MD/TXT/ZIP export generation
lib/review-intelligence-v2/*        Deterministic review-intelligence packet, verdict, verifier, and counterfactual analysis
src/components/review-intelligence-v2/*  Review drawer, verdict, summary, and claim-ledger UI
src/components/evidence-board/*     Evidence Board comparable review surface
packages/core/*                     Deterministic scoring, adjustments, valuation, confidence, and memo modules
tests/*.test.ts                     UI state, export, and review-intelligence tests
packages/core/*.test.ts             Core deterministic model tests
```

## Product Surfaces

### Source Scan

The source-scan screen simulates a multi-source underwriting evidence pass using structured demo data. It summarizes source count, records found, normalized records, reliability bands, matched-field coverage, and deduplication.

Boundary: this is a local synthetic/public-style simulation, not live MLS or land-title ingestion.

### Review Comparables

The review step centers on the Evidence Board rather than a map because the workflow is about comparable evidence, not cartography.

The board includes:

- centered subject card
- selected comparable cards
- searchable selected comparable surface
- per-comparable reasoning toggles
- right-rail valuation and comparable detail
- `Explain Review Set` access to Review Intelligence V2

### Adjustments

The adjustments step shows deterministic line-level adjustments for location, living area, lot size, age/condition, beds/baths, amenities, and risk penalties.

The goal is not appraisal-grade calibration. The goal is reviewable adjustment logic.

### Export Package

The export step turns snapshot facts into structured analyst-readable sections:

1. executive summary
2. subject summary
3. source scan summary
4. selected comparables
5. adjustment logic
6. value conclusion
7. confidence and risk
8. limitations

When attached, export artifacts also include a `Review Intelligence Summary` with verdict, strongest and weakest comparable, memo-ready summary, limitations, and audit state. Raw agent reasoning traces and chain-of-thought are excluded from export artifacts.

## Export Resilience Layer

KV CompLens uses a layered export strategy so the Export Package page does not become a dead end if one renderer or browser download path fails.

1. Native PDF and DOCX generation from the canonical `ExportPacket`.
2. Print-ready HTML and Word-compatible HTML/RTF fallbacks.
3. Full evidence package ZIP containing HTML, Markdown, JSON, CSV, audit, and limitations files.
4. Copy-report fallback if browser downloads are blocked.

Browser downloads can vary by environment. If native PDF generation fails, the app opens a print-ready report that can be saved as PDF from the browser print dialog. If DOCX generation fails, the app generates a Word-compatible `.doc` or `.rtf` fallback. The ZIP evidence package preserves the review data even when binary renderers fail.

Local/demo failure simulation flags:

- `?failPdf=1` forces native PDF failure and verifies print fallback.
- `?failDocx=1` forces native DOCX failure and verifies Word-compatible fallback.
- `?failDownloads=1` simulates blocked browser downloads and verifies copy/report fallback.

## Audit And Provenance

The app maintains an audit-oriented state through:

- source-scan summaries
- selected and rejected comparable sets
- generated memo facts
- deterministic audit events
- `review_intelligence_v2_added_to_memo` attachment events
- explicit demo-data and public-source boundaries
- verified export artifacts

Public-source provenance is reference-only and does not claim direct sold-data provenance for synthetic records.

## Public Data References

Public assessment and municipal references used for context:

- [City of Edmonton Property Assessment Data](https://data.edmonton.ca/City-Administration/Property-Assessment-Data-Current-Calendar-Year-/q7d6-ambg)
- [City of Calgary Historical Property Assessments](https://data.calgary.ca/Government/Historical-Property-Assessments-Parcel-/4ur7-wsgc/data)
- [City of Calgary Residential Assessment Explanation](https://www.calgary.ca/PDA/Assessment/Pages/Residential-property-assessments.aspx?master=nav)

These are methodology and provenance references only. They are not transaction-level source records for synthetic comparable sales.

## How To Run

```bash
npm install
npm run dev
```

Then open the local URL reported by the Next.js dev server.

## How To Verify

```bash
npm run lint
npm test
npm run build
```

Latest verified status:

- `npm run lint` passed with legacy unused-helper warnings only
- `npm test` passed with 73 tests across 22 files
- `npm run build` passed
- local browser QA captured `qa-screenshots/2026-06-04-*`
- export artifacts regenerated under `artifacts/exports/*2026-06-04*`

## Known Limitations

- Sale records are synthetic demo records
- No licensed MLS sold-data feed is ingested
- No live land-title, appraisal, or permit connector is active
- Adjustments are deterministic review heuristics
- No analyst authentication, team review workflow, or persistent storage
- No production credit-decision capability

## Demo Script

1. Load the example property in Intake.
2. Show the source counts and quality summary in Sources.
3. Open Review Comparables and explain the Evidence Board.
4. Open `Explain Review Set` and show Review Intelligence V2.
5. Click `Add to Memo` so the verified summary becomes exportable.
6. Move to Adjustments and confirm the deterministic adjustment table.
7. Lock the review set and open Export Package.
8. Show the `Review Intelligence Summary` and generate the artifact bundle.

## Resume-Safe Summary

Built and verified a deterministic Next.js underwriting-support prototype that ranks synthetic comparable sales, reconciles adjusted value ranges, exposes a verifier-gated public reasoning layer, and exports snapshot-driven review artifacts with documented QA evidence.

## Notes

- The repo includes synthetic demo data, generated property placeholder images, export artifacts, and engineering logs so reviewers can inspect the full build record.
- The canonical hackathon execution record is [ai-engineering/hackathon/kv-complens-build-log.md](ai-engineering/hackathon/kv-complens-build-log.md).
- Deployment and reviewer-facing copy claims must follow [ai-engineering/source-of-truth.md](ai-engineering/source-of-truth.md).
