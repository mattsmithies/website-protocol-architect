// scroll-animations.ts — GSAP + ScrollTrigger reveal animations and parallax

import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

export function initScrollAnimations(): void {
  // ── 1. Reduced motion bail-out ──────────────────────────────────────────
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    document.querySelectorAll<HTMLElement>('.reveal').forEach((el) => {
      el.style.opacity = '1';
      el.style.transform = 'none';
    });
    return;
  }

  // Track which elements have already been assigned an animation so we
  // never double-animate a single node.
  const handled = new Set<Element>();

  // ── 2. Hero reveals (page-load, no ScrollTrigger) ──────────────────────
  const heroReveals = gsap.utils.toArray<HTMLElement>('#hero .reveal');
  heroReveals.forEach((el) => handled.add(el));

  if (heroReveals.length > 0) {
    gsap.fromTo(
      heroReveals,
      { opacity: 0, y: 40 },
      {
        opacity: 1,
        y: 0,
        duration: 1,
        ease: 'power3.out',
        stagger: 0.15,
        delay: 0.3,
      },
    );
  }

  // ── 3. Grid reveals in capabilities / principles / thinking ────────────
  const gridContainers = gsap.utils.toArray<HTMLElement>(
    '#capabilities .grid, #principles .grid, #thinking .grid',
  );

  gridContainers.forEach((grid) => {
    const reveals = gsap.utils.toArray<HTMLElement>('.reveal', grid);
    if (reveals.length === 0) return;

    reveals.forEach((el) => handled.add(el));

    gsap.fromTo(
      reveals,
      { opacity: 0, y: 32 },
      {
        opacity: 1,
        y: 0,
        duration: 0.7,
        ease: 'power3.out',
        stagger: 0.08,
        scrollTrigger: {
          trigger: grid,
          start: 'top 85%',
          once: true,
        },
      },
    );
  });

  // ── 4. All remaining .reveal elements (individual ScrollTrigger) ───────
  const allReveals = gsap.utils.toArray<HTMLElement>('.reveal');

  allReveals.forEach((el) => {
    if (handled.has(el)) return;
    handled.add(el);

    gsap.fromTo(
      el,
      { opacity: 0, y: 32 },
      {
        opacity: 1,
        y: 0,
        duration: 0.9,
        ease: 'power3.out',
        scrollTrigger: {
          trigger: el,
          start: 'top 88%',
          once: true,
        },
      },
    );
  });

  // ── 5. Subtle parallax on section headings ─────────────────────────────
  document.querySelectorAll<HTMLElement>('section:not(#hero)').forEach((section) => {
    const firstReveal = section.querySelector<HTMLElement>('.reveal');
    if (!firstReveal) return;

    gsap.to(firstReveal, {
      y: -20,
      scrollTrigger: {
        trigger: firstReveal,
        start: 'top 80%',
        end: 'bottom 20%',
        scrub: 1,
      },
    });
  });
}
