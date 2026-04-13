// scroll-animations.ts — Cinematic GSAP + ScrollTrigger reveals, parallax, and magnetic buttons

import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

export function initScrollAnimations(): void {
  // ── 1. Reduced motion bail-out ──────────────────────────────────────────
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    document
      .querySelectorAll<HTMLElement>('.reveal, .reveal-clip, .word')
      .forEach((el) => {
        el.style.opacity = '1';
        el.style.transform = 'none';
      });
    return;
  }

  // Track which elements have already been assigned an animation so we
  // never double-animate a single node.
  const handled = new Set<Element>();

  // ── 2. Hero entrance (page-load, no ScrollTrigger) ─────────────────────
  const heroReveals = gsap.utils.toArray<HTMLElement>('#hero .reveal');
  heroReveals.forEach((el) => handled.add(el));

  if (heroReveals.length > 0) {
    gsap.fromTo(
      heroReveals,
      { opacity: 0, y: 50, scale: 0.97 },
      {
        opacity: 1,
        y: 0,
        scale: 1,
        duration: 1.2,
        ease: 'power4.out',
        stagger: 0.12,
        delay: 0.5,
      },
    );
  }

  const heroGeometric = document.querySelector<HTMLElement>('.hero-geometric');
  if (heroGeometric) {
    handled.add(heroGeometric);
    gsap.fromTo(
      heroGeometric,
      { opacity: 0, scale: 0.8, rotation: -10 },
      {
        opacity: 1,
        scale: 1,
        rotation: 0,
        duration: 2,
        ease: 'power2.out',
        delay: 0.8,
      },
    );
  }

  // ── 3. Section heading reveals ─────────────────────────────────────────
  const sectionHeadings = gsap.utils.toArray<HTMLElement>(
    'section:not(#hero) > .reveal',
  );

  sectionHeadings.forEach((el) => {
    if (handled.has(el)) return;
    handled.add(el);

    gsap.fromTo(
      el,
      { opacity: 0, y: 40, scale: 0.98 },
      {
        opacity: 1,
        y: 0,
        scale: 1,
        duration: 1,
        ease: 'power4.out',
        scrollTrigger: {
          trigger: el,
          start: 'top 85%',
          once: true,
        },
      },
    );
  });

  // ── 4. Grid card reveals (capabilities, principles, thinking) ──────────
  const gridContainers = gsap.utils.toArray<HTMLElement>(
    '#capabilities .grid, #principles .grid, #thinking .grid',
  );

  gridContainers.forEach((grid) => {
    const reveals = gsap.utils.toArray<HTMLElement>('.reveal', grid);
    if (reveals.length === 0) return;

    reveals.forEach((el) => handled.add(el));

    gsap.fromTo(
      reveals,
      { opacity: 0, y: 40, scale: 0.95 },
      {
        opacity: 1,
        y: 0,
        scale: 1,
        duration: 0.8,
        ease: 'power3.out',
        stagger: 0.06,
        scrollTrigger: {
          trigger: grid,
          start: 'top 85%',
          once: true,
        },
      },
    );
  });

  // ── 5. Case study cards ────────────────────────────────────────────────
  const workContainer = document.querySelector<HTMLElement>(
    '#work .space-y-8',
  );

  if (workContainer) {
    const caseCards = gsap.utils.toArray<HTMLElement>(
      '.glass-card',
      workContainer,
    );

    if (caseCards.length > 0) {
      caseCards.forEach((el) => handled.add(el));

      gsap.fromTo(
        caseCards,
        { opacity: 0, y: 60, scale: 0.96 },
        {
          opacity: 1,
          y: 0,
          scale: 1,
          duration: 1,
          ease: 'power3.out',
          stagger: 0.15,
          scrollTrigger: {
            trigger: workContainer,
            start: 'top 85%',
            once: true,
          },
        },
      );
    }
  }

  // ── 6. All remaining .reveal elements (individual ScrollTrigger) ───────
  const allReveals = gsap.utils.toArray<HTMLElement>('.reveal');

  allReveals.forEach((el) => {
    if (handled.has(el)) return;
    handled.add(el);

    gsap.fromTo(
      el,
      { opacity: 0, y: 30 },
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

  // ── 7. Subtle parallax on section backgrounds ─────────────────────────
  document
    .querySelectorAll<HTMLElement>('section:not(#hero)')
    .forEach((section) => {
      const firstReveal = section.querySelector<HTMLElement>('.reveal');
      if (!firstReveal) return;

      gsap.to(firstReveal, {
        y: -15,
        scrollTrigger: {
          trigger: firstReveal,
          start: 'top bottom',
          end: 'bottom top',
          scrub: 1.5,
        },
      });
    });

  // ── 8. Magnetic button effect ─────────────────────────────────────────
  document.querySelectorAll<HTMLElement>('.magnetic').forEach((btn) => {
    btn.addEventListener('mousemove', (e) => {
      const rect = btn.getBoundingClientRect();
      const x = e.clientX - rect.left - rect.width / 2;
      const y = e.clientY - rect.top - rect.height / 2;
      gsap.to(btn, {
        x: x * 0.1,
        y: y * 0.1,
        duration: 0.3,
        ease: 'power2.out',
      });
    });

    btn.addEventListener('mouseleave', () => {
      gsap.to(btn, { x: 0, y: 0, duration: 0.4, ease: 'power2.out' });
    });
  });
}
