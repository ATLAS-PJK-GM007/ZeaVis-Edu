#!/usr/bin/env node
/**
 * Generate Android launcher icons from the ZeaVis Edu logo SVG.
 * Produces PNGs at all required densities and replaces Tauri's default icons.
 *
 * Usage: node scripts/generate-icons.js
 * Requires: bun add sharp (already in devDependencies)
 */

const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const LOGO = path.resolve(__dirname, '../../../.github/assets/zeavis-logo.svg');
const RES = path.resolve(__dirname, '../gen/android/app/src/main/res');

// Android density buckets: [folder, size]
const DENSITIES = [
  ['mipmap-mdpi', 48],
  ['mipmap-hdpi', 72],
  ['mipmap-xhdpi', 96],
  ['mipmap-xxhdpi', 144],
  ['mipmap-xxxhdpi', 192],
];

async function generate() {
  if (!fs.existsSync(LOGO)) {
    console.error(`ERROR: Logo not found at ${LOGO}`);
    process.exit(1);
  }

  console.log(`Generating icons from ${LOGO}...`);

  for (const [folder, size] of DENSITIES) {
    const dir = path.join(RES, folder);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

    const png = await sharp(LOGO)
      .resize(size, size, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
      .png()
      .toBuffer();

    // Write both legacy and adaptive icon names
    for (const name of ['ic_launcher.png', 'ic_launcher_foreground.png', 'ic_launcher_round.png']) {
      fs.writeFileSync(path.join(dir, name), png);
    }
    console.log(`  ${folder}: ${size}x${size} OK`);
  }

  // Also write the legacy icon to drawable for completeness
  const drawableDir = path.join(RES, 'drawable');
  if (!fs.existsSync(drawableDir)) fs.mkdirSync(drawableDir, { recursive: true });
  const refPng = await sharp(LOGO)
    .resize(144, 144, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .png()
    .toBuffer();
  fs.writeFileSync(path.join(drawableDir, 'ic_launcher.png'), refPng);

  console.log('Done. Android launcher icons generated.');
}

generate().catch((err) => {
  console.error(err);
  process.exit(1);
});
