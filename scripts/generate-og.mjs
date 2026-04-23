#!/usr/bin/env node
// Generate OG images for homepage, essays, and responses.
// Uses the site's typographic system: IBM Plex Sans (brand) + IBM Plex
// Mono (system) + Fraunces (editorial).

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import matter from 'gray-matter';
import satori from 'satori';
import { html } from 'satori-html';
import { Resvg } from '@resvg/resvg-js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, '..');
const outDir = path.join(rootDir, 'public', 'og');
const fontBase = path.join(rootDir, 'node_modules', '@fontsource');

fs.mkdirSync(outDir, { recursive: true });

// ── Load fonts (WOFF — Satori supports TTF/OTF/WOFF) ─────────────────
const fonts = [
  {
    name: 'IBM Plex Sans',
    data: fs.readFileSync(path.join(fontBase, 'ibm-plex-sans/files/ibm-plex-sans-latin-700-normal.woff')),
    weight: 700,
    style: 'normal',
  },
  {
    name: 'IBM Plex Mono',
    data: fs.readFileSync(path.join(fontBase, 'ibm-plex-mono/files/ibm-plex-mono-latin-400-normal.woff')),
    weight: 400,
    style: 'normal',
  },
  {
    name: 'IBM Plex Mono',
    data: fs.readFileSync(path.join(fontBase, 'ibm-plex-mono/files/ibm-plex-mono-latin-500-normal.woff')),
    weight: 500,
    style: 'normal',
  },
  {
    name: 'Fraunces',
    data: fs.readFileSync(path.join(fontBase, 'fraunces/files/fraunces-latin-700-normal.woff')),
    weight: 700,
    style: 'normal',
  },
  {
    name: 'Fraunces',
    data: fs.readFileSync(path.join(fontBase, 'fraunces/files/fraunces-latin-500-italic.woff')),
    weight: 500,
    style: 'italic',
  },
];

// ── Roman numeral helper ───────────────────────────────────────────
function toRoman(num) {
  const pairs = [['M', 1000], ['CM', 900], ['D', 500], ['CD', 400], ['C', 100], ['XC', 90], ['L', 50], ['XL', 40], ['X', 10], ['IX', 9], ['V', 5], ['IV', 4], ['I', 1]];
  let n = num;
  let out = '';
  for (const [sym, val] of pairs) {
    while (n >= val) { out += sym; n -= val; }
  }
  return out;
}

// ── Dynamic title sizing — scales down for longer titles ────────────
// Sizes bumped slightly now that the lede is gone and the title has
// the full vertical column to itself.
function pickTitleSize(text) {
  const len = text.length;
  if (len <= 28) return 124;
  if (len <= 45) return 108;
  if (len <= 65) return 92;
  if (len <= 85) return 76;
  return 64;
}

// ── Template — four voices, no lede (kept tight for social preview) ──
function template({ kind, number, category, title, date }) {
  const kindLabel = kind === 'essay' ? 'Essay' : kind === 'response' ? 'Response' : 'Journal';
  const numeral = number ? toRoman(number) : '';
  const titleSize = pickTitleSize(title);

  // Top-line metadata: "// PROTOCOL JOURNAL · ESSAY IV"
  const topLine = kind === 'home'
    ? '// THE PROTOCOL JOURNAL'
    : `// PROTOCOL JOURNAL · ${kindLabel.toUpperCase()} ${numeral}`;

  return html(`
    <div style="
      width: 1200px;
      height: 630px;
      display: flex;
      flex-direction: column;
      background: #0b0b11;
      color: rgba(232,232,240,0.95);
      font-family: 'Inter', sans-serif;
      padding: 72px 80px;
      position: relative;
      overflow: hidden;
    ">

      <!-- Violet gradient glow, top-right -->
      <div style="
        position: absolute;
        top: -200px;
        right: -160px;
        width: 680px;
        height: 680px;
        border-radius: 50%;
        background: radial-gradient(circle, rgba(167,139,250,0.38), rgba(167,139,250,0.10) 45%, transparent 70%);
        display: flex;
      "></div>

      <!-- Sky-blue gradient glow, bottom-left -->
      <div style="
        position: absolute;
        bottom: -220px;
        left: -180px;
        width: 640px;
        height: 640px;
        border-radius: 50%;
        background: radial-gradient(circle, rgba(56,189,248,0.22), rgba(56,189,248,0.06) 45%, transparent 70%);
        display: flex;
      "></div>

      <!-- Top strip: mono metadata -->
      <div style="
        display: flex;
        align-items: center;
        justify-content: space-between;
        font-family: 'IBM Plex Mono';
        font-weight: 500;
        font-size: 22px;
        letter-spacing: 5.5px;
        text-transform: uppercase;
        color: rgba(232,232,240,0.80);
        z-index: 2;
      ">
        <div style="display: flex; align-items: baseline; gap: 18px;">
          <span style="color: #a78bfa; letter-spacing: 0;">//</span>
          <span>${topLine.replace('// ', '')}</span>
        </div>
        ${date ? `<span style="color: rgba(232,232,240,0.55);">${date}</span>` : ''}
      </div>

      <!-- Second line: category + divider -->
      ${category ? `
      <div style="
        display: flex;
        align-items: baseline;
        gap: 18px;
        margin-top: 16px;
        font-family: 'IBM Plex Mono';
        font-weight: 500;
        font-size: 22px;
        letter-spacing: 5.5px;
        text-transform: uppercase;
        color: #a78bfa;
        z-index: 2;
      ">
        <span style="color: #a78bfa; letter-spacing: 0;">//</span>
        <span>${category}</span>
      </div>
      ` : ''}

      <!-- Spacer -->
      <div style="flex: 1; display: flex;"></div>

      <!-- Title — Fraunces display, owns the whole column -->
      <div style="
        display: flex;
        font-family: 'Fraunces';
        font-weight: 700;
        font-size: ${titleSize}px;
        line-height: 1.0;
        letter-spacing: -2px;
        color: rgba(255,255,255,0.96);
        max-width: 1000px;
        z-index: 2;
      ">${title}</div>

      <!-- Accent rule -->
      <div style="
        display: flex;
        height: 1px;
        background: linear-gradient(to right, #a78bfa 0%, rgba(167,139,250,0.15) 40%, transparent 80%);
        margin-top: 56px;
        margin-bottom: 26px;
        z-index: 2;
      "></div>

      <!-- Footer: just the signature, quiet -->
      <div style="
        display: flex;
        font-family: 'IBM Plex Mono';
        font-weight: 400;
        font-size: 20px;
        letter-spacing: 4.4px;
        text-transform: uppercase;
        color: rgba(232,232,240,0.55);
        z-index: 2;
      ">
        <span>Matt Smithies</span>
      </div>
    </div>
  `);
}

