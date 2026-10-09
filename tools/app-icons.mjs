// Draws the app icons (globe with Я, the same drawing as LogoMark in src/ui/TopBar.tsx)
// into public/icons/. Needs Playwright with a Chromium:  node tools/app-icons.mjs
// (set CHROMIUM=/path/to/chrome if Playwright's own browser is not installed).
import { chromium } from 'playwright';
import fs from 'node:fs';
import path from 'node:path';
const root = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const nm = path.join(root, 'node_modules');
const f = (p) => fs.readFileSync(p).toString('base64');
const font = `@font-face{font-family:I;src:url(data:font/woff2;base64,${f(nm + '/@fontsource-variable/inter/files/inter-cyrillic-wght-normal.woff2')}) format('woff2');font-weight:100 900}`;
const G = '#E3A857', D = '#121417', S = '#1c1f23';
// The globe mark in a 64-unit box (no background).
const mark = `<g transform="rotate(-20 32 32)">
  <circle cx="32" cy="32" r="22" fill="${S}" stroke="${G}" stroke-width="2.4"/>
  <ellipse cx="32" cy="32" rx="9" ry="22" fill="none" stroke="${G}" stroke-opacity=".5" stroke-width="1.5"/>
  <ellipse cx="32" cy="32" rx="17" ry="22" fill="none" stroke="${G}" stroke-opacity=".3" stroke-width="1.3"/>
  <path d="M10 32h44M13.5 21h37M13.5 43h37" stroke="${G}" stroke-opacity=".5" stroke-width="1.5"/>
</g>
<text x="32" y="41.5" font-family="I" font-weight="800" font-size="26" text-anchor="middle" fill="${S}" stroke="${S}" stroke-width="3.6" stroke-linejoin="round">Я</text>
<text x="32" y="41.5" font-family="I" font-weight="800" font-size="26" text-anchor="middle" fill="${G}">Я</text>`;
const icon = ({ rounded, scale }) => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64">
  <rect width="64" height="64" ${rounded ? 'rx="14"' : ''} fill="${D}"/>
  <g transform="translate(32 32) scale(${scale}) translate(-32 -32)">${mark}</g></svg>`;
const out = path.join(root, 'public/icons/');
const jobs = [
  ['icon-192.png', 192, { rounded: true, scale: 1 }],
  ['icon-512.png', 512, { rounded: true, scale: 1 }],
  ['icon-maskable-512.png', 512, { rounded: false, scale: 0.78 }],
  ['apple-touch-icon.png', 180, { rounded: false, scale: 0.9 }],
  ['favicon-32.png', 32, { rounded: true, scale: 1.08 }],
  ['favicon-64.png', 64, { rounded: true, scale: 1.04 }],
];
const b = await chromium.launch(process.env.CHROMIUM ? { executablePath: process.env.CHROMIUM } : {});
for (const [name, size, opts] of jobs) {
  const p = await b.newPage({ viewport: { width: size, height: size } });
  await p.setContent(`<!doctype html><style>${font}html,body{margin:0;background:transparent}svg{display:block;width:${size}px;height:${size}px}</style>${icon(opts)}`);
  await p.waitForTimeout(400);
  await p.screenshot({ path: out + name, omitBackground: true });
  await p.close();
}
await b.close();
console.log(`${jobs.length} icons written to public/icons/`);
