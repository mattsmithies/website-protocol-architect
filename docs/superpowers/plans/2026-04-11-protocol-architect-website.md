# Protocol Architect Personal Website - Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a premium, motion-rich personal website positioning Matt Smithies as a systems architect for trust, workflow, provenance, identity, authority, and incentive design.

**Architecture:** Single-page Astro static site with a dark aesthetic matching the DOVU ecosystem (dark #08090f background, green #22c55e accents). Interactive Canvas 2D mesh background with mouse-reactive particles. GSAP ScrollTrigger for section reveal animations. Sections: Hero, Capabilities, Philosophy, Case Studies, Principles, Writing, About, Contact.

**Tech Stack:** Astro 5.x, Tailwind CSS 4.x (@tailwindcss/vite), GSAP 3.x + ScrollTrigger, TypeScript, Canvas 2D API

---

## File Structure

```
/
├── astro.config.mjs           # Astro config with Tailwind v4 Vite plugin
├── package.json               # Dependencies and scripts
├── tsconfig.json              # TypeScript config (Astro strict)
├── public/
│   └── favicon.svg            # Simple geometric favicon
├── src/
│   ├── layouts/
│   │   └── Layout.astro       # Base HTML shell, fonts, meta, global styles
│   ├── components/
│   │   ├── Nav.astro          # Fixed nav with scroll-aware transparency
│   │   ├── Hero.astro         # Hero headline, subtext, CTAs
│   │   ├── Capabilities.astro # 6-card capability grid
│   │   ├── Philosophy.astro   # "Where software meets trust" narrative
│   │   ├── CaseStudies.astro  # Selected architecture stories
│   │   ├── Principles.astro   # Principles grid
│   │   ├── Writing.astro      # Articles/thinking section
│   │   ├── About.astro        # Concise positioning bio
│   │   ├── Contact.astro      # Collaboration types + contact CTA
│   │   └── Footer.astro       # Minimal footer
│   ├── scripts/
│   │   ├── mesh-background.ts # Canvas 2D interactive mesh (dots + lines)
│   │   ├── scroll-animations.ts # GSAP ScrollTrigger setup for all sections
│   │   └── nav.ts             # Mobile menu toggle + scroll-aware nav
│   ├── styles/
│   │   └── global.css         # Tailwind v4 import, design tokens, base styles
│   └── pages/
│       └── index.astro        # Page assembly - imports all components
```

---

## Task 1: Project Scaffolding

**Files:**
- Create: `package.json`
- Create: `astro.config.mjs`
- Create: `tsconfig.json`
- Create: `src/pages/index.astro` (placeholder)
- Create: `src/layouts/Layout.astro` (placeholder)
- Create: `src/styles/global.css`

- [ ] **Step 1: Initialize Astro project**

```bash
cd /Users/hecate/Documents/GitHub/website-protocol-architect
npm create astro@latest . -- --template minimal --no-install --typescript strict
```

If prompted about overwriting, accept. This creates the base Astro structure.

- [ ] **Step 2: Install dependencies**

```bash
npm install
npm install gsap @tailwindcss/vite
```

- [ ] **Step 3: Configure Astro with Tailwind v4 Vite plugin**

Replace `astro.config.mjs` with:

```js
import { defineConfig } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  vite: {
    plugins: [tailwindcss()],
  },
});
```

- [ ] **Step 4: Create global.css with Tailwind v4 and design tokens**

Write `src/styles/global.css`:

```css
@import "tailwindcss";

@theme {
  --color-void: #08090f;
  --color-void-light: #0a0e1a;
  --color-signal: #22c55e;
  --color-signal-dim: rgba(34, 197, 94, 0.3);
  --color-signal-faint: rgba(34, 197, 94, 0.08);
  --color-surface: rgba(8, 9, 15, 0.9);
  --color-border: rgba(255, 255, 255, 0.06);
  --color-border-hover: rgba(255, 255, 255, 0.12);
  --color-text-primary: rgba(255, 255, 255, 0.92);
  --color-text-secondary: rgba(255, 255, 255, 0.55);
  --color-text-tertiary: rgba(255, 255, 255, 0.32);

  --font-family-sans: 'Montserrat', system-ui, sans-serif;
  --font-family-mono: 'SF Mono', 'Fira Code', monospace;
}

html {
  scroll-behavior: smooth;
}

body {
  background-color: var(--color-void);
  color: var(--color-text-primary);
  font-family: var(--font-family-sans);
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  overflow-x: hidden;
}

::selection {
  background-color: rgba(34, 197, 94, 0.25);
  color: white;
}

/* Gradient text utility */
.text-gradient {
  background: linear-gradient(180deg, #fff, rgba(255, 255, 255, 0.55));
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

/* Glass card utility */
.glass-card {
  background: var(--color-surface);
  backdrop-filter: blur(16px);
  -webkit-backdrop-filter: blur(16px);
  border: 1px solid var(--color-border);
  border-radius: 12px;
}

.glass-card:hover {
  border-color: var(--color-border-hover);
}

/* Glow effect for primary buttons */
.glow-button {
  background-color: var(--color-signal);
  color: var(--color-void);
  font-weight: 600;
  box-shadow: 0 0 20px rgba(34, 197, 94, 0.3), 0 0 60px rgba(34, 197, 94, 0.1);
  transition: box-shadow 0.3s ease, transform 0.3s ease;
}

.glow-button:hover {
  box-shadow: 0 0 30px rgba(34, 197, 94, 0.5), 0 0 80px rgba(34, 197, 94, 0.15);
  transform: translateY(-1px);
}

/* Ghost button */
.ghost-button {
  border: 1px solid rgba(255, 255, 255, 0.1);
  color: var(--color-text-secondary);
  transition: border-color 0.3s ease, color 0.3s ease;
}

.ghost-button:hover {
  border-color: rgba(255, 255, 255, 0.25);
  color: var(--color-text-primary);
}

/* Section spacing */
.section-padding {
  padding: 8rem 1.5rem;
}

@media (min-width: 768px) {
  .section-padding {
    padding: 10rem 2rem;
  }
}

/* Reveal animation base state */
.reveal {
  opacity: 0;
  transform: translateY(24px);
}

.reveal.active {
  opacity: 1;
  transform: translateY(0);
  transition: opacity 0.8s cubic-bezier(0.16, 1, 0.3, 1),
              transform 0.8s cubic-bezier(0.16, 1, 0.3, 1);
}
```

- [ ] **Step 5: Create base Layout.astro**

Write `src/layouts/Layout.astro`:

```astro
---
interface Props {
  title?: string;
  description?: string;
}

const {
  title = "Matt Smithies — Systems Architect",
  description = "Systems architect for trust, workflow, provenance, identity, authority, and incentive design. Designing verifiable systems where process, evidence, and incentives hold under real world pressure."
} = Astro.props;
---

<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <meta name="description" content={description} />
    <meta name="author" content="Matt Smithies" />

    <meta property="og:title" content={title} />
    <meta property="og:description" content={description} />
    <meta property="og:type" content="website" />

    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:title" content={title} />
    <meta name="twitter:description" content={description} />

    <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
    <link rel="preconnect" href="https://fonts.googleapis.com" />
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
    <link
      href="https://fonts.googleapis.com/css2?family=Montserrat:wght@400;500;600;700;800;900&display=swap"
      rel="stylesheet"
    />

    <title>{title}</title>
  </head>
  <body class="min-h-screen">
    <canvas id="mesh-bg" class="fixed inset-0 z-0 pointer-events-none"></canvas>
    <div class="relative z-10">
      <slot />
    </div>
  </body>
</html>
```

- [ ] **Step 6: Create placeholder index.astro**

Write `src/pages/index.astro`:

```astro
---
import Layout from '../layouts/Layout.astro';
import '../styles/global.css';
---

<Layout>
  <main>
    <section class="min-h-screen flex items-center justify-center">
      <h1 class="text-4xl font-bold text-gradient tracking-tight">
        Systems Architect
      </h1>
    </section>
  </main>
</Layout>
```

- [ ] **Step 7: Create favicon**

Write `public/favicon.svg`:

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32">
  <rect width="32" height="32" rx="4" fill="#08090f"/>
  <path d="M8 16 L16 8 L24 16 L16 24 Z" fill="none" stroke="#22c55e" stroke-width="1.5"/>
  <circle cx="16" cy="16" r="2" fill="#22c55e"/>
  <circle cx="16" cy="8" r="1.5" fill="#22c55e" opacity="0.6"/>
  <circle cx="24" cy="16" r="1.5" fill="#22c55e" opacity="0.6"/>
  <circle cx="16" cy="24" r="1.5" fill="#22c55e" opacity="0.6"/>
  <circle cx="8" cy="16" r="1.5" fill="#22c55e" opacity="0.6"/>
</svg>
```

- [ ] **Step 8: Verify build**

```bash
npm run dev
```

Expected: Dev server starts on localhost:4321, page shows "Systems Architect" heading with dark background, green selection color, Montserrat font loaded.

- [ ] **Step 9: Commit**

```bash
git add -A
git commit -m "feat: scaffold Astro project with Tailwind v4, design tokens, and base layout"
```

---

## Task 2: Interactive Mesh Background

**Files:**
- Create: `src/scripts/mesh-background.ts`
- Modify: `src/layouts/Layout.astro` (add script import)

- [ ] **Step 1: Create mesh background script**

Write `src/scripts/mesh-background.ts`:

```ts
interface Dot {
  baseX: number;
  baseY: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
}

export function initMeshBackground(canvas: HTMLCanvasElement) {
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  let dots: Dot[] = [];
  let mouseX = -1000;
  let mouseY = -1000;
  let animationId: number;

  const SPACING = window.innerWidth < 768 ? 72 : 52;
  const CONNECTION_DIST = window.innerWidth < 768 ? 90 : 74;
  const MOUSE_RADIUS = 150;
  const SPRING = 0.04;
  const DAMPING = 0.85;
  const DOT_RADIUS = 1;
  const BASE_ALPHA = 0.15;
  const HOVER_ALPHA = 0.5;
  const LINE_ALPHA = 0.06;
  const LINE_HOVER_ALPHA = 0.18;

  function resize() {
    const dpr = window.devicePixelRatio || 1;
    canvas.width = window.innerWidth * dpr;
    canvas.height = window.innerHeight * dpr;
    canvas.style.width = window.innerWidth + 'px';
    canvas.style.height = window.innerHeight + 'px';
    ctx!.setTransform(dpr, 0, 0, dpr, 0, 0);
    createDots();
  }

  function createDots() {
    dots = [];
    const cols = Math.ceil(window.innerWidth / SPACING) + 2;
    const rows = Math.ceil(window.innerHeight / SPACING) + 2;

    for (let row = 0; row < rows; row++) {
      const offset = row % 2 === 0 ? 0 : SPACING / 2;
      for (let col = 0; col < cols; col++) {
        const x = col * SPACING + offset;
        const y = row * SPACING * 0.866;
        dots.push({ baseX: x, baseY: y, x, y, vx: 0, vy: 0 });
      }
    }
  }

  function animate() {
    ctx!.clearRect(0, 0, window.innerWidth, window.innerHeight);

    for (const dot of dots) {
      const dx = mouseX - dot.x;
      const dy = mouseY - dot.y;
      const dist = Math.sqrt(dx * dx + dy * dy);

      if (dist < MOUSE_RADIUS && dist > 0) {
        const force = (MOUSE_RADIUS - dist) / MOUSE_RADIUS;
        dot.vx -= (dx / dist) * force * 2;
        dot.vy -= (dy / dist) * force * 2;
      }

      dot.vx += (dot.baseX - dot.x) * SPRING;
      dot.vy += (dot.baseY - dot.y) * SPRING;
      dot.vx *= DAMPING;
      dot.vy *= DAMPING;
      dot.x += dot.vx;
      dot.y += dot.vy;
    }

    // Draw connections
    for (let i = 0; i < dots.length; i++) {
      for (let j = i + 1; j < dots.length; j++) {
        const dx = dots[i].x - dots[j].x;
        const dy = dots[i].y - dots[j].y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist < CONNECTION_DIST) {
          const midX = (dots[i].x + dots[j].x) / 2;
          const midY = (dots[i].y + dots[j].y) / 2;
          const mouseDist = Math.sqrt(
            (mouseX - midX) ** 2 + (mouseY - midY) ** 2
          );
          const proximity = Math.max(0, 1 - mouseDist / (MOUSE_RADIUS * 2));
          const alpha = LINE_ALPHA + (LINE_HOVER_ALPHA - LINE_ALPHA) * proximity;
          const fade = 1 - dist / CONNECTION_DIST;

          ctx!.beginPath();
          ctx!.moveTo(dots[i].x, dots[i].y);
          ctx!.lineTo(dots[j].x, dots[j].y);
          ctx!.strokeStyle = `rgba(34, 197, 94, ${alpha * fade})`;
          ctx!.lineWidth = 0.5;
          ctx!.stroke();
        }
      }
    }

    // Draw dots
    for (const dot of dots) {
      const dx = mouseX - dot.x;
      const dy = mouseY - dot.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      const proximity = Math.max(0, 1 - dist / (MOUSE_RADIUS * 1.5));
      const alpha = BASE_ALPHA + (HOVER_ALPHA - BASE_ALPHA) * proximity;
      const radius = DOT_RADIUS + proximity * 0.8;

      ctx!.beginPath();
      ctx!.arc(dot.x, dot.y, radius, 0, Math.PI * 2);
      ctx!.fillStyle = `rgba(34, 197, 94, ${alpha})`;
      ctx!.fill();
    }

    animationId = requestAnimationFrame(animate);
  }

  // Event listeners
  window.addEventListener('mousemove', (e) => {
    mouseX = e.clientX;
    mouseY = e.clientY;
  });

  window.addEventListener('mouseleave', () => {
    mouseX = -1000;
    mouseY = -1000;
  });

  window.addEventListener('resize', () => {
    cancelAnimationFrame(animationId);
    resize();
    animate();
  });

  // Reduced motion support
  const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)');
  if (prefersReduced.matches) {
    resize();
    // Draw static mesh once
    for (const dot of dots) {
      ctx!.beginPath();
      ctx!.arc(dot.x, dot.y, DOT_RADIUS, 0, Math.PI * 2);
      ctx!.fillStyle = `rgba(34, 197, 94, ${BASE_ALPHA})`;
      ctx!.fill();
    }
    return;
  }

  resize();
  animate();
}
```

- [ ] **Step 2: Add script to Layout.astro**

In `src/layouts/Layout.astro`, add before the closing `</body>` tag:

```astro
    <script>
      import { initMeshBackground } from '../scripts/mesh-background';

      const canvas = document.getElementById('mesh-bg') as HTMLCanvasElement;
      if (canvas) {
        initMeshBackground(canvas);
      }
    </script>
  </body>