// ── Render + save ───────────────────────────────────────────────────
async function renderToPng(markup, outputPath) {
  const svg = await satori(markup, {
    width: 1200,
    height: 630,
    fonts,
  });
  const resvg = new Resvg(svg, { fitTo: { mode: 'width', value: 1200 } });
  const png = resvg.render().asPng();
  fs.writeFileSync(outputPath, png);
}

// ── Collect content ─────────────────────────────────────────────────
function loadFrontmatter(filePath) {
  const raw = fs.readFileSync(filePath, 'utf-8');
  return matter(raw).data;
}

function formatDate(d) {
  if (!d) return undefined;
  const date = typeof d === 'string' ? new Date(d) : d;
  if (Number.isNaN(date.getTime())) return typeof d === 'string' ? d : undefined;
  return date.toISOString().slice(0, 7); // YYYY-MM
}

const essayDir = path.join(rootDir, 'src', 'content', 'essays');
const responseDir = path.join(rootDir, 'src', 'content', 'responses');

const essayFiles = fs.readdirSync(essayDir).filter(f => f.endsWith('.md'));
const responseFiles = fs.readdirSync(responseDir).filter(f => f.endsWith('.md') || f.endsWith('.mdx'));

const jobs = [];

// Essays
for (const file of essayFiles) {
  const filePath = path.join(essayDir, file);
  const fm = loadFrontmatter(filePath);
  const slug = file.replace(/\.mdx?$/, '');
  jobs.push({
    out: path.join(outDir, `${slug}.png`),
    markup: template({
      kind: 'essay',
      number: fm.order,
      category: fm.category,
      title: fm.title,
      lede: fm.summary,
    }),
    label: `essay · ${slug}`,
  });
}

// Responses
for (const file of responseFiles) {
  const filePath = path.join(responseDir, file);
  const fm = loadFrontmatter(filePath);
  const slug = file.replace(/\.mdx?$/, '');
  jobs.push({
    out: path.join(outDir, `${slug}.png`),
    markup: template({
      kind: 'response',
      number: fm.order,
      category: 'Public Intervention',
      title: fm.title,
      lede: fm.summary,
      date: formatDate(fm.publishedDate ?? fm.date),
    }),
    label: `response · ${slug}`,
  });
}

// Homepage (default og-image.png at repo root of /public/)
jobs.push({
  out: path.join(rootDir, 'public', 'og-image.png'),
  markup: template({
    kind: 'home',
    category: 'Long-horizon systems architecture',
    title: 'Matt Smithies',
    lede: 'Writing on authority, replayability, digital identity, and trust infrastructure.',
  }),
  label: 'homepage · default og',
});

// Run
for (const job of jobs) {
  process.stdout.write(`→ ${job.label} ... `);
  await renderToPng(job.markup, job.out);
  process.stdout.write('done\n');
}
console.log(`\nWrote ${jobs.length} images.`);
