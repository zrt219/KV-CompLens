# KV CompLens / PropInsight AI — Codex Master Prompt Pack

**Purpose:** Build a realistic, working, Vercel-ready AI comparable-property analysis system for the KV Capital AI Engineer hackathon.

**Total prompts:** 17  
- 14 core build prompts  
- 3 enhancement prompts  
- Designed for staged Codex execution, not one giant uncontrolled pass

---

## How to Use This File

Run these prompts sequentially in Codex.

Do **not** jump to polish before the core workflow works.

The primary workflow that must work end-to-end:

```txt
Subject Property → Existing Comparables → Find New Comparable → Review Drawer → Add to Analysis → Updated Network → Updated Valuation → Adjustment Grid → Valuation Summary → Report Ready
```

Recommended checkpoint rule:

```txt
After each prompt, run the app, check for runtime errors, fix failures, and only then continue to the next prompt.
```

Preferred validation commands:

```bash
npm install
```

```bash
npm run dev
```

```bash
npm run build
```

```bash
npm test
```

If the project does not yet have a test script, add one during the testing prompt.

---

# MASTER OPERATING CONTRACT FOR CODEX

You are Codex acting as a senior product engineer, frontend architect, QA engineer, and hackathon execution agent.

Build a realistic, production-feasible AI comparable-property analysis dashboard for the KV Capital AI Engineer hackathon.

The goal is not a fantasy 3D dashboard. The goal is a polished, believable underwriting-support UI that demonstrates:

1. Real domain understanding.
2. Deterministic comparable-property scoring.
3. Valuation confidence logic.
4. A satisfying new-comparable discovery workflow.
5. Clear human-review control.
6. Clean, testable TypeScript code.
7. A hiring-ready README and Vercel-ready build.

## Domain Context

KV Capital finances home builders in Alberta. A bottleneck in underwriting is comparable sales analysis: selecting recent comparable property sales and using them to estimate value.

This prototype should show how an AI-assisted system can reduce manual work while preserving analyst control and transparent reasoning.

## Product Name

Use one of these names consistently:

```txt
KV CompLens
```

or

```txt
PropInsight AI
```

Prefer **KV CompLens** in README and hackathon submission copy. The UI can use **PropInsight AI** as the product brand if already implemented.

## Core UX Thesis

When a new comparable property appears, the analyst should feel:

1. The system found something meaningful.
2. The reason it was surfaced is clear.
3. The analyst remains in control before accepting it.
4. Adding it updates confidence, valuation range, and activity history visibly.
5. The system feels trustworthy, fast, and professional.

## Hard Rules

Do not build:
- No cinematic 3D.
- No fake MLS integration.
- No paid API dependency.
- No auth.
- No database requirement.
- No generic chatbot-first interface.
- No hallucinated valuation claims.
- No low-contrast unreadable text.
- No overbuilt animation that hurts demo reliability.

Build:
- A working Next.js + TypeScript app.
- Local synthetic Alberta residential comp dataset.
- Deterministic scoring logic.
- Deterministic valuation logic.
- A network UI for subject/comps.
- A new-comparable review/add workflow.
- Table view.
- Adjustment grid.
- Valuation summary.
- Report-ready state.
- README.
- Core tests.

## Recommended Stack

Use:
- Next.js App Router
- TypeScript
- Tailwind CSS
- shadcn/ui-style components or local equivalents
- lucide-react icons
- @xyflow/react for the node/edge comparable network
- Framer Motion only for restrained microinteractions
- Recharts or custom CSS/SVG for simple charts/gauges
- Vitest for tests if easy to add

If dependencies are missing, install them with one-line commands only:

```bash
npm install @xyflow/react lucide-react framer-motion recharts clsx tailwind-merge
```

Optional tests:

```bash
npm install -D vitest @testing-library/react @testing-library/jest-dom jsdom
```

## Visual Direction

Use a realistic dark enterprise SaaS dashboard style:

- App background: near-black/navy.
- Panels: dark slate.
- Borders: subtle slate/blue.
- Primary action: blue.
- Success: green.
- Warning/medium status: amber.
- Subject property: amber/gold outline.
- New comparable: blue outline/glow.
- Text: high-contrast white/slate.
- Soft shadows, rounded cards, clean spacing.
- Professional fintech/proptech feel.

