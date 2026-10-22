// Regenerates the raster app icons from the brand kit's vector artwork.
//
//   npm run icons
//
// - src/app/favicon.ico      16 (brand/icon-16.svg, the simplified small-size
//                            mark) + 32 + 48 (src/app/icon.svg)
// - src/app/apple-icon.png   180, flattened onto the tile blue — iOS fills
//                            transparent corners with black
// - public/icon-512.png      512, flattened the same way (manifest "any")
// - public/icon-maskable-512.png
//                            the icon at 80% on a full-bleed blue square, so
//                            Android's mask crops only background (manifest "maskable")
//
// The SVGs themselves are never modified.
import { readFile, writeFile } from "node:fs/promises";
import sharp from "sharp";
import pngToIco from "png-to-ico";

const TILE_BLUE = "#2B4C9B";
const ICON = "src/app/icon.svg";
const ICON_16 = "public/brand/icon-16.svg";

/** Rasterise a 512-unit SVG at exactly `size` px (rendered at that density, not scaled down). */
async function render(file, size) {
  const svg = await readFile(file);
  const { width } = await sharp(svg).metadata();
  return sharp(svg, { density: (72 * size) / width })
    .resize(size, size)
    .png()
    .toBuffer();
}

const flatten = (png) => sharp(png).flatten({ background: TILE_BLUE }).png().toBuffer();

const ico = await pngToIco([
  await render(ICON_16, 16),
  await render(ICON, 32),
  await render(ICON, 48),
]);
await writeFile("src/app/favicon.ico", ico);

await writeFile("src/app/apple-icon.png", await flatten(await render(ICON, 180)));
await writeFile("public/icon-512.png", await flatten(await render(ICON, 512)));

const inner = Math.round(512 * 0.8);
const maskable = await sharp({
  create: { width: 512, height: 512, channels: 3, background: TILE_BLUE },
})
  .composite([{ input: await render(ICON, inner), gravity: "center" }])
  .png()
  .toBuffer();
// A second pass: in one pipeline sharp flattens before compositing, leaving an alpha channel.
await writeFile("public/icon-maskable-512.png", await flatten(maskable));

console.log(
  "icons written: favicon.ico (16/32/48), apple-icon.png, icon-512.png, icon-maskable-512.png"
);
