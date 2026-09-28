// End-to-end checks against a running preview (npm run build && npm run preview).
// Usage: node scripts/verify.mjs [baseUrl]
import { chromium } from 'playwright';

const base = process.argv[2] || 'http://localhost:4321';
const pages = ['/', '/medicare', '/medigap', '/life', '/annuities', '/more-coverage', '/about', '/contact', '/privacy', '/terms'];
const browser = await chromium.launch();
const results = [];
const ok = (name, pass, detail = '') => {
  results.push({ name, pass, detail });
  console.log(`${pass ? 'PASS' : 'FAIL'}  ${name}${detail ? `  (${detail})` : ''}`);
};

async function open(path, { width = 1440, height = 900, reduced = false, size } = {}) {
  const ctx = await browser.newContext({ viewport: { width, height }, reducedMotion: reduced ? 'reduce' : 'no-preference' });
  if (size) await ctx.addInitScript((s) => localStorage.setItem('text-size', s), size);
  const page = await ctx.newPage();
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  page.on('console', (m) => m.type() === 'error' && errors.push(m.text()));
  await page.goto(base + path, { waitUntil: 'networkidle' });
  return { ctx, page, errors };
}

// 1. Every page, every width, every text size: no sideways scroll, no JS errors, no header overlap.
for (const size of ['md', 'lg', 'xl']) {
  for (const width of [375, 768, 1440]) {
    const bad = [];
    for (const p of pages) {
      const { ctx, page, errors } = await open(p, { width, size });
      const r = await page.evaluate(() => {
        const overflow = document.documentElement.scrollWidth - window.innerWidth;
        // Header children must not overlap each other.
        const kids = [...document.querySelectorAll('header > div:first-child > *')]
          .filter((e) => e.offsetParent !== null)
          .map((e) => e.getBoundingClientRect());
        let overlap = false;
        for (let i = 0; i < kids.length; i++)
          for (let j = i + 1; j < kids.length; j++) {
            const a = kids[i], b = kids[j];
            if (a.left < b.right - 1 && b.left < a.right - 1 && a.top < b.bottom - 1 && b.top < a.bottom - 1) overlap = true;
          }
        return { overflow, overlap };
      });
      if (r.overflow > 0) bad.push(`${p} overflows by ${r.overflow}px`);
      if (r.overlap) bad.push(`${p} header overlap`);
      if (errors.length) bad.push(`${p} errors: ${errors.join('; ')}`);
      await ctx.close();
    }
    ok(`layout ${size} @ ${width}px across ${pages.length} pages`, bad.length === 0, bad.join(' | '));
  }
}

// 2. Text-size control scales the root and is remembered.
{
  const { ctx, page } = await open('/', { width: 1440 });
  const before = await page.evaluate(() => parseFloat(getComputedStyle(document.documentElement).fontSize));
  await page.click('#ts-desktop-label ~ div [data-size-btn="xl"]');
  const after = await page.evaluate(() => parseFloat(getComputedStyle(document.documentElement).fontSize));
  await page.reload({ waitUntil: 'networkidle' });
  const kept = await page.evaluate(() => [document.documentElement.dataset.size, document.querySelector('[data-size-btn="xl"]').getAttribute('aria-pressed')]);
  ok('text size A++ scales root font', after > before * 1.2, `${before}px -> ${after}px`);
  ok('text size remembered after reload', kept[0] === 'xl' && kept[1] === 'true', kept.join(','));
  await ctx.close();
}

// 3. Body text size and no slanted type.
for (const width of [375, 1440]) {
  const { ctx, page } = await open('/', { width });
  const r = await page.evaluate(() => {
    const body = parseFloat(getComputedStyle(document.body).fontSize);
    const lh = parseFloat(getComputedStyle(document.body).lineHeight) / body;
    const slanted = [...document.querySelectorAll('body *')].filter((e) => getComputedStyle(e).fontStyle !== 'normal').length;
    return { body, lh: Math.round(lh * 100) / 100, slanted };
  });
  ok(`body text @ ${width}px`, r.body >= (width < 1024 ? 19 : 20) && r.lh >= 1.6, `${r.body}px / ${r.lh}`);
  ok(`no slanted text @ ${width}px`, r.slanted === 0, `${r.slanted} elements`);
  await ctx.close();
}

