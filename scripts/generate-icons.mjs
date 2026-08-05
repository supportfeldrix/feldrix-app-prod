/**
 * ============================================================
 * Feldrix — PWA Icon Generator
 *
 * Takes a source logo and generates all required PWA icons
 * with a white background, properly centered with padding.
 *
 * Usage:
 *   node scripts/generate-icons.mjs <path-to-source-logo.png>
 *
 * Example:
 *   node scripts/generate-icons.mjs logo-source.png
 *
 * Output goes to: public/icons/farmer-new/
 * Review before replacing public/icons/farmer/
 * ============================================================
 */

import sharp from "sharp";
import { mkdirSync, existsSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const projectRoot = resolve(__dirname, "..");

// Source image path from CLI arg
const sourceArg = process.argv[2];
if (!sourceArg) {
  console.error("Usage: node scripts/generate-icons.mjs <source-image.png>");
  console.error("Example: node scripts/generate-icons.mjs logo-source.png");
  process.exit(1);
}

const sourcePath = resolve(projectRoot, sourceArg);
if (!existsSync(sourcePath)) {
  console.error(`Source image not found: ${sourcePath}`);
  process.exit(1);
}

// Output directory (new folder so we can review before replacing)
const outDir = resolve(projectRoot, "public/icons/farmer-new");
mkdirSync(outDir, { recursive: true });

// All required sizes
const sizes = [16, 32, 48, 72, 96, 120, 144, 152, 180, 192, 384, 512, 1024];

// Padding ratio — logo takes up 80% of the icon, 10% padding on each side
const LOGO_RATIO = 0.75;

async function generateIcon(size, filename, maskable = false) {
  // For maskable icons, use less padding (safe zone is 80% center)
  const ratio = maskable ? 0.65 : LOGO_RATIO;
  const logoSize = Math.round(size * ratio);

  // Resize the logo
  const resizedLogo = await sharp(sourcePath)
    .resize(logoSize, logoSize, { fit: "contain", background: { r: 255, g: 255, b: 255, alpha: 1 } })
    .png()
    .toBuffer();

  // Create white background and composite the logo centered
  await sharp({
    create: {
      width: size,
      height: size,
      channels: 4,
      background: { r: 255, g: 255, b: 255, alpha: 1 },
    },
  })
    .composite([
      {
        input: resizedLogo,
        gravity: "centre",
      },
    ])
    .png()
    .toFile(resolve(outDir, filename));

  console.log(`  Generated: ${filename} (${size}x${size})`);
}

async function main() {
  console.log(`\nSource: ${sourcePath}`);
  console.log(`Output: ${outDir}\n`);
  console.log("Generating standard icons...");

  // Standard icons
  for (const size of sizes) {
    await generateIcon(size, `icon-${size}x${size}.png`);
  }

  // Special named icons
  console.log("\nGenerating special icons...");
  await generateIcon(32, "favicon-32x32.png");
  await generateIcon(16, "icon-16x16.png");
  await generateIcon(180, "apple-touch-icon.png");
  await generateIcon(512, "maskable-icon-512x512.png", true);

  console.log(`\n✅ All icons generated in: public/icons/farmer-new/`);
  console.log("   Review them, then replace public/icons/farmer/ when ready.\n");
}

main().catch((err) => {
  console.error("Error:", err.message);
  process.exit(1);
});
