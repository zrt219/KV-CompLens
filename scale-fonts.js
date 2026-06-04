const fs = require('fs');
const path = 'src/app/globals.css';
let css = fs.readFileSync(path, 'utf8');

// Scale CSS variables
css = css.replace(/--text-xs:\s*\d+px;/, '--text-xs: 17px;');
css = css.replace(/--text-sm:\s*\d+px;/, '--text-sm: 18px;');
css = css.replace(/--text-base:\s*\d+px;/, '--text-base: 20px;');
css = css.replace(/--text-lg:\s*\d+px;/, '--text-lg: 24px;');
css = css.replace(/--text-xl:\s*\d+px;/, '--text-xl: 28px;');
css = css.replace(/--text-2xl:\s*\d+px;/, '--text-2xl: 34px;');
css = css.replace(/--text-3xl:\s*\d+px;/, '--text-3xl: 40px;');

// Scale hardcoded font sizes
css = css.replace(/font-size:\s*(\d+)(?:\.\d+)?px;/g, (match, p1) => {
  let size = parseInt(p1);
  
  // Baseline is 17px now.
  if (size < 17) {
    size += 6; // 11px -> 17px, 12px -> 18px, etc.
  } else if (size >= 17 && size < 30) {
    size += 4; // Scale mid-tier fonts
  } else if (size >= 30 && size < 40) {
    size += 2; // Scale high-tier fonts
  }
  
  return `font-size: ${size}px;`;
});

// Also scale hardcoded heights to accommodate the huge fonts
// Workflow strip div min-height
css = css.replace(/min-height:\s*76px;/g, 'min-height: 86px;');
// Buttons
css = css.replace(/min-height:\s*44px;/g, 'min-height: 52px;');

fs.writeFileSync(path, css);
console.log('Fonts scaled up globally!');
