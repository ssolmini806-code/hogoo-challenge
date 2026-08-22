const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

// 원본 PNG 마스터는 배포에서 제외하려고 public/ 밖의 assets-src/ 에 보관한다.
// 여기서는 public/images 에 새로 올린 png/jpg 만 webp 로 변환한다.
const INPUT_DIR = path.resolve(__dirname, '../public/images');
const MAX_WIDTH = 1200;
const QUALITY = 80;

async function convertToWebp(dir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);

    if (entry.isDirectory()) {
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
