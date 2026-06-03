"use client";

import type { AdjustedComparable, ScoredComparable, SubjectProperty } from "../../../lib/types";
import { projectToCivicGrid, subjectCivicGridPoint } from "./civicGridProjection";

type EvidencePoint = {
  comp: AdjustedComparable | ScoredComparable;
  x: number;
  y: number;
  district: string;
  isCandidate?: boolean;
  isNew?: boolean;
};

function pathFor(point: EvidencePoint) {
  const subject = subjectCivicGridPoint({ id: "subject" } as SubjectProperty);
  const controlX = (subject.x + point.x) / 2;
  const controlY = Math.min(subject.y, point.y) - 48 + (point.x > subject.x ? 24 : -24);
  return `M ${subject.x} ${subject.y} Q ${controlX} ${controlY} ${point.x} ${point.y}`;
}

function evidenceTone(comp: AdjustedComparable | ScoredComparable, isNew?: boolean, isCandidate?: boolean) {
  if (isNew) return "new";
  if (isCandidate) return "candidate";
  if (comp.totalScore >= 75) return "strong";
  if (comp.totalScore >= 60) return "review";
  return "weak";
}

export function CivicGridCanvas({ subject, comps, candidate, newCompId }: { subject: SubjectProperty; comps: AdjustedComparable[]; candidate?: ScoredComparable; newCompId?: string }) {
  const presentationComps = comps.slice(0, 5);
  const maxDistance = Math.max(5, ...presentationComps.map((comp) => comp.distanceKm), candidate?.distanceKm ?? 0);
  const cityLabel = subject.city.toUpperCase();
  const districtLabels: Array<[string, number, number]> = subject.city === "Calgary" ? [
    ["NORTHWEST CALGARY", 140, 178],
    ["BOWNESS", 342, 310],
    ["NORTH CENTRAL", 504, 236],
    ["RIVER DISTRICT", 520, 512],
    ["SOUTHEAST CALGARY", 742, 516]
  ] : [
    ["NORTHWEST INDUSTRIAL", 132, 170],
    ["CASTLE DOWNS", 646, 128],
    ["NORTH CENTRAL", 500, 252],
    ["RIVER VALLEY", 500, 490],
    ["MILL WOODS", 704, 492]
  ];
  const points: EvidencePoint[] = [
    ...presentationComps.map((comp) => ({
      comp,
      ...projectToCivicGrid(subject, comp, maxDistance),
      isNew: comp.id === newCompId
    })),
    ...(candidate ? [{
      comp: candidate,
      ...projectToCivicGrid(subject, candidate, maxDistance),
      isCandidate: true
    }] : [])
  ];

  return (
    <div className="civic-grid-layer" aria-label="CivicGrid abstract evidence map">
      <svg className="civic-grid-svg" viewBox="0 0 1000 680" preserveAspectRatio="xMidYMid slice" role="img" aria-label="Abstract Edmonton CivicGrid using real latitude and longitude evidence geometry">
        <defs>
          <filter id="evidenceGlow">
            <feGaussianBlur stdDeviation="4" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
          <pattern id="dotMatrix" width="24" height="24" patternUnits="userSpaceOnUse">
            <circle cx="2" cy="2" r="1" fill="#65a7ff" opacity="0.18" />
          </pattern>
        </defs>

        <rect className="civic-bg" x="0" y="0" width="1000" height="680" />
        <rect className="civic-dot-matrix" x="0" y="0" width="1000" height="680" fill="url(#dotMatrix)" />
        <g className="civic-grid-lines" aria-hidden="true">
          {Array.from({ length: 24 }, (_, index) => <line key={`v-${index}`} x1={40 + index * 42} y1="24" x2={40 + index * 42} y2="656" />)}
          {Array.from({ length: 16 }, (_, index) => <line key={`h-${index}`} x1="24" y1={38 + index * 42} x2="976" y2={38 + index * 42} />)}
        </g>

        <g className="civic-districts" aria-hidden="true">
          <path d="M96 84 C250 42 376 76 452 170 C386 246 236 272 104 224 Z" />
          <path d="M526 78 C704 42 862 78 930 190 C852 262 656 266 526 206 Z" />
          <path d="M112 450 C260 386 384 420 466 528 C368 618 214 630 92 570 Z" />
          <path d="M552 470 C688 390 866 424 934 558 C810 626 640 616 548 560 Z" />
          <ellipse cx="500" cy="340" rx="178" ry="124" />
        </g>

        <g className="civic-labels" aria-hidden="true">
          <text x="42" y="116">CIVICGRID</text>
          <text x="42" y="142">{cityLabel}</text>
          {districtLabels.map(([label, x, y]) => <text key={label} x={x} y={y} textAnchor="middle">{label}</text>)}
          <text x="500" y="214" textAnchor="middle">5 KM</text>
          <text x="500" y="148" textAnchor="middle">10 KM</text>
          <text x="500" y="84" textAnchor="middle">15 KM</text>
        </g>

        <path className="civic-river river-glow" d="M42 392 C180 340 238 388 344 336 C476 270 548 316 666 270 C792 220 878 246 968 194" />
        <path className="civic-river river-core" d="M42 392 C180 340 238 388 344 336 C476 270 548 316 666 270 C792 220 878 246 968 194" />
        <path className="civic-ring ring-a" d="M168 342 C170 156 342 62 528 80 C740 102 872 234 844 398 C818 562 650 626 450 604 C250 580 150 488 168 342Z" />
        <path className="civic-ring ring-b" d="M260 342 C260 218 376 156 514 164 C664 172 762 264 746 388 C730 500 610 550 478 536 C338 522 256 452 260 342Z" />
        <path className="civic-ring ring-c" d="M352 340 C352 260 420 218 500 222 C592 226 654 280 646 362 C636 438 566 472 492 466 C410 458 352 414 352 340Z" />
        <g className="civic-radials" aria-hidden="true">
          <line x1="500" y1="340" x2="500" y2="72" />
          <line x1="500" y1="340" x2="500" y2="620" />
          <line x1="500" y1="340" x2="120" y2="172" />
          <line x1="500" y1="340" x2="900" y2="176" />
          <line x1="500" y1="340" x2="118" y2="566" />
          <line x1="500" y1="340" x2="902" y2="560" />
        </g>
        <g className="civic-corridors" aria-hidden="true">
          <path d="M86 518 C268 454 386 392 500 340 C620 284 758 206 928 142" />
          <path d="M102 176 C300 236 390 290 500 340 C638 402 776 456 920 532" />
          <path d="M162 342 H848" />
          <path d="M500 70 C514 198 512 438 498 622" />
        </g>
        <g className="civic-poi" aria-hidden="true">
          {Array.from({ length: 10 }, (_, index) => {
            const x = 120 + ((index * 97) % 760);
            const y = 92 + ((index * 53) % 500);
            return <circle key={`poi-${index}`} cx={x} cy={y} r={index % 4 === 0 ? 2.4 : 1.6} />;
          })}
        </g>

        <g className="civic-evidence-paths">
          {points.map((point) => (
            <path
              key={`path-${point.comp.id}-${point.isCandidate ? "candidate" : "selected"}`}
              className={`civic-evidence ${evidenceTone(point.comp, point.isNew, point.isCandidate)}`}
              d={pathFor(point)}
              pathLength="1"
            />
          ))}
        </g>

        <g className="civic-subject">
          <circle className="subject-sonar-pulse" cx="500" cy="340" r="82" />
          <circle cx="500" cy="340" r="132" />
          <circle cx="500" cy="340" r="186" />
          <rect x="420" y="306" width="160" height="68" rx="12" />
          <text x="500" y="329" textAnchor="middle">SUBJECT</text>
          <text x="500" y="352" textAnchor="middle">{subject.address}</text>
        </g>

        <g className="civic-markers">
          {points.map((point, index) => (
            <g key={`marker-${point.comp.id}-${point.isCandidate ? "candidate" : "selected"}`} className={`civic-marker ${evidenceTone(point.comp, point.isNew, point.isCandidate)}`} transform={`translate(${point.x} ${point.y})`}>
              <title>{point.comp.address}: {point.district}, {point.comp.distanceKm?.toFixed(1)} km, probability {point.comp.comparableProbabilityPercent}%</title>
              <circle r={point.isCandidate ? 14 : 8 + (point.comp.comparableProbabilityPercent / 100) * 6} />
              <text y="4" textAnchor="middle">{point.isCandidate ? "C" : index + 1}</text>
            </g>
          ))}
        </g>
      </svg>
      <div className="civic-grid-badge">
        <span>CivicGrid</span>
        <strong>Abstract evidence layer</strong>
        <small>Real lat/lng drives x/y, distance, scoring, and PCE math. Visual districts are demo abstractions.</small>
      </div>
      <div className="civic-compass" aria-hidden="true"><span>N</span><b>^</b></div>
      <div className="civic-zoom" aria-hidden="true"><span>+</span><span>-</span></div>
    </div>
  );
}