// 4. Reduced motion: everything visible immediately, no hero drift.
{
  const { ctx, page } = await open('/', { reduced: true });
  const r = await page.evaluate(() => ({
    hidden: [...document.querySelectorAll('[data-reveal], [data-stagger] > *')].filter((e) => parseFloat(getComputedStyle(e).opacity) < 1).length,
    motionOk: document.documentElement.classList.contains('motion-ok'),
    drift: getComputedStyle(document.querySelector('.hero-drift')).animationName,
    drawn: document.querySelector('[data-timeline]').classList.contains('is-drawn'),
  }));
  ok('reduced motion: no hidden reveal content', r.hidden === 0 && !r.motionOk, `${r.hidden} hidden`);
  ok('reduced motion: hero drift off', r.drift === 'none', r.drift);
  ok('reduced motion: timeline shown fully drawn', r.drawn);
  await ctx.close();
}
{
  const { ctx, page } = await open('/');
  const r = await page.evaluate(() => getComputedStyle(document.querySelector('.hero-drift')).animationName);
  ok('normal motion: hero drift on', r === 'hero-drift', r);
  await ctx.close();
}

// 5. Chooser: each card opens its panel with 3 steps and a call link, on mobile and desktop.
for (const width of [375, 1440]) {
  const { ctx, page } = await open('/', { width });
  const ids = await page.$$eval('[data-choice]', (b) => b.map((x) => x.dataset.choice));
  const bad = [];
  for (const id of ids) {
    await page.click(`[data-choice="${id}"]`);
    await page.waitForTimeout(150);
    const r = await page.evaluate((id) => {
      const panel = document.getElementById(`panel-${id}`);
      const btn = document.querySelector(`[data-choice="${id}"]`);
      const open = [...document.querySelectorAll('.chooser-panel')].filter((p) => !p.hidden).length;
      const gap = panel.getBoundingClientRect().top - btn.getBoundingClientRect().bottom;
      return { visible: !panel.hidden && panel.offsetHeight > 0, expanded: btn.getAttribute('aria-expanded'), steps: panel.querySelectorAll('ol li').length, tel: !!panel.querySelector('a[href^="tel:"]'), open, gap };
    }, id);
    if (!r.visible || r.expanded !== 'true' || r.steps !== 3 || !r.tel || r.open !== 1) bad.push(`${id} ${JSON.stringify(r)}`);
    if (width < 640 && (r.gap < 0 || r.gap > 40)) bad.push(`${id} panel not right under card (gap ${r.gap})`);
  }
  ok(`chooser @ ${width}px opens all ${ids.length} panels`, bad.length === 0 && ids.length === 5, bad.join(' | '));
  await ctx.close();
}

// 6. Plain Answers accordion opens and closes.
{
  const { ctx, page } = await open('/', { width: 375 });
  const count = await page.$$eval('details.acc', (d) => d.length);
  await page.click('details.acc >> nth=0 >> summary');
  await page.waitForTimeout(450);
  const opened = await page.$eval('details.acc', (d) => d.open && d.querySelector('.acc-body').offsetHeight > 20);
  await page.click('details.acc >> nth=0 >> summary');
  await page.waitForTimeout(450);
  const closed = await page.$eval('details.acc', (d) => !d.open);
  ok('Plain Answers: 8 questions, open and close', count === 8 && opened && closed, `count ${count}`);
  await ctx.close();
}

