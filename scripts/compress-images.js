const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const INPUT_DIR = path.resolve(__dirname, '../public/images');
const MAX_WIDTH = 1200;
const QUALITY = 80;

async function convertToWebp(dir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);

    if (entry.isDirectory()) {
      if (entry.name === 'originals') continue;
      await convertToWebp(fullPath);
      continue;
    }

    if (!/\.(png|jpe?g)$/i.test(entry.name)) continue;

    const destPath = fullPath.replace(/\.(png|jpe?g)$/i, '.webp');

    if (fs.existsSync(destPath)) {
      console.log(`skip (exists): ${path.relative(INPUT_DIR, destPath)}`);
      continue;
    }

    const meta = await sharp(fullPath).metadata();
    const resize = meta.width > MAX_WIDTH ? { width: MAX_WIDTH } : null;

    const pipeline = sharp(fullPath);
    if (resize) pipeline.resize(resize);
    await pipeline.webp({ quality: QUALITY }).toFile(destPath);

    const before = fs.statSync(fullPath).size;
    const after = fs.statSync(destPath).size;
    const pct = Math.round((1 - after / before) * 100);
    console.log(`converted: ${entry.name} → .webp  (${(before / 1024).toFixed(0)}KB → ${(after / 1024).toFixed(0)}KB, -${pct}%)`);
  }
}

convertToWebp(INPUT_DIR).catch(console.error);