```

- [ ] **Step 3: Verify**

```bash
npm run dev
```

Expected: Dark background with a subtle grid of green dots connected by faint lines. Moving the mouse causes nearby dots to repel and spring back. Lines brighten near the cursor.

- [ ] **Step 4: Commit**

```bash
git add src/scripts/mesh-background.ts src/layouts/Layout.astro
git commit -m "feat: add interactive canvas mesh background with mouse-reactive particles"
```

---

## Task 3: Navigation

**Files:**
- Create: `src/components/Nav.astro`
- Create: `src/scripts/nav.ts`
- Modify: `src/pages/index.astro` (add Nav import)

- [ ] **Step 1: Create Nav component**

Write `src/components/Nav.astro`:

```astro
---
const links = [
  { label: 'Capabilities', href: '#capabilities' },
  { label: 'Work', href: '#work' },
  { label: 'Thinking', href: '#thinking' },
  { label: 'About', href: '#about' },
];
---

<nav
  id="main-nav"
  class="fixed top-0 left-0 right-0 z-50 transition-all duration-500"
>
  <div class="max-w-6xl mx-auto px-6 py-5 flex items-center justify-between">
    <a
      href="#"
      class="text-sm font-semibold tracking-widest uppercase text-text-secondary hover:text-text-primary transition-colors"
    >
      Matt Smithies
    </a>

    {/* Desktop links */}
    <div class="hidden md:flex items-center gap-8">
      {links.map((link) => (
        <a
          href={link.href}
          class="text-sm text-text-tertiary hover:text-text-primary transition-colors duration-300"
        >
          {link.label}
        </a>
      ))}
      <a
        href="#contact"
        class="ghost-button text-sm px-5 py-2 rounded-full"
      >
        Get in touch
      </a>
    </div>

    {/* Mobile toggle */}
    <button
      id="mobile-menu-toggle"
      class="md:hidden flex flex-col gap-1.5 p-2"
      aria-label="Toggle menu"
    >
      <span class="block w-5 h-px bg-text-secondary transition-all duration-300 origin-center" id="bar1"></span>
      <span class="block w-5 h-px bg-text-secondary transition-all duration-300" id="bar2"></span>
      <span class="block w-5 h-px bg-text-secondary transition-all duration-300 origin-center" id="bar3"></span>
    </button>
  </div>

  {/* Mobile menu */}
  <div
    id="mobile-menu"
    class="md:hidden overflow-hidden transition-all duration-500 max-h-0 opacity-0"
  >
    <div class="px-6 pb-6 flex flex-col gap-4 border-t border-border">
      {links.map((link) => (
        <a
          href={link.href}
          class="mobile-link text-text-tertiary hover:text-text-primary transition-colors py-2 text-lg"
        >
          {link.label}
        </a>
      ))}
      <a
        href="#contact"
        class="mobile-link ghost-button text-center px-5 py-3 rounded-full mt-2"
      >
        Get in touch
      </a>
    </div>
  </div>