## Main Views

Implement these views/states:

1. Network View
2. Add Comparable Drawer
3. Comparables Table View
4. Adjustment Grid
5. Comp Discovery Map View
6. Valuation Summary
7. Report Ready

These can be route-based or state/tab-based. State/tab-based is fine for hackathon speed.

## Minimum Demo Flow

The demo must support:

1. User opens dashboard.
2. User sees subject property and existing comps.
3. User clicks “Find More Comparables” or “Simulate New Comparable”.
4. A drawer opens with a candidate comparable.
5. Drawer explains why it matches.
6. User clicks “Add to analysis”.
7. New comp appears in graph with “New” badge.
8. Confidence/value range/activity feed update.
9. User switches to Table View.
10. User switches to Adjustment Grid.
11. User switches to Valuation Summary.
12. User ends at Report Ready / Export state.

## File Organization Target

Use this structure unless the existing repo strongly suggests another:

```txt
app/
  page.tsx
  layout.tsx
  globals.css

components/
  app-shell.tsx
  sidebar.tsx
  topbar.tsx
  comparable-network.tsx
  property-node-card.tsx
  subject-property-card.tsx
  insights-panel.tsx
  add-comparable-drawer.tsx
  comparable-table.tsx
  adjustment-grid.tsx
  comp-discovery-view.tsx
  valuation-summary.tsx
  report-ready-panel.tsx
  activity-timeline.tsx
  confidence-gauge.tsx
  value-range-bar.tsx
  status-toast.tsx
  metric-card.tsx

lib/
  data.ts
  types.ts
  scoring.ts
  valuation.ts
  activity.ts
  format.ts

tests/
  scoring.test.ts
  valuation.test.ts
```

---

# PROMPT 01 — Scaffold the App Shell

## Task

Build the initial app shell for **KV CompLens / PropInsight AI**.

Create a working Next.js + TypeScript + Tailwind dashboard frame.

## Requirements

Implement:

- Dark theme app layout.
- Left sidebar.
- Top header.
- Main workspace.
- Right insights column placeholder.
- Navigation state for:
  - Network
  - Table
  - Adjustment Grid
  - Discovery
  - Valuation Summary
  - Report Ready

## UI Details

Left sidebar:
- Logo: KV CompLens or PropInsight AI
- Current Project dropdown: “Oakridge Value-Add”
- Nav items:
  - Overview
  - Subject Property
  - Comparables
  - Adjustment Grid
  - Valuation
  - Report
  - Data Sources
  - Settings
  - Help
- User area:
  - Avatar initials
  - Analyst name
  - Role

Top header:
- Page title changes by active view.
- Subtitle: “Alberta residential lending workflow”
- Buttons:
  - Filter
  - Share
  - Export Report

Central workspace:
- Placeholder cards for the future network/table/views.
- Must already look like a polished SaaS dashboard.

## Technical Rules

- Use TypeScript.
- Use small reusable components.
- Avoid hardcoded duplicated UI where simple arrays can drive nav.
- No business logic yet.
- Do not install unnecessary dependencies.

## Acceptance Criteria

- `npm run dev` works.
- Dashboard shell renders without errors.
- Sidebar active state works.
- Header actions render.
- Layout is responsive enough for desktop and laptop widths.
- No unreadable low-contrast text.

---

# PROMPT 02 — Add Types and Synthetic Alberta Dataset

## Task

Create the data layer for the comp-analysis app.

## Files

Create:

```txt
lib/types.ts
lib/data.ts
lib/format.ts
```

## Types

Create these TypeScript types:

