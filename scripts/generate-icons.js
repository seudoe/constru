// Simple icon generator for PWA
// This creates basic PNG icons from SVG

const fs = require('fs');
const path = require('path');

// Create a simple SVG icon
const createSVGIcon = (size) => `
<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg">
  <rect width="${size}" height="${size}" rx="${size * 0.125}" fill="#d97706"/>
  <g transform="translate(${size * 0.25}, ${size * 0.25})">
    <rect x="0" y="${size * 0.125}" width="${size * 0.5}" height="${size * 0.375}" fill="white" rx="${size * 0.025}"/>
    <rect x="${size * 0.0625}" y="${size * 0.1875}" width="${size * 0.375}" height="${size * 0.25}" fill="#d97706"/>
    <rect x="${size * 0.125}" y="${size * 0.25}" width="${size * 0.0625}" height="${size * 0.0625}" fill="white"/>
    <rect x="${size * 0.3125}" y="${size * 0.25}" width="${size * 0.0625}" height="${size * 0.0625}" fill="white"/>
  </g>
</svg>`;

// Create icons directory if it doesn't exist
const iconsDir = path.join(__dirname, '..', 'public', 'icons');
if (!fs.existsSync(iconsDir)) {
  fs.mkdirSync(iconsDir, { recursive: true });
}

// Generate SVG icons
const sizes = [192, 512];
sizes.forEach(size => {
  const svg = createSVGIcon(size);
  fs.writeFileSync(path.join(iconsDir, `icon-${size}.svg`), svg);
  console.log(`Generated icon-${size}.svg`);
});

console.log('Icons generated successfully!');