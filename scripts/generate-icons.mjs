/**
 * Generate PNG icons from SVG masters for both Farmer App and Admin Control Centre.
 * Run: node scripts/generate-icons.mjs
 */

import sharp from 'sharp';
import { mkdirSync, existsSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, '..');

const SIZES = [1024, 512, 384, 192, 180, 152, 144, 120, 96, 72, 48, 32, 16];

const icons = [
  {
    name: 'farmer',
    src: resolve(root, 'public/branding/feldrix-farmer-icon.svg'),
    outDir: resolve(root, 'public/icons/farmer'),
  },
  {
    name: 'admin',
    src: resolve(root, 'public/branding/feldrix-admin-icon.svg'),
    outDir: resolve(root, 'public/icons/admin'),
  },
];

async function generate() {
  for (const icon of icons) {
    if (!existsSync(icon.outDir)) {
      mkdirSync(icon.outDir, { recursive: true });
    }

    console.log(`\nGenerating ${icon.name} icons from ${icon.src}...`);

    for (const size of SIZES) {
      const outPath = resolve(icon.outDir, `icon-${size}x${size}.png`);
      await sharp(icon.src, { density: 300 })
        .resize(size, size)
        .png()
        .toFile(outPath);
      console.log(`  ✓ ${size}x${size}`);
    }

    // Apple Touch Icon (180x180)
    const applePath = resolve(icon.outDir, 'apple-touch-icon.png');
    await sharp(icon.src, { density: 300 })
      .resize(180, 180)
      .png()
      .toFile(applePath);
    console.log(`  ✓ apple-touch-icon.png`);

    // Maskable icon (512x512 with padding for safe zone)
    const maskablePath = resolve(icon.outDir, 'maskable-icon-512x512.png');
    const padding = Math.round(512 * 0.1); // 10% padding
    const innerSize = 512 - (padding * 2);
    const resized = await sharp(icon.src, { density: 300 })
      .resize(innerSize, innerSize)
      .png()
      .toBuffer();

    // Determine background color
    const bgColor = icon.name === 'farmer'
      ? { r: 255, g: 255, b: 255, alpha: 1 }
      : { r: 30, g: 41, b: 59, alpha: 1 };

    await sharp({
      create: { width: 512, height: 512, channels: 4, background: bgColor }
    })
      .composite([{ input: resized, top: padding, left: padding }])
      .png()
      .toFile(maskablePath);
    console.log(`  ✓ maskable-icon-512x512.png`);

    // Favicon (32x32)
    const faviconPath = resolve(icon.outDir, 'favicon-32x32.png');
    await sharp(icon.src, { density: 300 })
      .resize(32, 32)
      .png()
      .toFile(faviconPath);
    console.log(`  ✓ favicon-32x32.png`);

    // Update branding 1024px master
    if (icon.name === 'farmer') {
      await sharp(icon.src, { density: 300 }).resize(1024, 1024).png().toFile(resolve(root, 'public/branding/app-icon-1024.png'));
      console.log(`  ✓ Updated branding/app-icon-1024.png`);
    }
  }

  console.log('\n✅ All icons generated successfully!\n');
}

generate().catch((err) => {
  console.error('Icon generation failed:', err);
  process.exit(1);
});