```ts
export type PropertyType = "Detached" | "SemiDetached" | "Townhouse" | "Condo";

export type PropertyCondition = "Poor" | "Average" | "Good" | "Renovated" | "New";

export type ComparableStatus = "used" | "candidate" | "new" | "rejected";

export type FactorScores = {
  location: number;
  propertyType: number;
  size: number;
  bedsBaths: number;
  recency: number;
  ageCondition: number;
  pricePerSqft: number;
};

export type SubjectProperty = {
  id: string;
  address: string;
  city: string;
  province: "AB";
  postalCode: string;
  neighbourhood: string;
  propertyType: PropertyType;
  bedrooms: number;
  bathrooms: number;
  livingAreaSqft: number;
  lotSizeSqft: number;
  yearBuilt: number;
  condition: PropertyCondition;
  parking: string;
  latitude: number;
  longitude: number;
  estimatedValue: number;
  imageUrl: string;
};

export type ComparableProperty = {
  id: string;
  address: string;
  city: string;
  province: "AB";
  postalCode: string;
  neighbourhood: string;
  propertyType: PropertyType;
  bedrooms: number;
  bathrooms: number;
  livingAreaSqft: number;
  lotSizeSqft: number;
  yearBuilt: number;
  condition: PropertyCondition;
  parking: string;
  saleDate: string;
  salePrice: number;
  pricePerSqft: number;
  distanceKm: number;
  latitude: number;
  longitude: number;
  source: string;
  status: ComparableStatus;
  matchScore?: number;
  factorScores?: FactorScores;
  adjustmentValue?: number;
  adjustedValue?: number;
  reasons?: string[];
  riskFlags?: string[];
  imageUrl: string;
};
```

## Dataset

Create:

- 1 subject property in Alberta.
- 10–15 comparables across:
  - Edmonton
  - Calgary
  - Airdrie
  - St. Albert
  - Sherwood Park

Make the primary demo subject and nearby comps use the same city/neighbourhood cluster so the demo feels coherent.

Use realistic-looking but synthetic addresses and prices.

Use placeholder image URLs or local gradient/image placeholders if external images are unreliable.

## Format Helpers

Add:

```ts
formatCurrency(value: number): string
formatPercent(value: number): string
formatDistanceKm(value: number): string
formatDate(value: string): string
```

## Acceptance Criteria

- Types compile.
- Dataset exports cleanly.
- Format helpers work.
- No runtime fetch required.
- No private API/data required.

---

# PROMPT 03 — Implement Deterministic Scoring Engine

## Task

Create a deterministic comp scoring engine.

## File

```txt
lib/scoring.ts
```

## Scoring Model

Weighted score from 0–100:

```txt
location: 30%
propertyType: 20%
living area similarity: 15%
beds/baths similarity: 10%
sale recency: 10%
age/condition: 10%
price per sqft consistency: 5%
```

## Functions

Implement:

```ts
scoreComparable(subject: SubjectProperty, comp: ComparableProperty): ScoredComparable
scoreComparables(subject: SubjectProperty, comps: ComparableProperty[]): ScoredComparable[]
getMatchBand(score: number): "Excellent" | "Strong" | "Good" | "Weak"
```

`ScoredComparable` should include:

- original comp data
- matchScore
- factorScores
- reasons
- riskFlags

## Reason Generation

Generate deterministic reasons, such as:

- “Same property type”
- “Within 1.2 km of subject”
- “Living area within 5%”
- “Recently sold”
- “Similar bedroom/bath profile”
- “Condition alignment is strong”

Generate risk flags, such as:

- “Older sale date”
- “Different property type”
- “Large living-area variance”
- “Distance outside preferred radius”

## Technical Rules

- No LLM call.
- Pure functions.
- Strong typing.
- Clamp all scores 0–100.

## Acceptance Criteria

- Scoring returns sorted comps by score descending.
- Same property type scores higher than different type.
- Closer distance scores higher than farther distance.
- Recent sale scores higher than old sale.
- Reasons and risk flags are deterministic.

---

# PROMPT 04 — Implement Valuation and Confidence Engine

## Task

Create the valuation engine.

## File

```txt
lib/valuation.ts
```

## Functions

Implement:

```ts
calculateAdjustedComparableValue(subject: SubjectProperty, comp: ScoredComparable): AdjustedComparable
calculateValuation(subject: SubjectProperty, selectedComps: ScoredComparable[]): ValuationResult
compareValuationBeforeAfter(before: ValuationResult, after: ValuationResult): ValuationDelta
```

## Valuation Logic

For each selected comparable:

```txt
adjustedValue =
  salePrice
  + sqftAdjustment
  + bedroomBathroomAdjustment
  + ageAdjustment
  + conditionAdjustment
  + parkingAdjustment
  + lotAdjustment
```

Use simple deterministic adjustment assumptions.