</nav>
```

- [ ] **Step 2: Create nav script**

Write `src/scripts/nav.ts`:

```ts
export function initNav() {
  const nav = document.getElementById('main-nav');
  const toggle = document.getElementById('mobile-menu-toggle');
  const menu = document.getElementById('mobile-menu');
  const bar1 = document.getElementById('bar1');
  const bar2 = document.getElementById('bar2');
  const bar3 = document.getElementById('bar3');

  if (!nav || !toggle || !menu) return;

  let isOpen = false;

  // Scroll-aware background
  function updateNav() {
    if (window.scrollY > 80) {
      nav!.style.backgroundColor = 'rgba(8, 9, 15, 0.85)';
      nav!.style.backdropFilter = 'blur(16px)';
      nav!.style.borderBottom = '1px solid rgba(255, 255, 255, 0.06)';
    } else {
      nav!.style.backgroundColor = 'transparent';
      nav!.style.backdropFilter = 'none';
      nav!.style.borderBottom = '1px solid transparent';
    }
  }

  window.addEventListener('scroll', updateNav, { passive: true });
  updateNav();

  // Mobile toggle
  toggle.addEventListener('click', () => {
    isOpen = !isOpen;

    if (isOpen) {
      menu.style.maxHeight = menu.scrollHeight + 'px';
      menu.style.opacity = '1';
      bar1!.style.transform = 'rotate(45deg) translateY(3.5px)';
      bar2!.style.opacity = '0';
      bar3!.style.transform = 'rotate(-45deg) translateY(-3.5px)';
    } else {
      menu.style.maxHeight = '0';
      menu.style.opacity = '0';
      bar1!.style.transform = '';
      bar2!.style.opacity = '1';
      bar3!.style.transform = '';
    }
  });

  // Close menu on link click
  menu.querySelectorAll('a').forEach((link) => {
    link.addEventListener('click', () => {
      isOpen = false;
      menu.style.maxHeight = '0';
      menu.style.opacity = '0';
      bar1!.style.transform = '';
      bar2!.style.opacity = '1';
      bar3!.style.transform = '';
    });
  });
}
```

- [ ] **Step 3: Add Nav to index.astro**

Update `src/pages/index.astro`:

```astro
---
import Layout from '../layouts/Layout.astro';
import Nav from '../components/Nav.astro';
import '../styles/global.css';
---

<Layout>
  <Nav />
  <main>
    <section class="min-h-screen flex items-center justify-center">
      <h1 class="text-4xl font-bold text-gradient tracking-tight">
        Systems Architect
      </h1>
    </section>
  </main>
</Layout>

<script>
  import { initNav } from '../scripts/nav';
  initNav();
</script>
```

- [ ] **Step 4: Verify**

```bash
npm run dev
```

Expected: Fixed nav at top, transparent initially, gains glass background on scroll. Mobile hamburger toggles menu with animated bars. Links scroll smoothly.

- [ ] **Step 5: Commit**

```bash
git add src/components/Nav.astro src/scripts/nav.ts src/pages/index.astro
git commit -m "feat: add scroll-aware navigation with mobile menu"
```

---

## Task 4: Hero Section

**Files:**
- Create: `src/components/Hero.astro`
- Modify: `src/pages/index.astro` (replace placeholder)

- [ ] **Step 1: Create Hero component**

Write `src/components/Hero.astro`:

```astro
---

---

