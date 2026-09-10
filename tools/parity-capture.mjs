// Parity capture: real live site vs local rebuild. Full-page screenshots + structured
// extract (sections+bg, images, videos, fonts) -> /tmp/parity/{real,app}/ + {real,app}.json
// Run:  (backend) php -S 127.0.0.1:8799 -t server   (frontend) cd app && npm run dev
//       node tools/parity-capture.mjs            # both sides
//       node tools/parity-capture.mjs app        # only the rebuild (real side unchanged)
// If the playwright/chromium paths below break: ls ~/Library/Caches/ms-playwright/ (chromium-XXXX),
// and find the npx cache with: ls -d ~/.npm/_npx/*/node_modules/playwright-core
import { createRequire } from 'module';
import { writeFileSync, mkdirSync } from 'fs';
const require = createRequire('/Users/shukrullo/.npm/_npx/9833c18b2d85bc59/node_modules/');
const { chromium } = require('playwright-core');

const EXEC = process.env.HOME + '/Library/Caches/ms-playwright/chromium-1217/chrome-mac-arm64/Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing';
const REAL = 'https://it-academy.uz';
const APP = 'http://localhost:5173';
const ONLY = process.argv[2]; // 'app' | 'real' | undefined(both)

const ROUTES = [
  ['home', '/'], ['about', '/about'], ['courses', '/courses'],
  ['web_programming', '/web_programming'], ['python', '/python'],
  ['datascience', '/datascience'], ['graphic', '/graphic'],
  ['camp', '/camp'], ['dodo', '/dodo'], ['openday', '/openday'],
  ['vacancy', '/vacancy'], ['contacts', '/contacts'], ['oferta', '/oferta'],
  ['schedule', '/schedule'], ['news2', '/news_stories/2'],
];

const EXTRACT = () => {
  const cs = (el) => getComputedStyle(el);
  const vis = (el) => { const r = el.getBoundingClientRect(); const s = cs(el);
    return r.width > 0 && r.height > 0 && s.visibility !== 'hidden' && s.display !== 'none'; };
  const eff = (el) => { let n = el; while (n) { const b = cs(n).backgroundColor;
    if (b && b !== 'rgba(0, 0, 0, 0)' && b !== 'transparent') return b; n = n.parentElement; } return 'white(default)'; };
  const base = (u) => { try { return decodeURIComponent(new URL(u, location.href).pathname.split('/').pop()); } catch { return u; } };
  const imgs = [...document.querySelectorAll('img')].filter(vis);
  const sections = [...document.querySelectorAll('section')].filter(vis).map(s => ({
    cls: (s.className||'').toString().trim().split(/\s+/)[0].slice(0,28),
    bg: eff(s), color: cs(s).color,
    h: (s.querySelector('h1,h2,h3')?.innerText||'').trim().replace(/\s+/g,' ').slice(0,46),
  }));
  return { title: document.title, docHeight: document.documentElement.scrollHeight,
    pageBg: eff(document.body), font: cs(document.body).fontFamily.split(',')[0],
    sectionCount: sections.length, sections, imgCount: imgs.length,
    brokenImgs: imgs.filter(i => i.complete && i.naturalWidth === 0).map(i => i.getAttribute('src')),
    imgs: [...new Set(imgs.map(i => base(i.getAttribute('src')||'')))].slice(0,60),
    videos: [...document.querySelectorAll('iframe,video')].map(v => ({ tag: v.tagName, src: (v.src||'').slice(0,90), title: v.title||'' })),
    headings: [...document.querySelectorAll('h1,h2,h3,h4')].filter(vis).map(h => `${h.tagName}: ${h.innerText.trim().replace(/\s+/g,' ')}`).filter(t => t.length > 4),
    links: [...new Set([...document.querySelectorAll('a[href]')].map(a => a.getAttribute('href')).filter(h => h && h.startsWith('/') && !h.startsWith('//')))].slice(0,60),
  };
};

const browser = await chromium.launch({ executablePath: EXEC, headless: true });
const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 }, deviceScaleFactor: 1 });
const page = await ctx.newPage();

async function grab(baseUrl, key, path) {
  const out = { key, path, errors: [] };
  page.removeAllListeners('pageerror');
  page.on('pageerror', e => out.errors.push(String(e).slice(0,160)));
  try { await page.goto(baseUrl + path, { waitUntil: 'load', timeout: 25000 }); }
  catch { try { await page.goto(baseUrl + path, { waitUntil: 'domcontentloaded', timeout: 25000 }); } catch {} }
  await page.waitForTimeout(2200);
  await page.evaluate(async () => { const h = document.body.scrollHeight;
    for (let y = 0; y < h; y += 600) { window.scrollTo(0, y); await new Promise(r=>setTimeout(r,50)); } window.scrollTo(0,0); });
  await page.waitForTimeout(800);
  try { Object.assign(out, await page.evaluate(EXTRACT)); } catch(e){ out.extractErr = String(e).slice(0,120); }
  return out;
}

const sides = [['real', REAL], ['app', APP]].filter(([s]) => !ONLY || ONLY === s);
for (const [side, baseUrl] of sides) {
  mkdirSync('/tmp/parity/' + side, { recursive: true });
  const summary = {};
  for (const [key, path] of ROUTES) {
    const out = await grab(baseUrl, key, path);
    await page.screenshot({ path: `/tmp/parity/${side}/${key}.png`, fullPage: true }).catch(()=>{});
    summary[key] = out;
    console.log(`${side.padEnd(4)} ${key.padEnd(16)} sec=${String(out.sectionCount).padEnd(2)} imgs=${String(out.imgCount).padEnd(3)} vid=${(out.videos||[]).length} broken=${(out.brokenImgs||[]).length} bg=${(out.pageBg||'').padEnd(16)} h=${String(out.docHeight).padEnd(6)} err=${out.errors.length}`);
  }
  writeFileSync(`/tmp/parity/${side}.json`, JSON.stringify(summary, null, 2));
}
await browser.close();
console.log('DONE');