Example:
- sqft delta × local price/sqft × 0.35
- bedroom difference × fixed value
- bathroom difference × fixed value
- condition difference × fixed value
- year-built difference × small age adjustment
- lot-size adjustment × small land factor

Then calculate:

- low estimate
- midpoint estimate
- high estimate
- confidence score
- confidence label
- confidence rationale
- value dispersion
- included comp count

Confidence should improve when:
- more high-quality comps are selected
- match scores are high
- value dispersion is low
- sale dates are recent

Confidence should decrease when:
- too few comps
- wide value dispersion
- weak scores
- stale sales

## Acceptance Criteria

- Returns low <= midpoint <= high.
- Adding a useful comp can improve confidence.
- Valuation result includes human-readable rationale.
- No hallucinated values.
- No network/API dependency.

---

# PROMPT 05 — Build the Main Comparable Network View

## Task

Build the central product screen: a network view showing the subject property connected to comparable properties.

## Recommended Implementation

Use `@xyflow/react` for the node/edge visualization.

If React Flow is too costly or broken, fallback to absolute-positioned cards with SVG lines.

## Components

Create:

```txt
components/comparable-network.tsx
components/subject-property-card.tsx
components/property-node-card.tsx
components/confidence-gauge.tsx
components/value-range-bar.tsx
```

## UI Requirements

Network view:
- Subject card in center.
- Comparable cards arranged around subject.
- Subject uses amber/gold outline.
- Existing comps use muted borders.
- New comp uses blue outline and “New” badge.
- Edges connect subject to comps.
- Stronger comps use brighter/solid edges.
- Weaker comps use muted/dashed edges.
- Node cards show:
  - photo/thumbnail
  - address
  - price
  - distance
  - match score
  - status badge
- Background should look like a muted dark map/grid without requiring external map APIs.

Subject card shows:
- Address
- City/province
- Estimated value
- Beds
- Baths
- Sq ft
- Confidence score

## Controls

Add:
- View selector or tabs.
- “Find More Comparables” button.
- “Recalculate” button if useful.

## Acceptance Criteria

- Network renders consistently.
- Cards are readable.
- Edges are clear.
- No draggable chaos in demo.
- Layout does not break on 1366px laptop width.
- New comp visual state is supported but does not need interaction yet.

---

# PROMPT 06 — Build the New Comparable Discovery Drawer

## Task

Build the right-side “Add Comparable” review drawer.

## Component

```txt
components/add-comparable-drawer.tsx
```

## Trigger

Add a button:

```txt
Find More Comparables
```

or

```txt
Simulate New Comparable
```

When clicked, open the drawer with a candidate comp.

## Drawer Content

Title:

```txt
Add Comparable
```

Candidate card:
- New Match badge
- image
- address
- city/province
- sale price
- distance
- match score
- sale date
- price/sqft

Section:

```txt
Why this property matches
```

Checklist:
- Similar living area
- Same beds/baths
- Similar lot size
- Recently sold
- Same neighbourhood or market cluster
- Strong alignment on key match factors

Section:

```txt
Impact on analysis if added
```

Show:
- confidence before → after
- estimated value range before → after
- range narrows by X
- midpoint change
- data quality impact

Buttons:
- Add to analysis
- Dismiss

## UX Requirements

- Drawer should feel like a review step, not automatic black-box action.
- User remains in control.
- Positive deltas should be green.
- Do not overdo animation.

## Acceptance Criteria

- Drawer opens/closes.
- Candidate data renders.
- Add/Dismiss buttons exist.
- No actual state mutation required yet; that comes next.

---

# PROMPT 07 — Implement Add-to-Analysis State Flow

## Task

Wire the new comparable discovery workflow end-to-end.

## State Requirements

In the main dashboard state:

```ts
selectedComps: ScoredComparable[]
candidateComp: ScoredComparable | null
activeView: ...
activityFeed: ActivityItem[]
valuationResult: ValuationResult
previousValuationResult?: ValuationResult
toast?: ToastState
```

## Interaction Flow

When user clicks:

```txt
Find More Comparables
```

- Open drawer.
- Show best candidate not already selected.

When user clicks:

```txt
Add to analysis
```