<section id="hero" class="relative min-h-screen flex items-center justify-center px-6">
  <div class="max-w-4xl mx-auto text-center">
    {/* Eyebrow */}
    <p class="reveal text-signal text-xs font-semibold tracking-[0.3em] uppercase mb-8">
      Systems Architecture &middot; Trust Infrastructure &middot; Protocol Design
    </p>

    {/* Main headline */}
    <h1 class="reveal text-gradient text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold tracking-tight leading-[1.08] mb-8">
      I design systems where trust<br class="hidden sm:block" /> cannot be left vague
    </h1>

    {/* Supporting paragraph */}
    <p class="reveal text-text-secondary text-lg md:text-xl leading-relaxed max-w-2xl mx-auto mb-12">
      Systems architect for trust, workflow, provenance, identity, authority, and incentive design. I work at the intersection of protocol architecture, verifiable process, and mechanism design &mdash; where evidence, roles, and economic logic need to hold under real world pressure.
    </p>

    {/* CTAs */}
    <div class="reveal flex flex-col sm:flex-row gap-4 justify-center items-center">
      <a href="#capabilities" class="glow-button px-8 py-3.5 rounded-full text-sm tracking-wide">
        Explore capabilities
      </a>
      <a href="#work" class="ghost-button px-8 py-3.5 rounded-full text-sm">
        View selected work
      </a>
    </div>
  </div>

  {/* Scroll indicator */}
  <div class="absolute bottom-10 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 opacity-40">
    <span class="text-[10px] tracking-[0.2em] uppercase text-text-tertiary">Scroll</span>
    <div class="w-px h-8 bg-gradient-to-b from-signal/40 to-transparent animate-pulse"></div>
  </div>
</section>
```

- [ ] **Step 2: Update index.astro with Hero**

Update `src/pages/index.astro`:

```astro
---
import Layout from '../layouts/Layout.astro';
import Nav from '../components/Nav.astro';
import Hero from '../components/Hero.astro';
import '../styles/global.css';
---

<Layout>
  <Nav />
  <main>
    <Hero />
    {/* Spacer for scroll testing */}
    <div class="h-screen"></div>
  </main>
</Layout>

<script>
  import { initNav } from '../scripts/nav';
  initNav();
</script>
```

- [ ] **Step 3: Verify**

```bash
npm run dev
```

Expected: Full-viewport hero with green eyebrow text, large gradient headline "I design systems where trust cannot be left vague", secondary text, two buttons (green glow + ghost), and a subtle scroll indicator at bottom. All sitting over the mesh background.

- [ ] **Step 4: Commit**

```bash
git add src/components/Hero.astro src/pages/index.astro
git commit -m "feat: add hero section with headline, positioning copy, and CTAs"
```

---

## Task 5: Capabilities Section

**Files:**
- Create: `src/components/Capabilities.astro`
- Modify: `src/pages/index.astro` (add import)

- [ ] **Step 1: Create Capabilities component**

Write `src/components/Capabilities.astro`:

```astro
---
const capabilities = [
  {
    title: 'Systems Architecture',
    description: 'Designing foundational models, primitives, and system boundaries for complex products and infrastructure.',
    icon: 'M4 4h7v7H4zM13 4h7v7h-7zM4 13h7v7H4zM13 13h7v7h-7z',
  },
  {
    title: 'Verifiable Workflows',
    description: 'Building systems where steps, roles, decisions, and evidence can be explicitly modelled, enforced, and replayed.',
    icon: 'M3 12h4l3-9 4 18 3-9h4',
  },
  {
    title: 'Identity & Authority',
    description: 'Designing who can do what, when, under what rules, with what proof, and how that changes over time.',
    icon: 'M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5',
  },
  {
    title: 'Provenance & Auditability',
    description: 'Creating systems that preserve the chain of events, evidence, origin, and accountability across actors and time.',
    icon: 'M9 5H2v14h20V5h-7M9 5a3 3 0 106 0M9 5h6',
  },
  {
    title: 'Mechanism Design',
    description: 'Designing how actors participate, what behaviour is rewarded, where friction should exist, and how incentives shape system health.',
    icon: 'M12 8c-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4-1.79-4-4-4zm0-6C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2z',
  },
  {
    title: 'Protocol & Platform Strategy',
    description: 'Designing reusable underlying systems and economic structures, not one-off applications. Architecture that compounds.',
    icon: 'M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z',
  },
];
---

<section id="capabilities" class="section-padding">
  <div class="max-w-6xl mx-auto">
    {/* Section header */}
    <div class="reveal mb-16 md:mb-20">
      <p class="text-signal text-xs font-semibold tracking-[0.3em] uppercase mb-4">
        Core Capabilities
      </p>
      <h2 class="text-gradient text-3xl md:text-4xl lg:text-5xl font-bold tracking-tight mb-6">
        Where software meets trust
      </h2>
      <p class="text-text-secondary text-lg max-w-2xl leading-relaxed">
        The hardest systems are not just technical. They involve roles, evidence, time, permissions, incentives, and coordination under pressure. I work on the layer beneath products, where those rules become real.
      </p>
    </div>

    {/* Capability grid */}
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
      {capabilities.map((cap, i) => (
        <div
          class="reveal glass-card p-7 md:p-8 group hover:border-signal/20 transition-all duration-500"
          style={`transition-delay: ${i * 80}ms`}
        >
          {/* Icon */}
          <div class="w-10 h-10 rounded-lg bg-signal-faint flex items-center justify-center mb-5 group-hover:bg-signal/15 transition-colors duration-500">
            <svg
              class="w-5 h-5 text-signal"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="1.5"
              stroke-linecap="round"
              stroke-linejoin="round"
            >
              <path d={cap.icon} />
            </svg>
          </div>

          <h3 class="text-text-primary font-semibold text-lg mb-3 tracking-tight">
            {cap.title}
          </h3>
          <p class="text-text-tertiary text-sm leading-relaxed">
            {cap.description}
          </p>
        </div>
      ))}
    </div>
  </div>
</section>
```

- [ ] **Step 2: Add Capabilities to index.astro**

In `src/pages/index.astro`, add the import and component after Hero:

```astro
---
import Layout from '../layouts/Layout.astro';
import Nav from '../components/Nav.astro';
import Hero from '../components/Hero.astro';
import Capabilities from '../components/Capabilities.astro';
import '../styles/global.css';
---

<Layout>
  <Nav />
  <main>
    <Hero />
    <Capabilities />
    <div class="h-screen"></div>
  </main>
</Layout>

<script>
  import { initNav } from '../scripts/nav';
  initNav();
</script>
```

- [ ] **Step 3: Verify**

```bash
npm run dev
```

Expected: Below the hero, a section with green "Core Capabilities" eyebrow, large gradient heading, and 6 glass cards in a 3-column grid. Cards have green icon boxes, white titles, and dim descriptions. Borders brighten with green tint on hover.

- [ ] **Step 4: Commit**

```bash
git add src/components/Capabilities.astro src/pages/index.astro
git commit -m "feat: add capabilities section with glass cards and icon grid"
```

---

## Task 6: Philosophy Section

**Files:**
- Create: `src/components/Philosophy.astro`
- Modify: `src/pages/index.astro` (add import)

- [ ] **Step 1: Create Philosophy component**

Write `src/components/Philosophy.astro`:

```astro
---
const layers = [
  'Who has authority',
  'How decisions are recorded',
  'How evidence is preserved',
  'How workflows evolve',
  'What can be replayed',
  'How incentives shape behaviour',
];
---

