# KV CompLens

KV CompLens is a deterministic underwriting-support prototype for Alberta residential comparable-property analysis, built for the KV Capital AI Engineer Hackathon.

It is not a real-estate chatbot, appraisal engine, credit decision system, MLS ingestion product, or production underwriting platform. It is a reviewer-facing AI product surface that demonstrates how comparable evidence can be retrieved, scored, adjusted, reconciled, documented, and exported with transparent deterministic logic.

## Live Project

- Public app: [kv-complens.vercel.app](https://kv-complens.vercel.app)
- Repository: [zrt219/KV-CompLens](https://github.com/zrt219/KV-CompLens)
- Hackathon build log: [ai-engineering/hackathon/kv-complens-build-log.md](ai-engineering/hackathon/kv-complens-build-log.md)
- Engineering source of truth: [ai-engineering/source-of-truth.md](ai-engineering/source-of-truth.md)
- Stack: `Next.js`, `React`, `TypeScript`, `Vitest`, deterministic domain modules
- Verified gates: `npm run lint`, `npm test`, `npm run build`, Browser-verified Vercel deployment

## Reviewer Summary

KV CompLens separates deterministic valuation logic from AI-style explanation. The PCE-V2 engine ranks comparable sales from structured inputs and evidence reliability, while the product layer turns computed facts into an analyst-readable comp packet, memo, audit trail, and export workflow.

The project is designed to show:

- product engineering under a tight hackathon scope
- deterministic comparable ranking and evidence fusion
- transparent adjustment and value reconciliation logic
- human-in-the-loop underwriting workflow design
- accessibility-aware product UI and truthful demo-state labeling
- evidence-driven verification and release documentation

## Hackathon Build Log

The full execution record lives in [ai-engineering/hackathon/kv-complens-build-log.md](ai-engineering/hackathon/kv-complens-build-log.md).

That log records:

- the original hackathon prompt and constraints
- Ralphplan three-lane operating model
- product, data, core logic, frontend, UI/UX, and QA workstreams
- PCE-V1 and PCE-V2 implementation milestones
- Browser-driven UI repair passes
- export artifact verification
- GitHub publication evidence
- Vercel 404/protection repair and final Browser verification
- resume-safe bullets grounded in verified work

Key verified outcomes from the log:

- deterministic PCE-V2 snapshot pipeline
- reducer-driven UI state and selector-backed view models
- Evidence Board comparable-analysis surface
- source reliability and provenance boundaries
- adjustment review and value reconciliation flows
- facts-only memo/report surface
- persisted multi-format export artifacts
- public deployment repaired and Browser-verified at [kv-complens.vercel.app](https://kv-complens.vercel.app)

## What It Is

- A local comparable-analysis workspace for human underwriters
- A deterministic probabilistic comparable-evidence engine
- A multi-step review flow from subject intake to memo/export
- A product proof layer for explainable AI underwriting support
- A demo with explicit synthetic-data and public-source boundaries

## What It Is Not

- Not a live appraisal
- Not a credit decision
- Not a production underwriting platform
- Not an MLS, land-title, permit, or appraisal-feed connector
- Not an opaque LLM valuation workflow

Analyst review is required. All sale records are synthetic demo data.

## Problem

Underwriters need a fast, defensible way to:

1. identify plausible comparable sales
2. rank them transparently
3. adjust them consistently
4. reconcile a reasonable value range
5. produce a reviewable memo and audit trail

KV CompLens focuses on the reasoning path rather than external integrations. The prototype makes the business logic inspectable through deterministic code, evidence labels, risk flags, and review screens.

## Scope Decisions

The project intentionally avoids:

- paid APIs
- live MLS sold-data feeds
- authentication and user management
- database infrastructure
- hidden LLM valuation logic
- unverified production claims

This is a deliberate hackathon architecture choice. The goal is to show a credible underwriting workflow that can be reviewed line by line.

## End-To-End Workflow

```txt
Subject Intake
-> Source Scan
-> Candidate Ranking
-> Comparable Analysis / Evidence Board
-> Comp Discovery / Find More Comparables
-> Adjustment Review
-> Value Reconciliation
-> Report Ready
-> Memo / Report
-> Export Package
```

Core deterministic state flow:

```txt
subject + candidates
-> runPcePipeline()
-> PceAnalysisSnapshot
-> reducer state
-> selectors
-> UI screens
```

## Architecture

```txt
src/app/page.tsx                    Main underwriting workspace
src/app/globals.css                 Product styling and responsive layout
src/app/api/export/route.ts         Server-backed export route
hooks/usePceAnalysis.ts             Reducer-driven UI state and selectors
lib/pce/runPcePipeline.ts           Canonical UI-facing PCE-V2 snapshot pipeline
lib/pce/exportPackage.ts            PDF/CSV/MD/TXT/ZIP export generation
lib/*                               UI-facing domain re-exports
packages/core/scoring.ts            Deterministic comparable scoring
packages/core/probability.ts        Probability utilities
packages/core/outliers.ts           MAD-based outlier detection
packages/core/sourceReliability.ts  Reliability priors / evidence quality
packages/core/adjustments.ts        Deterministic adjustment engine
packages/core/valuation.ts          Value-range estimation
packages/core/confidence.ts         Confidence model
packages/core/marginalImpact.ts     Marginal information gain
packages/core/modelFusion.ts        Submodel fusion diagnostics
packages/core/sourceScan.ts         Source-scan summary engine
packages/core/memo.ts               Facts-only memo generation
packages/core/provenance.ts         Public-source provenance boundary
tests/*.test.ts                     UI state and pipeline tests
packages/core/*.test.ts             Core deterministic model tests
```

## PCE-V2 Engine

PCE-V2 treats each comparable as uncertain evidence about a hidden subject value. It remains deterministic code throughout the ranking and valuation path.

Core ingredients:

- similarity kernels for location, size, recency, beds/baths, age, and condition
- bounded comparable probability
- MAD-based price-per-square-foot outlier detection
- source reliability priors
- evidence energy and uncertainty-aware weights
- residual-buffered value reconciliation
- confidence scoring from spread, risk, sample quality, and effective evidence count
- marginal information gain for candidate surfacing

The UI-facing snapshot includes:

- `subject`
- `sourceScan`
- `rankedComparables`
- `selectedComparables`
- `rejectedComparables`
- `remainingCandidates`
- `valuation`
- `memo`
- `auditEvents`
- `activeComparableId`
- `generatedAt`

## Product Surfaces

### Source Scan

The source-scan screen simulates a multi-source underwriting evidence pass using structured demo data. It summarizes source count, records found, normalized records, reliability bands, matched-field coverage, and deduplication.

Boundary: this is a local synthetic/public-style simulation, not live MLS or land-title ingestion.

### Candidate Ranking

Candidates are scored deterministically on location proximity, property type, size similarity, bed/bath similarity, recency, condition, price-per-square-foot consistency, risk penalties, and source quality.

Ranking outputs include match score, comparable probability, risk flags, evidence weights, selected sets, remaining candidates, and lower-ranked explanations.

### Evidence Board

The default comparable-analysis screen uses an Evidence Board rather than a map because the workflow is about comparable evidence, not cartography.

The board includes:

- centered subject card
- selected comparable cards
- active evidence links
- source/risk labels
- right-rail valuation and comparable details
- searchable selected comparable surface

### Adjustment Review

The adjustment review flow shows deterministic line-level adjustments for location, living area, lot size, age/condition, beds/baths, amenities, and risk penalties.

The goal is not appraisal-grade coefficient calibration. The goal is reviewable adjustment logic.

### Value Reconciliation

Value reconciliation aggregates adjusted comparable evidence into a low estimate, point estimate, high estimate, confidence score, comparable contribution, and scenario framing.

### Memo / Report / Export

The memo/report flow turns snapshot facts into structured analyst-readable sections:

1. executive summary
2. subject summary
3. source scan summary
4. selected comparables
5. adjustment logic
6. value conclusion
7. confidence / risk
8. limitations

The export workflow has verified package generation for PDF, CSV, Markdown, TXT, and ZIP outputs from the deterministic snapshot.

## Audit And Provenance

The app maintains an audit-oriented state through:

- source-scan summaries
- selected and rejected comparable sets
- generated memo facts
- deterministic audit events
- explicit demo-data and public-source boundaries
- verified export artifacts

Public-source provenance is reference-only and does not claim direct sold-data provenance for synthetic records.

## Public Data References

Public assessment and municipal references used for context:

- [City of Edmonton Property Assessment Data](https://data.edmonton.ca/City-Administration/Property-Assessment-Data-Current-Calendar-Year-/q7d6-ambg)
- [City of Calgary Historical Property Assessments](https://data.calgary.ca/Government/Historical-Property-Assessments-Parcel-/4ur7-wsgc/data)
- [City of Calgary Residential Assessment Explanation](https://www.calgary.ca/PDA/Assessment/Pages/Residential-property-assessments.aspx?master=nav)

These are methodology/provenance references only. They are not transaction-level source records for synthetic comparable sales.

## Deployment Guardrail

The permanent deployment rule is stored in [ai-engineering/source-of-truth.md](ai-engineering/source-of-truth.md).

For this Next.js app:

- keep `vercel.json` configured with `framework: "nextjs"`
- do not create a generic Vercel `Other/public` project
- do not claim deployment success from Vercel `READY` alone
- verify the live public URL with Browser
- the page must render `KV CompLens` and must not show `404: NOT_FOUND` or Vercel login

## How To Run

```bash
npm install
npm run dev
```

Then open the local Next.js URL reported by the dev server.

## How To Test

```bash
npm run lint
npm test
npm run build
```

Latest verified coverage includes:

- deterministic scoring
- probability utilities
- outlier detection
- source reliability
- valuation and confidence
- marginal information gain
- PCE snapshot behavior
- reducer/selectors
- export package generation
- UI-facing integration contracts

## Verified Status

- `npm run lint` passed
- `npm test` passed with 46 tests across 17 files
- `npm run build` passed
- Vercel production deployment is Browser-verified at [kv-complens.vercel.app](https://kv-complens.vercel.app)
- GitHub source is published at [zrt219/KV-CompLens](https://github.com/zrt219/KV-CompLens)

## Known Limitations

- Sale records are synthetic demo records
- No licensed MLS sold-data feed is ingested
- No live land-title, appraisal, or permit connector is active
- Adjustment coefficients are deterministic heuristics
- No analyst authentication, team review workflow, or persistent storage
- No production credit-decision capability
- Public OpenStreetMap tiles are acceptable for demo screenshots, but production use should use an appropriate tile provider or self-hosted tiles

## What I Would Build Next

- licensed or internal sold-data connectors with provenance controls
- analyst approval states and saved review packets
- exception handling for large adjustments
- scenario exports with richer document templates
- reviewer collaboration and audit-note persistence
- persistent case storage and role-based access control

## Demo Script

1. Start at Subject Intake and show seeded subject facts.
2. Move to Source Scan and show structured evidence counts.
3. Open Comparable Analysis and explain the Evidence Board.
4. Click `Find More Comparables`.
5. Review the surfaced candidate and add it into the selected set.
6. Show the updated selected comparables, valuation range, and audit event.
7. Move to Adjustment Review and explain line-level adjustments.
8. Move to Value Reconciliation and explain weighted contribution.
9. Move to Memo / Report and show the structured memo packet.
10. Open Export Package and explain the verified package outputs.

## IP / Usage Note

Based on the public hackathon terms, KV Capital receives a non-exclusive right to reference and demo this work, while the code remains mine. No proprietary UMATTR, Ralphplan AI, employer, client, or private production code is included.

## Resume-Safe Summary

Built and Browser-verified a deterministic Next.js underwriting-support prototype that ranks synthetic comparable sales, models evidence reliability through a PCE-V2 snapshot pipeline, reconciles adjusted value ranges, produces a structured analyst memo, exports review artifacts, and documents the build through a hackathon engineering log.

## Deployment

This project is deployed on Vercel.

Current live URL:

- [https://kv-complens.vercel.app](https://kv-complens.vercel.app)

GitHub repository:

- [https://github.com/zrt219/KV-CompLens](https://github.com/zrt219/KV-CompLens)

## Notes

- The repo includes synthetic demo data, generated property placeholder images, exported evidence artifacts, and engineering logs so reviewers can inspect the full build record.
- The canonical hackathon execution record is [ai-engineering/hackathon/kv-complens-build-log.md](ai-engineering/hackathon/kv-complens-build-log.md).
- Vercel deployment claims must follow [ai-engineering/source-of-truth.md](ai-engineering/source-of-truth.md): use explicit Next.js configuration and Browser-verify the public URL.
