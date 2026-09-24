import { createHash } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

import sharp from "sharp";

const root = process.cwd();
const publicBrand = path.join(root, "public", "brand");
const publicMedia = path.join(root, "public", "media");
const outputDirectory = path.join(root, "outputs", "social-card-c099");
const socialCardPath = path.join(publicBrand, "mapa-da-pesquisa-social-card.png");
const posterPath = path.join(publicMedia, "mapa-da-pesquisa-apresentacao-poster.webp");

const wordmark = await sharp(path.join(publicBrand, "mapa-da-pesquisa-wordmark.png"))
  .resize({ width: 314, height: 86, fit: "contain" })
  .png()
  .toBuffer();
const appIcon = await sharp(path.join(publicBrand, "mapa-da-pesquisa-app-icon.png"))
  .resize({ width: 286, height: 286, fit: "contain" })
  .png()
  .toBuffer();

const cardBackground = Buffer.from(`
  <svg width="1200" height="630" viewBox="0 0 1200 630" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="background" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0" stop-color="#10251d"/>
        <stop offset="0.58" stop-color="#176b4d"/>
        <stop offset="1" stop-color="#63b68f"/>
      </linearGradient>
      <radialGradient id="glow" cx="0" cy="0" r="1" gradientTransform="translate(982 112) rotate(122) scale(570 620)">
        <stop stop-color="#d8f4e6" stop-opacity=".38"/>
        <stop offset="1" stop-color="#d8f4e6" stop-opacity="0"/>
      </radialGradient>
      <pattern id="grid" width="54" height="54" patternUnits="userSpaceOnUse">
        <path d="M54 0H0V54" fill="none" stroke="#ffffff" stroke-opacity=".055"/>
      </pattern>
      <filter id="shadow" x="-30%" y="-30%" width="160%" height="160%">
        <feDropShadow dx="0" dy="24" stdDeviation="28" flood-color="#07130e" flood-opacity=".34"/>
      </filter>
    </defs>
    <rect width="1200" height="630" rx="0" fill="url(#background)"/>
    <rect width="1200" height="630" fill="url(#glow)"/>
    <rect width="1200" height="630" fill="url(#grid)"/>
    <circle cx="1096" cy="-40" r="216" fill="none" stroke="#ffffff" stroke-opacity=".13" stroke-width="2"/>
    <circle cx="1110" cy="-32" r="142" fill="none" stroke="#ffffff" stroke-opacity=".10" stroke-width="2"/>
    <rect x="58" y="48" width="390" height="96" rx="22" fill="#ffffff" fill-opacity=".96"/>
    <text x="64" y="236" fill="#9fe1c2" font-family="Arial, Helvetica, sans-serif" font-size="22" font-weight="700" letter-spacing="3">PESQUISA COM MÉTODO</text>
    <text x="64" y="306" fill="#ffffff" font-family="Arial, Helvetica, sans-serif" font-size="58" font-weight="800" letter-spacing="-2.6">Da situação-problema</text>
    <text x="64" y="372" fill="#ffffff" font-family="Arial, Helvetica, sans-serif" font-size="58" font-weight="800" letter-spacing="-2.6">ao projeto de pesquisa.</text>
    <text x="66" y="430" fill="#d9eee4" font-family="Arial, Helvetica, sans-serif" font-size="25">Mapa Rápido ou Avançado · IA + revisão humana</text>
    <rect x="64" y="492" width="230" height="58" rx="29" fill="#ffffff"/>
    <text x="179" y="529" text-anchor="middle" fill="#176b4d" font-family="Arial, Helvetica, sans-serif" font-size="21" font-weight="800">COMECE SEU MAPA</text>
    <text x="322" y="528" fill="#d9eee4" font-family="Arial, Helvetica, sans-serif" font-size="21">mapadapesquisa.com.br</text>
    <rect x="824" y="148" width="314" height="334" rx="48" fill="#ffffff" fill-opacity=".94" filter="url(#shadow)"/>
    <rect x="842" y="166" width="278" height="298" rx="34" fill="#edf7f2"/>
    <path d="M824 504H1138" stroke="#ffffff" stroke-opacity=".22" stroke-width="2"/>
    <text x="981" y="540" text-anchor="middle" fill="#d9eee4" font-family="Arial, Helvetica, sans-serif" font-size="18" font-weight="700" letter-spacing="1.7">CLAREZA · COERÊNCIA · AVANÇO</text>
  </svg>
`);

await sharp(cardBackground)
  .composite([
    { input: wordmark, left: 96, top: 53 },
    { input: appIcon, left: 838, top: 171 },
  ])
  .png({ compressionLevel: 9 })
  .toFile(socialCardPath);

await sharp(path.join(publicMedia, "mapa-da-pesquisa-apresentacao-poster.png"))
  .webp({ quality: 78, effort: 6, smartSubsample: true })
  .toFile(posterPath);

await mkdir(outputDirectory, { recursive: true });

const files = await Promise.all([
  [socialCardPath, "public/brand/mapa-da-pesquisa-social-card.png", [1200, 630]],
  [posterPath, "public/media/mapa-da-pesquisa-apresentacao-poster.webp", [576, 976]],
].map(async ([absolutePath, relativePath, dimensions]) => {
  const bytes = await readFile(absolutePath);
  return {
    path: relativePath,
    width: dimensions[0],
    height: dimensions[1],
    bytes: bytes.byteLength,
    sha256: createHash("sha256").update(bytes).digest("hex"),
  };
}));

await writeFile(path.join(outputDirectory, "manifest.json"), `${JSON.stringify({
  change: "C099",
  generatedOn: "2026-09-24",
  exactCopy: [
    "Da situação-problema ao projeto de pesquisa.",
    "Mapa Rápido ou Avançado · IA + revisão humana",
    "COMECE SEU MAPA",
    "mapadapesquisa.com.br",
  ],
  preservedSources: [
    "public/brand/mapa-da-pesquisa-wordmark.png",
    "public/brand/mapa-da-pesquisa-app-icon.png",
    "public/media/mapa-da-pesquisa-apresentacao-poster.png",
  ],
  files,
}, null, 2)}\n`);

console.log(JSON.stringify({ files }, null, 2));
