/* eslint-disable @typescript-eslint/no-require-imports */
const fs = require('fs');
const path = 'src/app/globals.css';
let css = fs.readFileSync(path, 'utf8');

// 1. Inject Keyframes at the top after imports or root
const keyframes = `
@keyframes gold-shimmer {
  0% { background-position: -200% center; }
  100% { background-position: 200% center; }
}

@keyframes premium-pulse {
  0% { box-shadow: 0 0 0 0 rgba(255, 215, 0, 0.4); }
  70% { box-shadow: 0 0 0 10px rgba(255, 215, 0, 0); }
  100% { box-shadow: 0 0 0 0 rgba(255, 215, 0, 0); }
}

@keyframes float-up {
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
}

@keyframes spin-border {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

.premium-card-hover {
  transition: all 0.4s cubic-bezier(0.25, 0.8, 0.25, 1);
}
.premium-card-hover:hover {
  transform: translateY(-4px);
  box-shadow: 0 16px 32px rgba(0, 0, 0, 0.5), 0 0 15px rgba(255, 215, 0, 0.15);
  border-color: rgba(255, 215, 0, 0.4) !important;
}

.premium-button-hover {
  position: relative;
  overflow: hidden;
  transition: all 0.3s ease;
}
.premium-button-hover::after {
  content: '';
  position: absolute;
  top: 0; left: -100%; width: 50%; height: 100%;
  background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.2), transparent);
  transform: skewX(-20deg);
  animation: gold-shimmer 3s infinite;
}
`;

if (!css.includes('@keyframes premium-pulse')) {
  css += keyframes;
}

// 2. Replace dashed borders across the board
// General replacement for common dashed borders to solid
css = css.replace(/border-style:\s*dashed;/g, 'border-style: solid;');
css = css.replace(/border:\s*(.+?)dashed/g, 'border: $1solid');

// 3. Specifically target workflow strip pending
css = css.replace(
  /\.workflow-strip div\.pending {[^}]*}/g,
  `.workflow-strip div.pending {
  opacity: 0.85;
  border-style: solid;
  border-color: rgba(255, 215, 0, 0.6);
  background: linear-gradient(180deg, rgba(30, 25, 5, 0.96), rgba(15, 12, 2, 0.96));
  animation: premium-pulse 2.5s infinite;
  box-shadow: inset 0 0 10px rgba(255, 215, 0, 0.1);
}`
);

css = css.replace(
  /\.workflow-strip div\.pending span {[^}]*}/g,
  `.workflow-strip div.pending span {
  color: #ffd700;
  border-style: solid;
  border-color: rgba(255, 215, 0, 0.5);
  box-shadow: 0 0 8px rgba(255, 215, 0, 0.3);
}`
);

// 4. Specifically target status-chip review (amber)
css = css.replace(
  /\.status-chip\.review {[^}]*}/g,
  `.status-chip.review {
  color: #ffe3a1;
  border-style: solid;
  border-color: var(--amber);
  background: linear-gradient(90deg, #2a210f, #1f180b);
  animation: premium-pulse 2s infinite;
}`
);

// 5. Zero-state notes
css = css.replace(
  /\.zero-state-note {([^}]*)}/g,
  `.zero-state-note {
  border: 1px solid rgba(255, 215, 0, 0.25);
  border-radius: 8px;
  background: linear-gradient(135deg, rgba(20, 25, 35, 0.8), rgba(10, 15, 25, 0.8));
  backdrop-filter: blur(8px);
  padding: 16px;
  text-align: center;
  color: var(--muted);
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3), inset 0 1px 1px rgba(255, 255, 255, 0.1);
  animation: float-up 0.6s ease-out forwards;
}`
);

// 6. Value card / Insight card hover enhancements
css = css.replace(
  /\.value-card,\s*\.insight-card\s*\{/g,
  `.value-card, .insight-card {
  transition: all 0.4s cubic-bezier(0.25, 0.8, 0.25, 1);
`
);

if (!css.includes('.insight-card:hover')) {
  css += `
.value-card:hover, .insight-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 16px 32px rgba(0, 0, 0, 0.5), 0 0 15px rgba(255, 215, 0, 0.15);
  border-color: rgba(255, 215, 0, 0.3);
  background: linear-gradient(180deg, rgba(25, 35, 50, 0.96), rgba(10, 15, 25, 0.96));
}
`;
}

// 7. Actions buttons gold shimmer
if (!css.includes('.actions button::after')) {
  css += `
.actions button {
  position: relative;
  overflow: hidden;
  transition: all 0.3s ease;
}
.actions button:not(:disabled):hover {
  box-shadow: 0 0 15px rgba(255, 215, 0, 0.3);
  border-color: rgba(255, 215, 0, 0.5);
  transform: translateY(-2px);
}
.actions button:not(:disabled)::after {
  content: '';
  position: absolute;
  top: 0; left: -100%; width: 50%; height: 100%;
  background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.2), transparent);
  transform: skewX(-20deg);
  animation: gold-shimmer 3s infinite;
}
`;
}

// 8. Fix the tutorial section dashed line
css = css.replace(/border-left: 2px dashed #d8e8ff;/g, 'border-left: 2px solid rgba(255, 215, 0, 0.5); box-shadow: -2px 0 10px rgba(255, 215, 0, 0.2);');
css = css.replace(/border:\s*2px solid #d8e8ff/g, 'border: 2px solid rgba(255, 215, 0, 0.6); box-shadow: 0 0 12px rgba(255, 215, 0, 0.25)');


fs.writeFileSync(path, css);
console.log('UI Premium upgrades applied!');
