# Browser QA

Date: 2026-06-04

## Local App

- URL: `http://localhost:3000/`
- Server status: localhost port 3000 accepted TCP connections during the final QA run.

## Viewports Checked

- Desktop: `1440x900`
- Mobile: `390x844`

## Flow Covered

1. Intake
2. Sources
3. Review
4. Adjust
5. Export

## Automated Browser Assertions

- Intake loaded with no tutorial visible in normal mode.
- No `Agent Reasoning Trace` text appeared on intake, sources, review, adjust, export, or mobile export.
- No horizontal overflow was detected on desktop or mobile.
- No broken images were detected.
- Review step exposed `Explain Review Set`.
- Evidence Board `Why this comparable?` expanded and rendered supporting details.
- Review Intelligence V2 drawer opened, showed `READY TO ATTACH`, and did not fall back to verifier-safe mode.
- `Add to Memo` attached the verified summary before export.
- Adjustments locked successfully after `Confirm and Lock`.
- Export step showed `Review Intelligence Summary` and `Attached to memo/export`.
- All six export options generated successfully:
  - `PDF Summary`
  - `CSV Comparable List`
  - `PDF Adjustment Notes`
  - `Markdown Summary`
  - `Text Activity Log`
  - `ZIP Review Package`

## Console / Network Notes

- No app runtime errors were detected.
- No browser console, page, or network errors were detected in the final smoke run after adding the favicon asset.

## Screenshots

- `qa-screenshots/2026-06-04-intake.png`
- `qa-screenshots/2026-06-04-sources.png`
- `qa-screenshots/2026-06-04-review.png`
- `qa-screenshots/2026-06-04-review-why-comparable.png`
- `qa-screenshots/2026-06-04-review-drawer.png`
- `qa-screenshots/2026-06-04-adjust.png`
- `qa-screenshots/2026-06-04-export.png`
- `qa-screenshots/2026-06-04-export-generated.png`
- `qa-screenshots/2026-06-04-mobile-export.png`

## QA Artifact

- Structured run report: `qa-screenshots/2026-06-04-browser-qa.json`