<section id="philosophy" class="section-padding">
  <div class="max-w-6xl mx-auto">
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-16 lg:gap-24 items-center">
      {/* Left: statement */}
      <div class="reveal">
        <p class="text-signal text-xs font-semibold tracking-[0.3em] uppercase mb-4">
          Operating Model
        </p>
        <h2 class="text-gradient text-3xl md:text-4xl font-bold tracking-tight mb-8 leading-tight">
          I work on the parts of systems that most teams leave implicit
        </h2>
        <p class="text-text-secondary text-lg leading-relaxed mb-6">
          Most products are built on assumptions that never get made explicit. The authority model is informal. The audit trail is an afterthought. The incentive structure is accidental. The workflow is hardcoded and brittle.
        </p>
        <p class="text-text-secondary text-lg leading-relaxed">
          I work at the layer where these things need to be designed with the same rigour as the code itself &mdash; because when they fail, the whole system fails.
        </p>
      </div>

      {/* Right: structured list */}
      <div class="reveal">
        <div class="space-y-0">
          {layers.map((layer, i) => (
            <div class="group flex items-center gap-5 py-5 border-b border-border hover:border-signal/20 transition-colors duration-500">
              <span class="text-signal/40 text-xs font-mono tabular-nums group-hover:text-signal/80 transition-colors">
                {String(i + 1).padStart(2, '0')}
              </span>
              <span class="text-text-secondary text-lg group-hover:text-text-primary transition-colors duration-300">
                {layer}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  </div>
</section>
```

- [ ] **Step 2: Add to index.astro**

Add import and component after Capabilities:

```astro
import Philosophy from '../components/Philosophy.astro';
```

```astro
<Capabilities />
<Philosophy />
```

- [ ] **Step 3: Verify**

```bash
npm run dev
```

Expected: Two-column layout. Left: heading and supporting paragraphs. Right: numbered list of 6 items with subtle borders that turn green on hover. Clean, editorial feel.

- [ ] **Step 4: Commit**

```bash
git add src/components/Philosophy.astro src/pages/index.astro
git commit -m "feat: add philosophy section with structured systems layer list"
```

---

## Task 7: Case Studies Section

**Files:**
- Create: `src/components/CaseStudies.astro`
- Modify: `src/pages/index.astro` (add import)

- [ ] **Step 1: Create CaseStudies component**

Write `src/components/CaseStudies.astro`:

```astro
---
const studies = [
  {
    label: 'Trust Infrastructure',
    title: 'DOVU OS — Evidence for Execution',
    problem: 'Organisations running complex programs need auditable proof that workflows were followed, roles were respected, and evidence was captured — not just claims that work was done.',
    primitive: 'A system-of-record architecture where every action, role assignment, and evidence artifact is captured as an immutable, replayable trail — turning implicit process into verifiable execution.',
    approach: 'Designed the core architecture for a workflow audit platform serving carbon programs, supply chains, and regulated processes. Role-based authority, time-bound permissions, evidence binding, and replayable state transitions.',
    outcome: 'Powers programs managing over $1B in value. Used by Veterans Carbon Holdings, Ketrawe Foundation, and enterprise clients across carbon, ESG, and supply chain verticals.',
    tags: ['Workflow Architecture', 'Audit Trail', 'Role-Based Authority', 'Evidence Binding'],
  },
  {
    label: 'Protocol Design',
    title: 'Authority Trail — Provable Authority for Carbon Markets',
    problem: 'Carbon credit authorisation lacks independent verifiability. Buyers, registries, and auditors cannot independently check whether credits were issued under legitimate authority.',
    primitive: 'An authority chain protocol that makes credit authorisation independently checkable — separating the system of record from the verification layer.',
    approach: 'Designed a protocol-level system for provable authority in carbon markets. Verifiable credential chains, on-chain attestation anchoring, and a developer-facing verification API.',
    outcome: 'Live protocol for independently verifiable carbon credit authority. Bridges the trust gap between issuance, registry, and market participants.',
    tags: ['Protocol Architecture', 'Verifiable Credentials', 'Market Infrastructure', 'Provenance'],
  },
  {
    label: 'Identity & Incentives',
    title: 'Token & Incentive Architecture — DOVU Ecosystem',
    problem: 'Building a sustainable token economy for a data and carbon marketplace requires careful mechanism design — not just issuing a token, but designing why and how it creates real coordination.',
    primitive: 'An incentive architecture where token mechanics align participant behaviour with ecosystem health — staking, reputation, access rights, and value flow as system primitives.',
    approach: 'Designed the token economics and participation mechanics for a multi-sided marketplace. Staking models, reputation scoring, access tiers, and governance structures.',
    outcome: 'Functioning token ecosystem with aligned incentives across data providers, validators, and market participants.',
    tags: ['Mechanism Design', 'Token Economics', 'Incentive Architecture', 'Governance'],
  },
];
---

<section id="work" class="section-padding">
  <div class="max-w-6xl mx-auto">
    {/* Section header */}
    <div class="reveal mb-16 md:mb-20">
      <p class="text-signal text-xs font-semibold tracking-[0.3em] uppercase mb-4">
        Selected Work
      </p>
      <h2 class="text-gradient text-3xl md:text-4xl lg:text-5xl font-bold tracking-tight mb-6">
        Architecture in practice
      </h2>
      <p class="text-text-secondary text-lg max-w-2xl leading-relaxed">
        Systems where trust, workflow, authority, and incentives needed to be designed explicitly. Each case required identifying a missing primitive and building the structure around it.
      </p>
    </div>

    {/* Case study cards */}
    <div class="space-y-8">
      {studies.map((study, i) => (
        <div
          class="reveal glass-card p-8 md:p-10 lg:p-12 hover:border-signal/15 transition-all duration-500"
        >
          {/* Label */}
          <div class="flex items-center gap-3 mb-6">
            <span class="w-2 h-2 rounded-full bg-signal"></span>
            <span class="text-signal text-xs font-semibold tracking-[0.2em] uppercase">
              {study.label}
            </span>
          </div>

          {/* Title */}
          <h3 class="text-text-primary text-2xl md:text-3xl font-bold tracking-tight mb-8">
            {study.title}
          </h3>

          {/* Details grid */}
          <div class="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
            <div>
              <h4 class="text-text-tertiary text-xs font-semibold tracking-[0.2em] uppercase mb-3">
                Problem
              </h4>
              <p class="text-text-secondary text-sm leading-relaxed">
                {study.problem}
              </p>
            </div>
            <div>
              <h4 class="text-text-tertiary text-xs font-semibold tracking-[0.2em] uppercase mb-3">
                Missing Primitive
              </h4>
              <p class="text-text-secondary text-sm leading-relaxed">
                {study.primitive}
              </p>
            </div>
            <div>
              <h4 class="text-text-tertiary text-xs font-semibold tracking-[0.2em] uppercase mb-3">
                System Approach
              </h4>
              <p class="text-text-secondary text-sm leading-relaxed">
                {study.approach}
              </p>
            </div>
            <div>
              <h4 class="text-text-tertiary text-xs font-semibold tracking-[0.2em] uppercase mb-3">
                Outcome
              </h4>
              <p class="text-text-secondary text-sm leading-relaxed">
                {study.outcome}
              </p>
            </div>
          </div>

          {/* Tags */}
          <div class="flex flex-wrap gap-2">
            {study.tags.map((tag) => (
              <span class="text-xs text-text-tertiary px-3 py-1.5 rounded-full border border-border">
                {tag}
              </span>
            ))}
          </div>
        </div>
      ))}
    </div>
  </div>
</section>
```

- [ ] **Step 2: Add to index.astro**

Add import and component after Philosophy:

```astro
import CaseStudies from '../components/CaseStudies.astro';
```

```astro
<Philosophy />
<CaseStudies />
```

- [ ] **Step 3: Verify**

```bash
npm run dev
```

Expected: Three large glass cards stacked vertically. Each has a green dot + label, large title, 2x2 grid of problem/primitive/approach/outcome, and tag pills at bottom. Cards have subtle green border on hover.

- [ ] **Step 4: Commit**

```bash
git add src/components/CaseStudies.astro src/pages/index.astro
git commit -m "feat: add case studies section with architecture stories"
```

---

## Task 8: Principles Section

**Files:**
- Create: `src/components/Principles.astro`
- Modify: `src/pages/index.astro` (add import)

- [ ] **Step 1: Create Principles component**

Write `src/components/Principles.astro`:

```astro
---
const principles = [
  {
    title: 'Model truth, not screens',
    description: 'Design the underlying truth model first. Interfaces are views onto structure, not the structure itself.',
  },
  {
    title: 'Make authority explicit',
    description: 'If a system has roles, permissions, or decisions, those should be first-class objects — not buried in application logic.',
  },
  {
    title: 'Make time first class',
    description: 'Most system failures involve time: expiration, ordering, validity windows, temporal authority. Treat time as a primitive.',
  },
  {
    title: 'Separate record from view',
    description: 'The system of record and derived views serve different purposes. Conflating them creates brittleness and audit gaps.',
  },
  {
    title: 'Design for replayability',
    description: 'If you cannot replay how a state was reached, you cannot audit, debug, or trust it. Events are evidence.',
  },
  {
    title: 'Align incentives with behaviour',
    description: 'A system that rewards the wrong behaviour will produce the wrong outcomes regardless of how well it is built.',
  },
  {
    title: 'Prefer clear primitives',
    description: 'Complexity should be composed from simple, well-defined pieces. Fragile abstraction is worse than deliberate repetition.',
  },
  {
    title: 'Build for consequence',
    description: 'Architecture decisions compound. Optimise for the decisions that are hardest to reverse and most consequential to get wrong.',
  },
];
---

<section id="principles" class="section-padding">
  <div class="max-w-6xl mx-auto">
    {/* Section header */}
    <div class="reveal mb-16 md:mb-20 text-center">
      <p class="text-signal text-xs font-semibold tracking-[0.3em] uppercase mb-4">
        Principles
      </p>
      <h2 class="text-gradient text-3xl md:text-4xl font-bold tracking-tight mb-6">
        How I think about systems
      </h2>
    </div>

    {/* Principles grid */}
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
      {principles.map((p, i) => (
        <div
          class="reveal group py-6 px-1 border-t border-border hover:border-signal/30 transition-colors duration-500"
          style={`transition-delay: ${i * 60}ms`}
        >
          <h3 class="text-text-primary text-sm font-semibold mb-3 group-hover:text-signal transition-colors duration-300">
            {p.title}
          </h3>
          <p class="text-text-tertiary text-sm leading-relaxed">
            {p.description}
          </p>
        </div>
      ))}
    </div>
  </div>
</section>
```

- [ ] **Step 2: Add to index.astro**

Add import and component after CaseStudies:

```astro
import Principles from '../components/Principles.astro';
```

```astro
<CaseStudies />
<Principles />
```

- [ ] **Step 3: Verify**

```bash
npm run dev
```

Expected: Centered heading, then a 4-column grid of 8 principles. Each has a top border that turns green on hover, bold title that turns green on hover, and dim description. Clean, editorial grid.

- [ ] **Step 4: Commit**

```bash
git add src/components/Principles.astro src/pages/index.astro
git commit -m "feat: add principles section with design philosophy grid"
```

---

## Task 9: Writing / Thinking Section

**Files:**
- Create: `src/components/Writing.astro`
- Modify: `src/pages/index.astro` (add import)

- [ ] **Step 1: Create Writing component**

Write `src/components/Writing.astro`:

```astro
---
const articles = [
  {
    title: 'Authority as a time-bound system',
    description: 'Why most permission models fail: they treat authority as static when it is inherently temporal. Expiration, delegation, and revocation should be system primitives.',
    category: 'Authority',
  },
  {
    title: 'Why auditability is a systems problem',
    description: 'Audit is not logging. It requires intentional architecture: event sourcing, immutable records, separation of record and view, and designed-in replayability.',
    category: 'Auditability',
  },
  {
    title: 'Where workflow systems fail',
    description: 'Most workflow engines model the happy path. Real systems need to model exceptions, partial completion, authority changes, and evidence requirements at every step.',
    category: 'Workflow',
  },
  {
    title: 'Trust as explicit structure, not brand',
    description: 'Trust in digital systems cannot rely on reputation or brand. It requires verifiable evidence, cryptographic proof, and designed-in accountability structures.',
    category: 'Trust',
  },
  {
    title: 'Why incentives distort architecture',
    description: 'When economic incentives are bolted on after the fact, they create misalignment that degrades system integrity. Mechanism design must be foundational.',
    category: 'Incentives',
  },
  {
    title: 'Designing for replayability',
    description: 'If you cannot reconstruct how a system reached its current state, you cannot trust it. Replayability is not a feature — it is an architectural property.',
    category: 'Architecture',
  },
];
---

<section id="thinking" class="section-padding">
  <div class="max-w-6xl mx-auto">
    {/* Section header */}
    <div class="reveal mb-16 md:mb-20">
      <p class="text-signal text-xs font-semibold tracking-[0.3em] uppercase mb-4">
        Thinking
      </p>
      <h2 class="text-gradient text-3xl md:text-4xl lg:text-5xl font-bold tracking-tight mb-6">
        Systems thinking in practice
      </h2>
      <p class="text-text-secondary text-lg max-w-2xl leading-relaxed">
        Notes on architecture, trust, authority, and the structural decisions that shape how systems behave under pressure.
      </p>
    </div>

    {/* Articles grid */}
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
      {articles.map((article, i) => (
        <article
          class="reveal glass-card p-7 group hover:border-signal/20 transition-all duration-500 cursor-pointer"
          style={`transition-delay: ${i * 80}ms`}
        >
          <span class="text-signal/60 text-xs font-semibold tracking-[0.2em] uppercase mb-4 block">
            {article.category}
          </span>
          <h3 class="text-text-primary font-semibold text-lg mb-3 tracking-tight group-hover:text-signal transition-colors duration-300">
            {article.title}
          </h3>
          <p class="text-text-tertiary text-sm leading-relaxed">
            {article.description}
          </p>
          <div class="mt-5 flex items-center gap-2 text-signal/50 group-hover:text-signal text-xs font-medium transition-colors duration-300">
            <span>Coming soon</span>
            <svg class="w-3 h-3 group-hover:translate-x-1 transition-transform" viewBox="0 0 12 12" fill="none" stroke="currentColor" stroke-width="1.5">
              <path d="M2 6h8M7 3l3 3-3 3" />
            </svg>
          </div>
        </article>
      ))}
    </div>
  </div>
</section>
```

- [ ] **Step 2: Add to index.astro**

Add import and component after Principles:

```astro
import Writing from '../components/Writing.astro';
```

```astro
<Principles />
<Writing />
```

- [ ] **Step 3: Verify**

```bash
npm run dev
```

Expected: 3-column grid of article cards with category labels, titles that turn green on hover, descriptions, and "Coming soon" links. Glass card style.

- [ ] **Step 4: Commit**

```bash
git add src/components/Writing.astro src/pages/index.astro
git commit -m "feat: add writing/thinking section with article cards"
```

---

## Task 10: About Section

**Files:**
- Create: `src/components/About.astro`
- Modify: `src/pages/index.astro` (add import)

- [ ] **Step 1: Create About component**

Write `src/components/About.astro`:

```astro
---
const domains = [
  'Carbon & ESG infrastructure',
  'Workflow & audit systems',
  'Identity & authority models',
  'Token & incentive design',
  'Supply chain provenance',
  'Protocol architecture',
  'Enterprise data systems',
  'AI coordination layers',
];
---

<section id="about" class="section-padding">
  <div class="max-w-6xl mx-auto">
    <div class="grid grid-cols-1 lg:grid-cols-5 gap-16 lg:gap-24">
      {/* Left column - 3 cols */}
      <div class="lg:col-span-3 reveal">
        <p class="text-signal text-xs font-semibold tracking-[0.3em] uppercase mb-4">
          About
        </p>
        <h2 class="text-gradient text-3xl md:text-4xl font-bold tracking-tight mb-8 leading-tight">
          The architecture beneath trust, workflow, authority, and evidence
        </h2>
        <div class="space-y-5 text-text-secondary text-base leading-relaxed">
          <p>
            I am a senior systems architect and technical operator. My work focuses on designing infrastructure where trust, workflow, evidence, and incentives matter &mdash; especially when authority, provenance, identity, and coordination cannot be left vague.
          </p>
          <p>
            As CTO and architect at <a href="https://dovu.ai" target="_blank" rel="noopener" class="text-signal hover:underline">DOVU</a>, I designed the core architecture for an audit trail and workflow platform now serving programs managing over $1B in value. More recently, I designed <a href="https://authority.dovu.ai" target="_blank" rel="noopener" class="text-signal hover:underline">Authority Trail</a> &mdash; a protocol for provable authority in carbon markets.
          </p>
          <p>
            I think in terms of state, authority, time, verifiability, replayability, coordination under constraints, and economic alignment. I operate best at the layer beneath products, where primitives, models, and economic logic shape what a system can become.
          </p>
          <p>
            My edge is the combination: systems architecture, trust and provenance thinking, identity and authority design, workflow and process modelling, protocol and platform thinking, incentive and token design, and commercial reality. That combination is rare.
          </p>
        </div>
      </div>

      {/* Right column - 2 cols */}
      <div class="lg:col-span-2 reveal">
        <div class="glass-card p-8">
          <h3 class="text-text-primary font-semibold text-sm tracking-[0.15em] uppercase mb-6">
            Domains
          </h3>
          <div class="space-y-0">
            {domains.map((domain) => (
              <div class="py-3 border-b border-border last:border-0">
                <span class="text-text-secondary text-sm">{domain}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  </div>
</section>
```

- [ ] **Step 2: Add to index.astro**

Add import and component after Writing:

```astro
import About from '../components/About.astro';
```

```astro
<Writing />
<About />
```

- [ ] **Step 3: Verify**

```bash
npm run dev
```

Expected: Two-column layout. Left side has bio text with green links to dovu.ai and authority.dovu.ai. Right side has a glass card listing 8 domains.

- [ ] **Step 4: Commit**

```bash
git add src/components/About.astro src/pages/index.astro
git commit -m "feat: add about section with bio narrative and domain list"
```

---

## Task 11: Contact Section & Footer

**Files:**
- Create: `src/components/Contact.astro`
- Create: `src/components/Footer.astro`
- Modify: `src/pages/index.astro` (add imports)

- [ ] **Step 1: Create Contact component**

Write `src/components/Contact.astro`:

```astro
---
const engagements = [
  'Principal / Staff-level technical roles',
  'Systems architecture & protocol design',
  'Trust, identity, authority & provenance systems',
  'Incentive & mechanism design',
  'Advisory for serious infrastructure problems',
];
---

<section id="contact" class="section-padding">
  <div class="max-w-4xl mx-auto text-center">
    <div class="reveal">
      <p class="text-signal text-xs font-semibold tracking-[0.3em] uppercase mb-4">
        Collaboration
      </p>
      <h2 class="text-gradient text-3xl md:text-4xl lg:text-5xl font-bold tracking-tight mb-6">
        Discuss a system
      </h2>
      <p class="text-text-secondary text-lg leading-relaxed mb-12 max-w-2xl mx-auto">
        I work best with founders, CTOs, and serious technical organisations who need someone to shape or pressure-test foundational systems. If you are building infrastructure where trust, authority, evidence, or incentives matter &mdash; let's talk.
      </p>
    </div>

    {/* Engagement types */}
    <div class="reveal flex flex-wrap justify-center gap-3 mb-12">
      {engagements.map((engagement) => (
        <span class="text-xs text-text-tertiary px-4 py-2 rounded-full border border-border">
          {engagement}
        </span>
      ))}
    </div>

    {/* CTA */}
    <div class="reveal">
      <a
        href="mailto:matt@dovu.ai"
        class="glow-button inline-flex items-center gap-3 px-10 py-4 rounded-full text-sm tracking-wide"
      >
        <span>Get in touch</span>
        <svg class="w-4 h-4" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5">
          <path d="M3 8h10M10 4l4 4-4 4" />
        </svg>
      </a>
    </div>
  </div>
</section>
```

- [ ] **Step 2: Create Footer component**

Write `src/components/Footer.astro`:

```astro
---
const links = [
  { label: 'GitHub', href: 'https://github.com/mattsmithies' },
  { label: 'LinkedIn', href: 'https://linkedin.com/in/mattsmithies' },
  { label: 'DOVU', href: 'https://dovu.ai' },
];
---

<footer class="border-t border-border py-10 px-6">
  <div class="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
    <span class="text-text-tertiary text-xs tracking-wide">
      &copy; {new Date().getFullYear()} Matt Smithies
    </span>

    <div class="flex items-center gap-6">
      {links.map((link) => (
        <a
          href={link.href}
          target="_blank"
          rel="noopener"
          class="text-text-tertiary text-xs hover:text-text-primary transition-colors"
        >
          {link.label}
        </a>
      ))}
    </div>
  </div>
</footer>
```

- [ ] **Step 3: Add to index.astro**

Add imports and components:

```astro
import Contact from '../components/Contact.astro';
import Footer from '../components/Footer.astro';
```

```astro
<About />
<Contact />
<Footer />
```

Remove the spacer `<div class="h-screen"></div>` if still present.

- [ ] **Step 4: Verify**

```bash
npm run dev
```

Expected: Contact section with centered heading, engagement type pills, and a green glowing CTA button. Footer with copyright and external links.

- [ ] **Step 5: Commit**

```bash
git add src/components/Contact.astro src/components/Footer.astro src/pages/index.astro
git commit -m "feat: add contact section and footer"
```

---

## Task 12: GSAP Scroll Animations

**Files:**
- Create: `src/scripts/scroll-animations.ts`
- Modify: `src/pages/index.astro` (add script import)

- [ ] **Step 1: Create scroll animations script**

Write `src/scripts/scroll-animations.ts`:

```ts
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

export function initScrollAnimations() {
  // Respect reduced motion preference
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    document.querySelectorAll('.reveal').forEach((el) => {
      (el as HTMLElement).style.opacity = '1';
      (el as HTMLElement).style.transform = 'none';
    });
    return;
  }

  // Animate all .reveal elements
  const reveals = document.querySelectorAll('.reveal');

  reveals.forEach((el) => {
    gsap.fromTo(
      el,
      {
        opacity: 0,
        y: 32,
      },
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
      }
    );
  });

  // Stagger children in grids
  const grids = document.querySelectorAll(
    '#capabilities .grid, #principles .grid, #thinking .grid'
  );

  grids.forEach((grid) => {
    const children = grid.querySelectorAll('.reveal');
    gsap.fromTo(
      children,
      {
        opacity: 0,
        y: 32,
      },
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
      }
    );
  });

  // Hero elements - animate on load (no scroll trigger)
  const heroReveals = document.querySelectorAll('#hero .reveal');
  gsap.fromTo(
    heroReveals,
    {
      opacity: 0,
      y: 40,
    },
    {
      opacity: 1,
      y: 0,
      duration: 1,
      ease: 'power3.out',
      stagger: 0.15,
      delay: 0.3,
    }
  );

  // Subtle parallax on section headings
  document
    .querySelectorAll('section:not(#hero) > div > .reveal:first-child')
    .forEach((heading) => {
      gsap.to(heading, {
        y: -20,
        scrollTrigger: {
          trigger: heading,
          start: 'top 80%',
          end: 'bottom 20%',
          scrub: 1,
        },
      });
    });
}
```

- [ ] **Step 2: Add scroll animations to index.astro**

Update the script block in `src/pages/index.astro`:

```astro
<script>
  import { initNav } from '../scripts/nav';
  import { initScrollAnimations } from '../scripts/scroll-animations';

  initNav();

  // Wait for DOM to be fully ready
  document.addEventListener('DOMContentLoaded', () => {
    initScrollAnimations();
  });
</script>
```

- [ ] **Step 3: Verify**

```bash
npm run dev
```

Expected: Hero elements fade in on page load with staggered timing. Scrolling down reveals each section with smooth fade-up animations. Grid items (capabilities, principles, writing cards) stagger in sequentially. Section headings have subtle parallax movement.

- [ ] **Step 4: Commit**

```bash
git add src/scripts/scroll-animations.ts src/pages/index.astro
git commit -m "feat: add GSAP scroll animations with staggered reveals and parallax"
```

---

## Task 13: Final Assembly & Polish

**Files:**
- Modify: `src/pages/index.astro` (final assembly)
- Modify: `src/styles/global.css` (responsive polish)
- Create: `.gitignore`

- [ ] **Step 1: Finalize index.astro**

Write the complete `src/pages/index.astro`:

```astro
---
import Layout from '../layouts/Layout.astro';
import Nav from '../components/Nav.astro';
import Hero from '../components/Hero.astro';
import Capabilities from '../components/Capabilities.astro';
import Philosophy from '../components/Philosophy.astro';
import CaseStudies from '../components/CaseStudies.astro';
import Principles from '../components/Principles.astro';
import Writing from '../components/Writing.astro';
import About from '../components/About.astro';
import Contact from '../components/Contact.astro';
import Footer from '../components/Footer.astro';
import '../styles/global.css';
---

<Layout>
  <Nav />
  <main>
    <Hero />
    <Capabilities />
    <Philosophy />
    <CaseStudies />
    <Principles />
    <Writing />
    <About />
    <Contact />
  </main>
  <Footer />
</Layout>

<script>
  import { initNav } from '../scripts/nav';
  import { initScrollAnimations } from '../scripts/scroll-animations';

  initNav();
  document.addEventListener('DOMContentLoaded', () => {
    initScrollAnimations();
  });
</script>
```

- [ ] **Step 2: Add responsive polish to global.css**

Append to `src/styles/global.css`:

```css
/* Smooth scrollbar */
::-webkit-scrollbar {
  width: 6px;
}

::-webkit-scrollbar-track {
  background: var(--color-void);
}

::-webkit-scrollbar-thumb {
  background: rgba(255, 255, 255, 0.1);
  border-radius: 3px;
}

::-webkit-scrollbar-thumb:hover {
  background: rgba(255, 255, 255, 0.2);
}

/* Focus visible for keyboard navigation */
a:focus-visible,
button:focus-visible {
  outline: 2px solid var(--color-signal);
  outline-offset: 2px;
  border-radius: 4px;
}

/* Ensure text is readable on small screens */
@media (max-width: 640px) {
  h1 {
    font-size: 2rem;
    line-height: 1.15;
  }

  h2 {
    font-size: 1.75rem;
  }

  .section-padding {
    padding: 5rem 1.25rem;
  }
}
```

- [ ] **Step 3: Create .gitignore**

Write `.gitignore`:

```
# Astro
dist/
.astro/

# Dependencies
node_modules/

# Environment
.env
.env.*

# IDE
.idea/
.vscode/
*.swp
*.swo

# OS
.DS_Store
Thumbs.db

# Build
*.log
```

- [ ] **Step 4: Verify full build**

```bash
npm run build
```

Expected: Build completes successfully. Static output in `dist/` directory.

- [ ] **Step 5: Verify dev server**

```bash
npm run dev
```

Expected: Complete site renders with all sections in order: Nav -> Hero -> Capabilities -> Philosophy -> Case Studies -> Principles -> Writing -> About -> Contact -> Footer. All scroll animations work. Mobile menu works. Mesh background is interactive. All text is readable. No console errors.

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "feat: complete site assembly with responsive polish and gitignore"
```

---

## Task 14: Visual Testing & Browser Verification

This task is manual verification in the browser.

- [ ] **Step 1: Start dev server**

```bash
npm run dev
```

- [ ] **Step 2: Desktop verification checklist**

Open http://localhost:4321 and verify:

1. Mesh background renders and responds to mouse movement
2. Hero text is readable, gradient works, buttons have glow/ghost styles
3. Navigation turns glass on scroll, links scroll to correct sections
4. Capabilities grid is 3 columns with working hover states
5. Philosophy section has 2-column layout
6. Case studies cards show 2x2 detail grids
7. Principles grid is 4 columns
8. Writing cards are 3 columns with hover states
9. About section has bio + domain card
10. Contact has engagement pills and green CTA
11. Footer has links
12. All scroll animations fire correctly
13. No horizontal overflow

- [ ] **Step 3: Mobile verification (resize browser to 375px width)**

1. Navigation hamburger works, menu slides open/closed
2. All grids collapse to single column
3. Text sizes are readable
4. No horizontal scroll
5. Touch-friendly tap targets

- [ ] **Step 4: Fix any issues found**

Address any visual or functional issues discovered during testing.

- [ ] **Step 5: Final commit if fixes were needed**

```bash
git add -A
git commit -m "fix: visual polish and responsive adjustments from browser testing"
```