// 7. Sticky header and mobile call bar.
{
  const { ctx, page } = await open('/', { width: 375, height: 812 });
  await page.evaluate(() => window.scrollTo({ top: 3000, behavior: 'instant' }));
  await page.waitForTimeout(200);
  const r = await page.evaluate(() => {
    const h = document.querySelector('header').getBoundingClientRect();
    const bar = document.querySelector('a[href^="tel:"].btn-secondary').closest('.fixed');
    const b = bar.getBoundingClientRect();
    return { headerTop: h.top, barBottom: Math.round(b.bottom), vh: window.innerHeight, links: [...bar.querySelectorAll('a')].map((a) => a.getAttribute('href')) };
  });
  ok('mobile: header sticks, call bar pinned to bottom with Call and Book', r.headerTop === 0 && r.barBottom === r.vh && r.links.length === 2, JSON.stringify(r));
  await ctx.close();
  const d = await open('/', { width: 1440 });
  const barShown = await d.page.evaluate(() => getComputedStyle(document.querySelector('.fixed.bottom-0')).display);
  ok('desktop: bottom call bar hidden, header has tel link and Book button', barShown === 'none' && (await d.page.$('header a[href^="tel:"]')) && (await d.page.$('header a.btn-primary')));
  await d.ctx.close();
}

// 8. Keyboard: tab order reaches the skip link, header controls and chooser, with visible focus.
{
  const { ctx, page } = await open('/', { width: 1440 });
  const seen = [];
  let invisible = 0;
  for (let i = 0; i < 40; i++) {
    await page.keyboard.press('Tab');
    const f = await page.evaluate(() => {
      const e = document.activeElement;
      const s = getComputedStyle(e);
      const visible = (s.outlineStyle !== 'none' && parseFloat(s.outlineWidth) >= 2) || s.boxShadow !== 'none';
      return { label: (e.getAttribute('aria-label') || e.textContent || '').trim().replace(/\s+/g, ' ').slice(0, 40), visible };
    });
    if (!f.visible) invisible++;
    seen.push(f.label);
  }
  const hit = (t) => seen.some((s) => s.includes(t));
  ok('keyboard: skip link, text size, phone, Book, nav, chooser reachable', hit('Skip to main') && hit('Largest text') && hit('412-555-0142') && hit('Book a 15-minute') && hit('Medigap') && hit('Turning 65 soon'), seen.slice(0, 16).join(' > '));
  ok('keyboard: every focused element shows a focus ring', invisible === 0, `${invisible} without a ring`);
  // Enter on a chooser card opens it.
  await page.focus('[data-choice="helping-parent"]');
  await page.keyboard.press('Enter');
  ok('keyboard: Enter opens a chooser card', (await page.getAttribute('[data-choice="helping-parent"]', 'aria-expanded')) === 'true');
  await ctx.close();
}

// 9. Tap targets: buttons, nav links and form controls at least 48px tall.
for (const width of [375, 1440]) {
  const small = [];
  for (const p of ['/', '/contact']) {
    const { ctx, page } = await open(p, { width });
    const r = await page.evaluate(() =>
      [...document.querySelectorAll('button, .btn, nav a, input:not([type=checkbox]), select, summary, label:has(input[type=checkbox])')]
        .filter((e) => e.offsetParent !== null || getComputedStyle(e).position === 'fixed')
        .filter((e) => e.getBoundingClientRect().height > 0)
        .filter((e) => e.getBoundingClientRect().height < 47.5)
        .map((e) => `${e.tagName}:${(e.textContent || e.getAttribute('aria-label') || '').trim().slice(0, 24)}:${Math.round(e.getBoundingClientRect().height)}`),
    );
    small.push(...r.map((x) => `${p} ${x}`));
    await ctx.close();
  }
  ok(`tap targets >= 48px @ ${width}px`, small.length === 0, small.slice(0, 8).join(' | '));
}

