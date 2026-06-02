# KV CompLens

KV CompLens is a deterministic underwriting-support prototype for Alberta residential comparable-property analysis. It is built as a reviewer-facing product surface for the KV Capital AI Engineer Hackathon, not as a generic real-estate chatbot and not as an automated appraisal engine.

KV CompLens separates deterministic valuation logic from AI-style explanation. The PCE-V2 engine ranks comparable sales from structured inputs and evidence reliability, while the product layer turns computed facts into an analyst-readable comp packet, underwriting memo, and audit trail.

## Featured Project Metadata

- Project: `KV CompLens`
- Repository: [zrt219/KV-CompLens](https://github.com/zrt219/KV-CompLens)
- Stack: `Next.js`, `React`, `TypeScript`, `Vitest`, deterministic domain modules
- Role: product engineering, workflow architecture, explainable AI systems design
- Verified locally: `npm run lint`, `npm test`, `npm run build`
- Public deployment: https://kv-complens.vercel.app

## What It Is

- A local comparable-analysis workspace for human underwriters
- A deterministic PCE-V2 evidence-fusion engine
- A multi-step workflow covering subject intake, source scan, ranking, adjustment review, value reconciliation, memo/report, and export review
- A demo that makes business values inspectable instead of hiding them behind opaque AI output

## What It Is Not

- Not a live appraisal
- Not a credit decision
- Not an MLS ingestion product
- Not a production underwriting platform
- Not a map-rendering exercise

This is an underwriting-support prototype. It is not a live appraisal, not a credit decision, and uses synthetic/public-style demonstration data. Analyst review is required.

## Problem Understanding

KV Capital underwriters need a fast, defensible way to:

1. identify plausible comparable sales
2. rank them transparently
3. adjust them consistently
4. reconcile a reasonable value range
5. produce a reviewable memo and audit trail

The prototype focuses on the reasoning path, not on external integrations. That means deterministic scoring, explicit evidence quality, transparent adjustments, and a human-readable output packet.

## Why This Scope

The project intentionally avoids:

- paid APIs
- live MLS sold-data feeds
- auth and user management
- database infrastructure
- hidden LLM valuation logic
- production claims that cannot be verified

That constraint is a product decision, not a missing feature. The goal is to show a credible underwriting workflow that can be inspected line by line during technical review.

## End-to-End Workflow

```txt
Subject Intake
-> Source Scan
-> Candidate Ranking
-> Comparable Analysis (Evidence Board)
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
hooks/usePceAnalysis.ts             Reducer-driven UI state and selectors
lib/pce/runPcePipeline.ts           Canonical UI-facing PCE-V2 snapshot pipeline
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

## PCE-V2 Deterministic Engine

PCE-V2 treats each comparable as uncertain evidence about a hidden subject value. It remains deterministic code throughout the ranking and valuation path.

Core ingredients:

- similarity kernels for location, size, recency, beds/baths, age, and condition
- bounded comparable probability
- MAD-based price-per-square-foot outlier detection
- source reliability priors
- uncertainty-aware evidence weights
- weighted value reconciliation
- confidence scoring from spread, risk, sample quality, and effective evidence count
- marginal information gain for candidate surfacing

The pipeline organizes existing deterministic core functions:

- `runSourceScan`
- `rankComparables`
- `adjustComparableValue`
- `estimateValuationRange`
- `generateUnderwritingMemo`
- `previewCandidateImpact`

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

## Source Scan Simulation

The source-scan screen simulates a multi-source underwriting evidence pass using structured demo data. It summarizes:

- sources scanned
- records found
- normalized records
- unique candidates
- reliability bands
- matched-field coverage
- deduplication results

The boundary is explicit: this is a local synthetic/public-style simulation, not a live MLS or land-title ingestion service.

## Candidate Ranking

Candidates are scored deterministically on:

- location proximity
- property type compatibility
- size similarity
- bed/bath similarity
- sale recency
- age/condition similarity
- price-per-square-foot consistency
- risk penalties
- source quality

Ranking outputs include:

- match score
- comparable probability
- risk flags
- evidence weight inputs
- selected vs remaining candidate sets
- lower-ranked / rejected explanations

## Evidence Board Decision

The default Comparable Analysis screen uses an Evidence Board instead of a map because the workflow is about comparable evidence, not cartography.

The shipped default view is intentionally:

- a blank calm canvas
- a centered subject card
- up to five selected comparables
- one active evidence link at a time
- right-rail evidence facts driven from selector output

Distance and spatial logic still exist in the deterministic model. They are expressed through computed metrics and evidence quality, not through decorative geography.

## Adjustment Review

The adjustment review flow compares the subject against selected comparables and shows reviewable deterministic adjustments such as:

- location
- living area
- lot size
- age / condition
- beds / baths
- amenities
- penalties / credits

The purpose is not to imply appraisal-grade coefficient calibration. The purpose is to keep the adjustment logic explicit enough that an analyst can inspect the path from raw sale price to adjusted indication.

## Value Reconciliation

Value reconciliation aggregates adjusted comparable evidence into:

- low estimate
- point estimate
- high estimate
- confidence score
- weighted contribution by comparable
- scenario framing

The reconciliation view exists to show why the range moved, not just what the final number is.

## Memo / Report / Export

KV CompLens turns computed facts into an analyst-readable output surface. The memo/report flow is facts-constrained and derived from snapshot state.

Memo content is structured around:

1. executive summary
2. subject summary
3. source scan summary
4. selected comparables
5. adjustment logic
6. value conclusion
7. confidence / risk
8. limitations

The export package modal is part of the review workflow. It should be described as a demo package-generation surface unless a full file-generation path is explicitly verified.

## Audit / Provenance

The app maintains a deterministic audit-oriented state through:

- source-scan summaries
- selected / rejected comparable sets
- generated memo facts
- structured audit events from the PCE snapshot
- explicit demo-data and public-source boundaries

Public-source provenance is reference-only and does not claim direct sold-data provenance for synthetic records.

## Public Data Calibration References

Public assessment and municipal references used for context:

- [City of Edmonton Property Assessment Data](https://data.edmonton.ca/City-Administration/Property-Assessment-Data-Current-Calendar-Year-/q7d6-ambg)
- [City of Calgary Historical Property Assessments](https://data.calgary.ca/Government/Historical-Property-Assessments-Parcel-/4ur7-wsgc/data)
- [City of Calgary Residential Assessment Explanation](https://www.calgary.ca/PDA/Assessment/Pages/Residential-property-assessments.aspx?master=nav)

These are methodology/provenance references only. They are not treated as transaction-level source records for synthetic comparable sales.

## Data Limitations

- Sale records are synthetic demo records
- No licensed MLS sold-data feed is ingested
- No live land-title, appraisal, or permit connector is active
- Adjustment coefficients are deterministic heuristics
- Export/document generation is not described as production-grade unless separately verified

## Analyst Review Disclaimer

This is an underwriting-support prototype. It is not a live appraisal, not a credit decision, and uses synthetic/public-style demonstration data. Analyst review is required.

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

Current local verification covers:

- deterministic scoring
- probability utilities
- outlier detection
- source reliability
- valuation and confidence
- marginal information gain
- PCE snapshot behavior
- reducer/selectors
- UI-facing integration contracts

## Known Limitations

- Public Vercel deployment is Browser-verified at https://kv-complens.vercel.app
- Export is positioned as a demo workflow unless end-to-end file generation is verified
- No analyst authentication, team review workflow, or persistent storage
- No calibration against licensed sold-data outcomes
- No production credit-decision capability

## What I Would Build Next

- licensed or internal sold-data connectors with provenance controls
- analyst approval states and saved review packets
- stronger exception handling for large adjustments
- scenario exports with verified document-generation paths
- reviewer collaboration and audit-note persistence

## Loom Demo Script

1. Start at Subject Intake and show the seeded subject facts.
2. Move to Source Scan and show structured evidence counts.
3. Open Candidate Ranking and explain deterministic scoring.
4. Open Comparable Analysis and show the Evidence Board default.
5. Click `Find More Comparables`.
6. Review the surfaced candidate and add it into the selected set.
7. Show the updated selected comparable, valuation range, and toast state.
8. Move to Adjustment Review and explain line-level adjustments.
9. Move to Value Reconciliation and explain weighted contribution.
10. Move to Memo / Report and show the analyst-readable packet.
11. Open Export Package and explain the package options and current demo boundary.

## IP / Usage Note

Based on the public hackathon terms, KV Capital receives a non-exclusive right to reference and demo this work, while the code remains mine. No proprietary UMATTR, Ralphplan AI, employer, client, or private production code is included.

## Verification Snapshot

Latest verified local checks during this workspace session:

- `npm run lint` - passed
- `npm test` - passed (`41` tests across `16` files)
- `npm run build` - passed

## Resume-Safe Summary

- Built a deterministic underwriting-support prototype that ranks synthetic comparable sales, recalculates selected-comparable evidence through a PCE-V2 snapshot pipeline, and turns computed facts into an analyst-readable review packet.