- Add candidate to selected comps.
- Mark candidate status as `"new"`.
- Recalculate scores/valuation.
- Update confidence/value range.
- Add recent activity:
  - “Comp 6 added”
  - “Confidence score recalculated”
  - “Valuation range updated”
  - “Report draft refreshed”
- Close drawer.
- Show toast:
  - “New comparable added”
  - “Confidence increased +2%”
- Highlight new card in network.
- Brighten edge to new card.
- Update footer:
  - “Analysis is based on 6 comparables with high data quality.”

When user clicks:

```txt
Dismiss
```

- Close drawer without changing selected comps.

## Microinteractions

Use Framer Motion or CSS:
- Toast slides/fades in.
- New comp card pulses once.
- Activity item appears at top.
- Value/confidence transitions are smooth but restrained.

## Acceptance Criteria

- Full add flow works.
- UI visibly updates.
- No page reload required.
- No duplicate add bug.
- Activity feed updates.
- Valuation and confidence update.
- New comp remains marked after switching views.

---

# PROMPT 08 — Complete the Right Insights Panel

## Task

Build a strong right insights panel that updates based on current valuation state.

## Component

```txt
components/insights-panel.tsx
components/activity-timeline.tsx
```

## Content

Sections:

1. Estimated Value Range
   - low-high range
   - midpoint estimate
   - range bar

2. Confidence Score
   - circular gauge or clean progress ring
   - confidence label
   - rationale

3. Key Match Factors
   - location proximity
   - size similarity
   - property age
   - condition
   - style/property type
   - recency

4. Recent Activity
   - most recent events
   - timestamps
   - colored status dots
   - “View all activity”

5. Optional Next Steps
   - Review all comparables
   - Run sensitivity analysis
   - Generate report

## Requirements

- Values must derive from scoring/valuation state.
- Avoid fake random values.
- If no new comp is added, show baseline state.
- If new comp is added, show updated state and recent event.

## Acceptance Criteria

- Insights panel updates after new comp add.
- No hardcoded disconnected numbers.
- Good readability.
- Works on desktop widths.

---

# PROMPT 09 — Build Comparables Table View

## Task

Build a practical analyst-friendly table view.

## Component

```txt
components/comparable-table.tsx
```

## View

Title:

```txt
Comparables Table View
```

If a new comp was added, show banner:

```txt
1 new comparable added to analysis
```

## Columns

- #
- Property
- Distance
- Sale Price
- Price/SqFt
- Sale Date
- Match Score
- Status
- Actions

## Row Requirements

Each row:
- thumbnail
- address
- city/province
- distance
- price
- match score ring or badge
- status pill
- view icon
- menu icon

The newly added comparable should:
- appear at top or remain highlighted in list
- have a “New” badge
- have subtle blue row highlight

## Interactions

- Clicking a row selects comp and opens detail drawer or highlights it.
- Sorting can be basic or visual only, but avoid broken controls.
- Pagination can be static if dataset small.

## Acceptance Criteria

- Table view renders selected comps.
- New comp highlight works.
- Data comes from state.
- No broken sort UI if sort not implemented.
- Right insights panel remains visible or is integrated cleanly.

---

# PROMPT 10 — Build Adjustment Grid View

## Task

Build an underwriting-style adjustment grid.

## Component

```txt
components/adjustment-grid.tsx
```

## View

Title:

```txt
Adjustment Grid
```

Banner if new comp added:

```txt
New comparable selected for review
```

## Grid Columns

- Subject Property
- Comp 1
- Comp 2
- Comp 3
- Comp 4
- Comp 5
- New Comp

## Grid Rows

- Price
- Distance
- Beds
- Baths
- Sq Ft
- Lot Size
- Year Built
- Condition
- Parking
- Adjustment Value
- Total Adjustments
- Adjusted Price

## New Comp Column

Highlight it:
- blue outline
- “New” pill
- maybe a soft glow
- selected state

## Right Impact Panel

Show:

- Before value range
- After value range
- Change in midpoint
- Before confidence
- After confidence
- Change in confidence
- Buttons:
  - Confirm & Lock Adjustments
  - Recalculate Valuation

## Technical Rules

- Use valuation result data.
- Avoid fake values disconnected from engine.
- If exact before/after not available, derive from previous valuation state.

## Acceptance Criteria

