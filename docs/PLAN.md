# Vietmeier Insurance concept site: build plan

A sales demo from Three Rivers AI. Not a live agency site.

## Stack
- Astro (static output), TypeScript strict, Tailwind v4 via `@tailwindcss/vite`.
- Fonts self-hosted with Fontsource (no Google Fonts request, no tracking):
  Source Serif 4 600 for headings, Atkinson Hyperlegible 400/700 for body.
- Motion (motion.dev) for scroll reveals, card stagger and the timeline draw.
  Everything else is CSS transitions.
- Images: originals in `photo-src/`, converted with sharp to AVIF + WebP in
  `public/photos/` by `scripts/optimize-photos.mjs`. Credits in
  `public/photos/CREDITS.md`.

## Structure
- `src/layouts/Base.astro`: head (noindex), demo banner, header, main, closing CTA, footer, mobile call bar.
- `src/data/site.ts`: every agent placeholder in one place ([Agent Name], [Phone], tel 412-555-0142...).
- `src/components/`
  - `DemoBanner`, `Header` (nav, tel link, Book button, text-size control), `MobileCallBar`, `Footer`
  - `MedicareDisclaimer` (single source of the required 42 CFR 422.2267(e)(41) text)
  - `Hero`, `Chooser` (5 cards, answer panels), `Timeline` (IEP, 7 months), `PlainAnswers` (accordion of 8)
  - `LocalBand`, `MeetAgent`, `Reviews` (placeholders only), `TalkItThrough` (closing CTA), `ContactForm`
- `src/scripts/`: `motion.ts` (reveals, reduced-motion aware), `text-size.ts`, `banner.ts`, `form.ts`
- Pages: `/`, `/medicare`, `/medigap`, `/life`, `/annuities`, `/more-coverage`, `/about`, `/contact`, `/privacy`, `/terms`

## Accessibility and ease of use
- Root font size scales with the A / A+ / A++ control (100 / 112.5 / 125%), stored in localStorage in try/catch, applied inline in head to avoid a flash.
- Body 19px mobile / 20px desktop, line-height 1.6. `font-style: normal` everywhere.
- Tap targets 48px min, links underlined, visible 3px focus rings, skip link.
- Accordions use native `<details>` with a height transition; chooser uses buttons with `aria-expanded` / `aria-controls`.
- Reduced motion: no hero drift, no reveals, no timeline draw; content visible by default (reveals only hide content once JS confirms motion is allowed).

## Compliance
- Disclaimer in footer on every page and in a box on Medicare and Medigap pages.
- No logos, no Medicare card, carriers as a text line. Review cards are placeholders.
- Contact form never asks for Medicare number, SSN, DOB, medications or health info. Posts nowhere.
- Medicare facts checked against medicare.gov with URLs in code comments. No dollar amounts.

## Verification
- `npm run check` (banned words, em dashes, exclamation marks, italic) over `src/`.
- Playwright: screenshots at 375 and 1440, reduced motion, text-size sizes, keyboard focus.
- Lighthouse mobile scores pasted in README.
