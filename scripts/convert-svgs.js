/*
 Batch-convert SVG social cover images to PNG (1200x630)
 - Converts every .svg in assets/images/covers/ to a same-named .png
 - Also converts assets/images/social-default.svg to social-default.png if present
 Usage: npm run svg2png
*/
import fs from 'fs';
import path from 'path';
import sharp from 'sharp';

const root = process.cwd();
const coversDir = path.join(root, 'assets/images/covers');
const defaultSvg = path.join(root, 'assets/images/social-default.svg');
const defaultPng = path.join(root, 'assets/images/social-default.png');

async function convertOne(inPath, outPath) {
  try {
    await sharp(inPath, { density: 300 })
      .resize(1200, 630, { fit: 'cover', position: 'center' })
      .flatten({ background: { r: 13, g: 17, b: 23 } }) // #0d1117 for safety if any transparency
      .png({ compressionLevel: 9, adaptiveFiltering: true })
      .toFile(outPath);
    console.log(`✓ ${path.relative(root, outPath)}`);
  } catch (err) {
    console.error(`✗ Failed to convert ${inPath}:`, err.message);
    process.exitCode = 1;
  }
}

async function run() {
  // Convert default
  if (fs.existsSync(defaultSvg)) {
    await convertOne(defaultSvg, defaultPng);
  }

  // Convert covers
  if (fs.existsSync(coversDir)) {
    const files = fs.readdirSync(coversDir).filter(f => f.endsWith('.svg'));
    for (const f of files) {
      const inPath = path.join(coversDir, f);
      const outPath = path.join(coversDir, f.replace(/\.svg$/i, '.png'));
      await convertOne(inPath, outPath);
    }
  }
}

run();