- Adjustment grid renders.
- New comp column is visible/highlighted.
- Before/after panel updates.
- Buttons render and show toast or simple state changes.

---

# PROMPT 11 — Build Comp Discovery Map View

## Task

Build a map-first discovery screen for finding comparables.

## Component

```txt
components/comp-discovery-view.tsx
```

## Layout

- Left list of comparable cards.
- Main dark map canvas.
- Right insights panel.

## Map

Use static/dark map-like background; no external map API.

Pins:
- Subject property pin in amber.
- Existing comparables in blue.
- New match pin has ripple ring and “New match” tooltip.

## Left List

- List comparables with thumbnails.
- New candidate/added comp highlighted.
- Button: “Find More Comparables”.

## Right Insights

Show:

```txt
New opportunity
Stronger comparable found
```

Reasons:
- Best style match so far
- Closest recent sale
- Better coverage across style/time/location
- Impact:
  - reduces time adjustment
  - improves style similarity
  - tightens value range
  - increases confidence
- Updated coverage:
  - before → after

## Acceptance Criteria

- Map view is visually clear.
- New match is obvious.
- No API keys or external maps required.
- Find/add workflow remains connected to global state if practical.

---

# PROMPT 12 — Build Valuation Summary View

## Task

Build the post-add valuation summary page.

## Component

```txt
components/valuation-summary.tsx
```

## Content

Top summary:
- Estimated value
- Updated timestamp
- Estimated value range
- Confidence score gauge
- Confidence label
- “What improved with this update” chips:
  - +1 comp
  - better location match
  - lower variance

Panel:

```txt
What changed after Comp 6?
```

Rows:
- Estimated Value
- Value Range
- Confidence Score
- Avg Days on Market
- Price per Sq Ft

Columns:
- Before
- After
- Change

Panel:

```txt
Comparable Properties
```

List selected comps:
- thumbnail
- address
- core details
- price
- match score
- new badge if applicable

Right panel:
- Insight summary
- Model quality bars
- Next steps

## Acceptance Criteria

- Before/after data renders.
- New comp is visible in list.
- Values are consistent with valuation engine.
- Page feels report-ready.

---

# PROMPT 13 — Build Report Ready / Export State

## Task

Build the satisfying final state for the demo.

## Component

```txt
components/report-ready-panel.tsx
```

## Content

Show:

```txt
Report Ready
Analysis is complete and ready to export.
```

Success note:

```txt
All valuation metrics recalculated successfully.
```

Valuation summary:
- estimated value
- value range
- confidence score
- price/sqft
- market adjustment
- comp count

Comparables included:
- list all selected comps
- newest comp tagged “Newly added”

Primary CTA:

```txt
Export Report
```

Footer note:

```txt
Secure export • PDF format • Includes full methodology
```

## Interaction

Clicking Export Report should:
- show toast:
  - “Report export prepared”
  - “README/demo export placeholder ready”
- It does not need real PDF generation unless already easy.

## Acceptance Criteria

- Report-ready view renders.
- Export button works at least as a UI state/toast.
- Included comps list is accurate.
- New comp appears as included.

---

# PROMPT 14 — Tests, README, Build Hardening, Vercel Readiness

## Task

Harden the project for submission.

## Tests

Add tests for:

1. Higher similarity when property type matches.
2. Closer distance improves location score.
3. Recent sale improves recency score.
4. Valuation range returns low <= midpoint <= high.
5. Adding a useful comp improves or preserves confidence.
6. New comparable appears in selected comps after add flow if UI testing is practical.
7. Activity feed records “Comp added”.

If UI testing is too much, focus on scoring and valuation unit tests.

## Commands

Ensure these work:

```bash
npm run build
```

```bash
npm test
```

If missing scripts, add them.

## TypeScript

Fix:
- implicit any
- bad imports
- dead components
- hydration errors
- client/server boundary issues
- missing `"use client"` where needed

## README

Write a complete README:

Sections:
- Project title
- Problem understanding
- What this builds
- Why this scope
- Architecture
- Data model
- Scoring model
- Valuation model
- New comparable workflow
- How to run
- How to test
- Demo flow
- Limitations
- What I would build next
- Sam call note placeholder
- Demo video placeholder
- Submission checklist

