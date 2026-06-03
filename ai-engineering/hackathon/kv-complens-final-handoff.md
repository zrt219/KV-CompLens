# KV CompLens Final Handoff

## Canonical Story

1. Intake
2. Sources
3. Review
4. Adjust
5. Export

The product stays deterministic at the valuation layer. The assistant trace is assistive and local-first, and it falls back to a truthful local draft when `OPENAI_API_KEY` is not configured.

## Judge Review Order

1. Read the README overview and workflow summary.
2. Open the app and confirm the 5-step shell.
3. Review the source scan and home review stages.
4. Confirm the adjustment and export screens.
5. Inspect the export bundle in `artifacts/exports`.
6. Skim the assistant trace in the export screen.

## Canonical Export Bundle

The export route and committed bundle use the following file names:

- `artifacts/exports/12345_109_St_NW_Review_2026-06-01_Property_Review_Memo.pdf`
- `artifacts/exports/12345_109_St_NW_Review_2026-06-01_Home_List.csv`
- `artifacts/exports/12345_109_St_NW_Review_2026-06-01_Adjustment_Notes.pdf`
- `artifacts/exports/12345_109_St_NW_Review_2026-06-01_Review_Summary.md`
- `artifacts/exports/12345_109_St_NW_Review_2026-06-01_Activity_Log.txt`
- `artifacts/exports/12345_109_St_NW_Review_2026-06-01_Review_Package.zip`

## Verification Gate

- `npm run lint`
- `npm test`
- `npm run build`

## Notes

- Demo data is synthetic and local-only.
- Final valuation is deterministic and reviewable.
- The assistant trace is explanatory, not the source of truth for pricing.
