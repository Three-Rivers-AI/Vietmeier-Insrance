// Screenshots + quick checks against a running preview (npm run preview).
// Usage: node scripts/screens.mjs [baseUrl] [outDir]
import { chromium } from 'playwright';

const base = process.argv[2] || 'http://localhost:4321';
const out = process.argv[3] || 'docs/screens';
const browser = await chromium.launch();

async function shot(name, { scrollTo, width, height = 900, reduced = false, size, path = '/', full = true, action, hideBar = full } = {}) {
  const ctx = await browser.newContext({
    viewport: { width, height },
    deviceScaleFactor: width < 800 ? 2 : 1,
    reducedMotion: reduced ? 'reduce' : 'no-preference',
  });
  const page = await ctx.newPage();
  if (size) await page.addInitScript((s) => localStorage.setItem('text-size', s), size);
  await page.goto(base + path, { waitUntil: 'networkidle' });
  if (action) await action(page);
  // Scroll through so scroll reveals run, then back to the top.
  await page.evaluate(async () => {
    for (let y = 0; y < document.body.scrollHeight; y += 400) { window.scrollTo({ top: y, behavior: 'instant' }); await new Promise((r) => setTimeout(r, 60)); }
    window.scrollTo({ top: 0, behavior: 'instant' });
  });
  if (scrollTo) await page.locator(scrollTo).evaluate((e) => e.scrollIntoView({ block: 'start', behavior: 'instant' }));
  await page.waitForTimeout(900);
  // Fixed elements repeat oddly in full-page captures; the viewport shots show the call bar.
  if (hideBar) await page.addStyleTag({ content: '.fixed.bottom-0{display:none!important}' });
  await page.screenshot({ path: `${out}/${name}.png`, fullPage: full });
  await ctx.close();
}

const only = process.env.ONLY?.split(',');
const jobs = {
  'home-375': () => shot('home-375', { width: 375, height: 812 }),
  'home-1440': () => shot('home-1440', { width: 1440 }),
  'home-375-viewport': () => shot('home-375-viewport', { width: 375, height: 812, full: false }),
  'home-1440-viewport': () => shot('home-1440-viewport', { width: 1440, full: false }),
  'chooser-open-375': () => shot('chooser-open-375', { width: 375, height: 812, full: false, action: async (p) => {
    await p.click('[data-choice="helping-parent"]');
  }, scrollTo: '#panel-helping-parent' }),
  'text-xl-375': () => shot('text-xl-375', { width: 375, height: 812, full: false, size: 'xl' }),
  'text-xl-1440': () => shot('text-xl-1440', { width: 1440, full: false, size: 'xl' }),
  'contact-375': () => shot('contact-375', { width: 375, height: 812, path: '/contact' }),
};
for (const [k, fn] of Object.entries(jobs)) if (!only || only.includes(k)) { await fn(); console.log('saved', k); }
await browser.close();
