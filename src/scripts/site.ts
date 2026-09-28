import { animate, inView, scroll, stagger } from 'motion';

const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
const EASE = [0.2, 0.7, 0.2, 1] as const;

/* ---------- Text size (A / A+ / A++) ---------- */
function initTextSize() {
  const root = document.documentElement;
  const buttons = document.querySelectorAll<HTMLButtonElement>('[data-size-btn]');
  const sync = () => {
    const current = root.dataset.size || 'md';
    buttons.forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.sizeBtn === current)));
  };
  buttons.forEach((b) =>
    b.addEventListener('click', () => {
      const size = b.dataset.sizeBtn || 'md';
      if (size === 'md') delete root.dataset.size;
      else root.dataset.size = size;
      try {
        localStorage.setItem('text-size', size);
      } catch {
        /* storage blocked: the choice still applies for this page view */
      }
      sync();
    }),
  );
  sync();
}

/* ---------- Scroll reveals ---------- */
function initReveals() {
  if (reduced.matches) return; // content stays visible, no animation
  document.documentElement.classList.add('motion-ok');

  document.querySelectorAll<HTMLElement>('[data-reveal]').forEach((el) => {
    inView(
      el,
      () => {
        el.classList.add('is-in');
        animate(el, { opacity: [0, 1], y: [16, 0] }, { duration: 0.7, ease: EASE });
      },
      { amount: 0.15 },
    );
  });

  document.querySelectorAll<HTMLElement>('[data-stagger]').forEach((group) => {
    const items = Array.from(group.children) as HTMLElement[];
    items.forEach((i) => {
      i.style.opacity = '0';
      i.style.transform = 'translateY(16px)';
    });
    inView(
      group,
      () => {
        animate(items, { opacity: [0, 1], y: [16, 0] }, { duration: 0.6, delay: stagger(0.06), ease: EASE }).then(() =>
          items.forEach((i) => {
            // hand transforms back to CSS so hover lift works
            i.style.transform = '';
          }),
        );
      },
      { amount: 0.1 },
    );
  });
}

/* ---------- Timeline draws itself on scroll ---------- */
function initTimeline() {
  const tl = document.querySelector<HTMLElement>('[data-timeline]');
  if (!tl) return;
  const fill = tl.querySelector<HTMLElement>('[data-timeline-fill]');
  const steps = Array.from(tl.querySelectorAll<HTMLElement>('[data-timeline-step]'));
  if (reduced.matches || !fill) {
    tl.classList.add('is-drawn');
    return;
  }
  tl.classList.add('will-draw');
  scroll(
    (progress: number) => {
      const p = Math.min(1, Math.max(0, progress * 1.35));
      fill.style.setProperty('--draw', String(p));
      steps.forEach((s, i) => s.classList.toggle('is-reached', p >= (i + 0.35) / steps.length));
    },
    { target: tl, offset: ['start 85%', 'end 60%'] },
  );
}

/* ---------- Accordions: smooth height on native <details> ---------- */
function initAccordions() {
  document.querySelectorAll<HTMLDetailsElement>('details.acc').forEach((d) => {
    const summary = d.querySelector('summary');
    const body = d.querySelector<HTMLElement>('.acc-body');
    if (!summary || !body) return;
    summary.addEventListener('click', (e) => {
      if (reduced.matches) return; // native instant toggle
      e.preventDefault();
      if (d.open) {
        const h = body.offsetHeight;
        animate(body, { height: [h, 0], opacity: [1, 0] }, { duration: 0.28, ease: 'easeInOut' }).then(() => {
          d.open = false;
          body.style.height = '';
          body.style.opacity = '';
        });
      } else {
        d.open = true;
        const h = body.offsetHeight;
        animate(body, { height: [0, h], opacity: [0, 1] }, { duration: 0.32, ease: 'easeOut' }).then(() => {
          body.style.height = '';
        });
      }
    });
  });
}

initTextSize();
initReveals();
initTimeline();
initAccordions();
