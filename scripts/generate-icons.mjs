import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import sharp from 'sharp';
import pngToIco from 'png-to-ico';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, '..');
const buildDir = path.join(root, 'build');
const publicDir = path.join(root, 'public');

const source = path.join(buildDir, 'icon-1024.png');

async function main() {
  if (!fs.existsSync(source)) {
    console.error('Missing build/icon-1024.png — run icon generation first.');
    process.exit(1);
  }

  const sizes = [16, 32, 48, 64, 128, 256, 512];
  const pngBuffers = [];

  for (const size of sizes) {
    const out = path.join(buildDir, `icon-${size}.png`);
    await sharp(source).resize(size, size).png().toFile(out);
    if (size <= 256) {
      pngBuffers.push(out);
    }
  }

  await sharp(source).resize(256, 256).png().toFile(path.join(buildDir, 'icon.png'));

  const ico = await pngToIco(pngBuffers);
  fs.writeFileSync(path.join(buildDir, 'icon.ico'), ico);

  await sharp(source).resize(32, 32).png().toFile(path.join(publicDir, 'favicon.png'));
  console.log('Generated build/icon.ico, build/icon.png, and public/favicon.png');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