Important README wording:
- This is not an appraisal engine.
- This is not automated credit decisioning.
- It is a human-in-the-loop underwriting-support prototype.
- Synthetic data is used because no licensed MLS/sold-data feed is available.
- The goal is to demonstrate system design, explainability, and workflow judgment.

## Final Build Criteria

- No runtime errors.
- No obvious console errors.
- No broken routes/views.
- Main demo flow works.
- README is hiring-ready.
- App can be deployed to Vercel as a normal Next.js app.

---

# ENHANCEMENT PROMPT 15 — UX Microinteraction Polish Pass

## Task

Polish the “new comparable added” satisfaction loop without increasing technical risk.

## Areas to Improve

1. Toast quality:
   - clear success copy
   - green check icon
   - dismiss button
   - auto-dismiss after a reasonable delay

2. New comp card:
   - blue outline
   - “New” badge
   - one-time pulse effect
   - brighter edge/line

3. Confidence update:
   - smooth transition
   - before/after delta chip
   - no fake random changes

4. Activity feed:
   - top entry appears as “Just now”
   - event sequence is clear:
     - Comp added
     - Confidence recalculated
     - Valuation range updated
     - Report refreshed

5. Drawer:
   - “Add to analysis” button has loading state
   - “Added” state is acknowledged

## Rules

- Do not introduce heavy animation libraries beyond existing Framer Motion/CSS.
- Do not make UI feel childish or gamified.
- Keep it professional and underwriting-grade.

## Acceptance Criteria

- New comp flow feels satisfying.
- No animation causes layout shift.
- No broken state after repeated add/dismiss attempts.
- UI still feels realistic and buildable.

---

# ENHANCEMENT PROMPT 16 — Responsive and Accessibility Pass

## Task

Make the dashboard robust across laptop and desktop widths, with acceptable tablet fallback.

## Requirements

Desktop:
- 1440px and 1366px widths should look clean.
- Sidebar should not crush main content.
- Right panel should remain readable.

Tablet fallback:
- Sidebar can collapse.
- Right insights panel can move below main content.
- Network cards can stack or shrink.

Accessibility:
- Buttons have accessible labels.
- Icon-only buttons include aria-label.
- Focus states visible.
- Text contrast is strong.
- Color status also has text labels.
- Inputs/controls have labels.
- No critical info conveyed by color only.

## Test Manually

Check:
- 1920x1080
- 1440x900
- 1366x768
- 1024x768

## Acceptance Criteria

- No major horizontal overflow.
- Main workflow remains usable.
- Sidebar and topbar remain stable.
- Text is readable.
- Keyboard focus is visible.

---

# ENHANCEMENT PROMPT 17 — Portfolio/Vercel Case Study Integration

## Task

Prepare this app to be added to an employer-facing Vercel portfolio as a case study.

## Deliverables

Add a case-study page or README section:

```txt
Case Study: AI Comparable Property Analysis for Lending Workflows
```

Include:
- Problem
- Product decision
- Architecture
- Scoring model
- Valuation model
- UX workflow
- Safety / limitations
- What I would build next
- Screenshots placeholders
- Loom demo placeholder

Add portfolio metadata:
- project title
- short description
- tech stack
- role
- date
- repo link placeholder
- live demo link placeholder

Add a clean landing intro if useful:
- “Human-in-the-loop AI underwriting support”
- “Deterministic scoring before LLM explanation”
- “Transparent comparable ranking”
- “Reviewable valuation memo workflow”

## Vercel Readiness

Ensure:
- `npm run build` passes.
- No local-only absolute paths.
- No missing environment variables.
- No private API dependencies.
- README explains deployment.

Add optional `vercel.json` only if needed.

## Acceptance Criteria

- Project is portfolio-presentable.
- README reads like an employer case study.
- Live demo can be added to Vercel.
- No unsupported claims about production valuation accuracy.

---

# FINAL CODEX REMINDER

If you start drifting into unrelated features, stop and return to this priority order:

1. New comparable workflow.
2. Deterministic scoring.
3. Valuation update.
4. Network view.
5. Table view.
6. Adjustment grid.
7. Valuation summary.
8. Report-ready state.
9. Tests.
10. README.
11. Vercel readiness.

Do not expand scope until all core acceptance criteria pass.
