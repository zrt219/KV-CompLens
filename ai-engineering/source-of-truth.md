# KV CompLens Source Of Truth

Date refreshed: 2026-06-04

This file records the standing reviewer-facing guardrails for KV CompLens. README, handoff docs, export copy, and deployment claims should stay consistent with these rules.

## Deployment Guardrail

- Treat KV CompLens as a `Next.js` app on Vercel.
- Keep `vercel.json` configured with `framework: "nextjs"`.
- Do not create or describe this project as a generic Vercel `Other/public` deployment.
- Do not claim deployment success from Vercel `READY` alone.
- Browser-verify the live public URL before making deployment claims.
- The verified public URL is [https://kv-complens.vercel.app](https://kv-complens.vercel.app).

## Reviewer-Facing Product Guardrail

- Deterministic valuation is the source of truth.
- Normal mode must expose `Review Intelligence Summary`, not `Agent Reasoning Trace`.
- Review Intelligence V2 must be grounded in `PceAnalysisSnapshot` facts only.
- Review intelligence attaches to export only after explicit `Add to Memo`.
- Export artifacts must stay employer-safe and reviewer-safe.

## Copy Boundary Guardrail

- Demo data must stay labeled `LOCAL ONLY` and `SIMULATED HOME SALES`.
- Use boundary language that states the product is not live MLS, not an appraisal, and not a credit decision.
- Do not claim analyst replacement, automated approval authority, or production underwriting deployment.
- Do not expose chain-of-thought or assistant-trace copy in the normal reviewer flow.

## Verification Guardrail

- Required repo checks: `npm run lint`, `npm test`, `npm run build`.
- Final handoff should include browser QA evidence and regenerated export artifacts.
- Current final QA evidence lives in `.ralphplan/browser-qa.md`, `.ralphplan/final-verification.md`, and `qa-screenshots/2026-06-04-*`.
