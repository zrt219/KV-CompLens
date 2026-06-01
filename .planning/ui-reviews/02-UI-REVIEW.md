# Phase 2 — UI Review

**Audited:** 2026-05-31
**Baseline:** final CivicGrid visual references supplied in prompt
**Screenshots:** captured at `.planning/ui-reviews/civicgrid-20260531-232200/desktop.png`
**Verdict:** FLAG

---

## Pillar Scores

| Pillar | Score | Key Finding |
|--------|-------|-------------|
| 1. Copywriting | 3/4 | CivicGrid is clearly labeled as an abstract/demo layer, but tiny labels lose hierarchy. |
| 2. Visuals | 2/4 | Current map reads like a generic dark network board, not the final dense CivicGrid reference. |
| 3. Color | 3/4 | Palette is coherent, but low-opacity CivicGrid elements disappear behind nodes. |
| 4. Typography | 3/4 | UI typography is stable; district labels are not visually present enough. |
| 5. Spacing | 3/4 | Cards are placed without catastrophic overlap, but lower-left comp cards crowd the canvas. |
| 6. Experience Design | 3/4 | Evidence links and legend exist; view toggle implies heatmap/filter controls that are not active. |

**Overall: 17/24**

---

## Top 3 Priority Fixes

1. **Restore CivicGrid map detail hierarchy** — current screenshot lacks the visible district labels, distance rings, river spline, and corridors shown in the final reference — raise opacity/contrast for `.civic-labels`, `.civic-ring`, `.civic-river`, `.civic-corridors`, and district fills so the abstract map carries the composition before cards are noticed.
2. **Make the river and corridors feel authored, not tiled** — current background is dominated by repeated diagonal bands and rectangular grid lines, producing a generic public-map/tile feel — reduce or remove the diagonal stripe layer and emphasize the Edmonton-inspired spline plus 3-4 distinct arterial corridors.
3. **Rebalance comp-card placement around the subject** — current bottom-left cards stack tightly and obscure the lower map area — reposition node 5 lower/left or smaller, keep subject centered, and reserve clear lanes for evidence links so every comp visibly connects to the subject.

---

## Detailed Findings

### Pillar 1: Copywriting (3/4)

The component explicitly labels the layer as an abstraction at `src/components/map/CivicGridCanvas.tsx:161`-`164`, which supports the requirement to avoid claiming a literal map. The footer copy in `src/app/page.tsx:418`-`422` also explains subject, comparable, evidence link, distance ring, and corridor semantics. The weakness is visual: in the captured frame, district labels are effectively absent, so the intended CivicGrid vocabulary is not readable at first glance.

### Pillar 2: Visuals (2/4)

The final reference shows a dense authored CivicGrid: visible district names, dashed distance rings, a strong river spline, glowing corridors, and clear evidence links. The current screenshot instead shows mostly a dark grid with broad diagonal bands and property cards. The implementation has the right SVG primitives in `src/components/map/CivicGridCanvas.tsx:87`-`122`, but the captured output does not surface them strongly enough. This is a visual fidelity flag, not a structural absence.

### Pillar 3: Color (3/4)

The dark blue/black underwriting palette is consistent with the app. However, key CivicGrid layers use low alpha values: district fills/strokes in `src/app/globals.css:1506`-`1510`, labels in `src/app/globals.css:1512`-`1523`, rings in `src/app/globals.css:1536`-`1539`, radials in `src/app/globals.css:1541`-`1543`, and corridors in `src/app/globals.css:1545`-`1549`. These are too subtle in the current screenshot relative to the reference.

### Pillar 4: Typography (3/4)

The app shell and card typography hold up at desktop size. The district labels are implemented at `src/components/map/CivicGridCanvas.tsx:95`-`102` and styled at `src/app/globals.css:1512`-`1523`, but the final reference needs larger, bolder, semi-transparent labels that remain legible behind cards. Current fidelity is below target because labels are not a visible map feature.

### Pillar 5: Spacing (3/4)

Subject and comp cards avoid direct overlap, but the canvas composition is less balanced than the final reference. Fixed placement in `src/app/globals.css:1797`-`1802` creates a crowded lower-left stack between node 2 and node 5, while the right side has more breathing room. Evidence links are present via `src/components/map/CivicGridCanvas.tsx:131`-`139`, but several are visually interrupted by card placement.

### Pillar 6: Experience Design (3/4)

The CivicGrid layer is accessible as an abstract evidence map at `src/components/map/CivicGridCanvas.tsx:65`-`66`, markers include `<title>` metadata at `src/components/map/CivicGridCanvas.tsx:151`-`157`, and the legend explains symbology. The view toggle in `src/app/page.tsx:375`-`379` suggests CivicGrid/Heatmap/filter controls, but this audit sees no interaction state change in the screenshot scope. It is acceptable for visual demo, but should either be functional or visually demoted if non-interactive.

---

## Files Audited

- `src/components/map/CivicGridCanvas.tsx`
- `src/components/map/civicGridProjection.ts`
- `src/app/page.tsx`
- `src/app/globals.css`
- `.planning/ui-reviews/civicgrid-20260531-232200/desktop.png`

