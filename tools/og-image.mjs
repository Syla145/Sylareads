// Draws the link preview image (Reddit, WhatsApp, Discord …) into public/og-image.png,
// 1200 × 630 px: the globe logo, the name and place names in four scripts.
// Needs Playwright with a Chromium:  node tools/og-image.mjs
// (set CHROMIUM=/path/to/chrome if Playwright's own browser is not installed;
//  ROOT=/path/to/sylareads when running a copy of this file from elsewhere).
import { chromium } from 'playwright';
import fs from 'node:fs';
import path from 'node:path';
const root = process.env.ROOT ?? path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const nm = path.join(root, 'node_modules');
const b64 = (p) => fs.readFileSync(path.join(nm, p)).toString('base64');
const face = (family, file, weight = '400') => `@font-face{font-family:'${family}';src:url(data:font/woff2;base64,${b64(file)}) format('woff2');font-weight:${weight}}`;
const fonts = [
  face('I', '@fontsource-variable/inter/files/inter-latin-wght-normal.woff2', '100 900'),
  face('IC', '@fontsource-variable/inter/files/inter-cyrillic-wght-normal.woff2', '100 900'),
  face('IG', '@fontsource-variable/inter/files/inter-greek-wght-normal.woff2', '100 900'),
  face('B', '@fontsource/noto-sans-bengali/files/noto-sans-bengali-bengali-500-normal.woff2'),
  face('T', '@fontsource/noto-sans-thai-looped/files/noto-sans-thai-looped-thai-500-normal.woff2'),
].join('');
const G = '#E3A857', D = '#121417', S = '#1c1f23';
const logo = `<svg viewBox="0 0 64 64" width="168" height="168"><g transform="rotate(-20 32 32)">
  <circle cx="32" cy="32" r="22" fill="${S}" stroke="${G}" stroke-width="2.4"/>
  <ellipse cx="32" cy="32" rx="9" ry="22" fill="none" stroke="${G}" stroke-opacity=".5" stroke-width="1.5"/>
  <ellipse cx="32" cy="32" rx="17" ry="22" fill="none" stroke="${G}" stroke-opacity=".3" stroke-width="1.3"/>
  <path d="M10 32h44M13.5 21h37M13.5 43h37" stroke="${G}" stroke-opacity=".5" stroke-width="1.5"/></g>
  <text x="32" y="41.5" font-family="IC" font-weight="800" font-size="26" text-anchor="middle" fill="${S}" stroke="${S}" stroke-width="3.6" stroke-linejoin="round">Я</text>
  <text x="32" y="41.5" font-family="IC" font-weight="800" font-size="26" text-anchor="middle" fill="${G}">Я</text></svg>`;
// Road-sign style chips with real place names.
const signs = [
  ['ঢাকা', 'Dhaka', 'B'],
  ['เชียงใหม่', 'Chiang Mai', 'T'],
  ['Москва', 'Moskva', 'IC'],
  ['Αθήνα', 'Athina', 'IG'],
];
const html = `<!doctype html><style>${fonts}
html,body{margin:0;width:1200px;height:630px;background:${D};color:#eceae4;font-family:I,IC,IG,sans-serif}
.wrap{box-sizing:border-box;height:630px;padding:72px 80px;display:grid;grid-template-columns:auto 1fr;gap:28px 40px;align-content:center}
h1{margin:0;font-size:88px;font-weight:750;letter-spacing:-0.035em;line-height:1}
p{margin:14px 0 0;font-size:34px;color:#a3a7ad;line-height:1.3;max-width:820px}
.signs{grid-column:1/-1;display:flex;gap:18px;margin-top:26px}
.sign{flex:1;border-radius:14px;background:#1a1d21;border:2px solid #41474f;box-shadow:inset 0 0 0 6px #1a1d21,inset 0 0 0 8px #2e3338;padding:20px 18px 16px;text-align:center}
.n{font-size:46px;line-height:1.25;color:#eceae4;white-space:nowrap}
.l{font-size:22px;color:${G};margin-top:4px;font-weight:600}
</style><div class="wrap">${logo}<div><h1>Sylareads</h1><p>Learn to read the scripts on GeoGuessr signs – free, no ads, no tracking.</p></div>
<div class="signs">${signs.map(([n, l, f]) => `<div class="sign"><div class="n" style="font-family:${f}">${n}</div><div class="l">${l}</div></div>`).join('')}</div></div>`;
const b = await chromium.launch(process.env.CHROMIUM ? { executablePath: process.env.CHROMIUM } : {});
const p = await b.newPage({ viewport: { width: 1200, height: 630 } });
await p.setContent(html);
await p.waitForTimeout(600);
await p.screenshot({ path: path.join(root, 'public/og-image.png') });
await b.close();
console.log('public/og-image.png written');
