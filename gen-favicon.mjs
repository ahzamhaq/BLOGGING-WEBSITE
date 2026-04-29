const sharp = require("sharp");
const path = require("path");
const fs = require("fs");

const publicDir = "C:/Users/HP/OneDrive/Desktop/PROJECTS/Blogging-website/public";

// Create a clean feather SVG — white icon on dark bg, matching the brand
const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" width="64" height="64">
  <rect width="64" height="64" rx="14" fill="#0d1117"/>
  <g transform="translate(12, 8) scale(1.0)" stroke="white" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round" fill="none">
    <path d="M20.24 12.24a6 6 0 0 1 8.49 8.49l-8.49 8.49-4.25-4.25 4.25-12.73z"/>
    <path d="M16 16L2 30l1.5 1.5"/>
    <line x1="11" y1="21" x2="2" y2="30"/>
  </g>
</svg>`;

async function generate() {
  const buf = Buffer.from(svg);
  
  // 32x32 PNG
  await sharp(buf).resize(32, 32).png().toFile(path.join(publicDir, "favicon-32x32.png"));
  // 16x16 PNG  
  await sharp(buf).resize(16, 16).png().toFile(path.join(publicDir, "favicon-16x16.png"));
  // 180x180 apple touch
  await sharp(buf).resize(180, 180).png().toFile(path.join(publicDir, "apple-touch-icon.png"));
  // Also overwrite icon.png with this cleaner version
  await sharp(buf).resize(192, 192).png().toFile(path.join(publicDir, "icon.png"));
  
  // For favicon.ico, copy the 32x32
  fs.copyFileSync(path.join(publicDir, "favicon-32x32.png"), path.join(publicDir, "favicon.ico"));
  
  console.log("All favicons generated!");
}
generate().catch(console.error);