// 10. Contact form: plain errors under fields, any phone format, warm confirmation with disclaimer.
{
  // Reduced motion here so smooth scrolling to the error summary does not race the clicks.
  const { ctx, page } = await open('/contact', { width: 375, reduced: true });
  const checked = await page.$eval('#f-consent', (c) => c.checked);
  await page.click('#contact-form button[type=submit]');
  const errs = await page.$$eval('.field-error:not([hidden])', (e) => e.map((x) => x.id));
  ok('form: consent not pre-checked', checked === false);
  ok('form: empty submit shows errors under name, phone, zip, consent', ['f-name-err', 'f-phone-err', 'f-zip-err', 'f-consent-err'].every((id) => errs.includes(id)), errs.join(','));
  const forbidden = await page.evaluate(() => /medicare (number|id)|social security|ssn|date of birth|birth ?date|medication|health condition|medical condition/i.test([...document.querySelectorAll('#contact-form input, #contact-form select')].map((e) => `${e.name} ${e.labels?.[0]?.textContent ?? ''}`).join(' ')));
  ok('form: never asks for Medicare number, SSN, DOB or health details', !forbidden);
  const phoneOk = [];
  for (const v of ['412 555 0142', '(412) 555-0142', '412.555.0142', '+1 412-555-0142', '4125550142']) {
    await page.fill('#f-phone', v);
    await page.click('#contact-form button[type=submit]');
    phoneOk.push(await page.$eval('#f-phone-err', (e) => e.hidden));
  }
  ok('form: phone accepted typed any way', phoneOk.every(Boolean), phoneOk.join(','));
  await page.fill('#f-name', 'Dolores Test');
  await page.fill('#f-zip', '15136');
  // Center each control first so the fixed mobile call bar never sits on top of it.
  for (const sel of ['input[name=help] >> nth=0', '#f-consent']) {
    await page.locator(sel).evaluate((e) => e.scrollIntoView({ block: 'center', behavior: 'instant' }));
    await page.check(sel);
  }
  await page.click('#contact-form button[type=submit]');
  const thanks = await page.evaluate(() => {
    const t = document.getElementById('form-thanks');
    return !t.hidden && /We do not offer every plan available in your area/.test(t.textContent) && /Dolores/.test(t.textContent);
  });
  ok('form: confirmation shows with name and disclaimer', thanks);
  await ctx.close();
}

// 11. Compliance and guardrails on every page.
{
  const bad = [];
  for (const p of pages) {
    const { ctx, page } = await open(p);
    const r = await page.evaluate(() => ({
      robots: document.querySelector('meta[name=robots]')?.content,
      banner: /Concept site by Three Rivers AI\. Not a live insurance agency\./.test(document.getElementById('demo-banner')?.textContent || ''),
      footerDisclaimer: /We do not offer every plan available in your area/.test(document.querySelector('footer').textContent),
      box: !!document.querySelector('aside[aria-label="Required Medicare disclaimer"]'),
      closing: /Talk it through with a person/.test(document.body.textContent),
      thirdParty: [...document.querySelectorAll('script[src], link[rel=stylesheet], iframe')].map((e) => e.src || e.href).filter((u) => u && !u.startsWith(location.origin)),
    }));
    if (r.robots !== 'noindex, nofollow') bad.push(`${p} robots`);
    if (!r.banner) bad.push(`${p} banner`);
    if (!r.footerDisclaimer) bad.push(`${p} footer disclaimer`);
    if (['/medicare', '/medigap'].includes(p) && !r.box) bad.push(`${p} disclaimer box`);
    if (p !== '/contact' && !r.closing) bad.push(`${p} closing CTA`);
    if (r.thirdParty.length) bad.push(`${p} third-party: ${r.thirdParty.join(',')}`);
    await ctx.close();
  }
  ok('every page: noindex, demo banner, footer disclaimer, closing CTA, no third-party requests', bad.length === 0, bad.join(' | '));
}
{
  const { ctx, page } = await open('/');
  await page.click('#demo-banner-close');
  await page.goto(base + '/medicare', { waitUntil: 'networkidle' });
  const hiddenSameSession = await page.$eval('#demo-banner', (b) => b.hidden);
  await ctx.close();
  const fresh = await open('/');
  const shownNewSession = await fresh.page.$eval('#demo-banner', (b) => !b.hidden);
  await fresh.ctx.close();
  ok('demo banner dismiss lasts for the session only', hiddenSameSession && shownNewSession);
}

await browser.close();
const failed = results.filter((r) => !r.pass);
console.log(`\n${results.length - failed.length}/${results.length} checks passed.`);
process.exit(failed.length ? 1 : 0);
