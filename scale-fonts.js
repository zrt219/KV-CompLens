/* eslint-disable @typescript-eslint/no-require-imports */
const fs = require('fs');
const path = 'src/app/globals.css';
let css = fs.readFileSync(path, 'utf8');

// Scale CSS variables
css = css.replace(/--text-xs:\s*\d+px;/, '--text-xs: 12px;');
css = css.replace(/--text-sm:\s*\d+px;/, '--text-sm: 14px;');
css = css.replace(/--text-base:\s*\d+px;/, '--text-base: 15px;');
css = css.replace(/--text-lg:\s*\d+px;/, '--text-lg: 17px;');
css = css.replace(/--text-xl:\s*\d+px;/, '--text-xl: 20px;');
css = css.replace(/--text-2xl:\s*\d+px;/, '--text-2xl: 24px;');
css = css.replace(/--text-3xl:\s*\d+px;/, '--text-3xl: 30px;');

// Tone down hardcoded font sizes while keeping text slightly above the original compact baseline.
css = css.replace(/font-size:\s*(\d+)(?:\.\d+)?px;/g, (match, p1) => {
  const size = parseInt(p1);

  if (size <= 13) {
    return `font-size: ${size}px;`;
  }
  if (size <= 16) {
    return 'font-size: 14px;';
  }
  if (size <= 19) {
    return 'font-size: 15px;';
  }
  if (size <= 21) {
    return 'font-size: 16px;';
  }
  if (size <= 24) {
    return 'font-size: 17px;';
  }
  if (size <= 27) {
    return 'font-size: 20px;';
  }
  if (size <= 32) {
    return 'font-size: 24px;';
  }
  if (size <= 40) {
    return 'font-size: 30px;';
  }

  return match;
});

// Keep dense controls from reserving space for the old oversized typography.
css = css.replace(/min-height:\s*86px;/g, 'min-height: 76px;');
css = css.replace(/min-height:\s*52px;/g, 'min-height: 42px;');

fs.writeFileSync(path, css);
console.log('Fonts toned down to the KV CompLens readability scale.');
