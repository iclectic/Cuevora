import sharp from 'sharp';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(__dirname, '..');

const svg = `<svg width="512" height="512" viewBox="0 0 512 512" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#1a1a2e"/>
      <stop offset="100%" stop-color="#16213e"/>
    </linearGradient>
  </defs>
  <rect width="512" height="512" rx="108" fill="url(#bg)"/>
  <path d="M180 140 L380 256 L180 372 Z" fill="#10b981" opacity="0.95"/>
  <rect x="160" y="390" width="192" height="12" rx="6" fill="white" opacity="0.5"/>
  <rect x="180" y="416" width="152" height="12" rx="6" fill="white" opacity="0.35"/>
  <rect x="200" y="442" width="112" height="12" rx="6" fill="white" opacity="0.2"/>
</svg>`;

const outPath = path.join(projectRoot, 'playstore-icon-512.png');

sharp(Buffer.from(svg))
  .resize(512, 512)
  .png()
  .toFile(outPath)
  .then(() => console.log('Icon generated:', outPath))
  .catch(err => console.error(err));
