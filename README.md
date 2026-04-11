# Protocol Architect — Personal Website

Personal website for Matt Smithies. Systems architect for trust, workflow, provenance, identity, authority, and incentive design.

## Quick Start

```bash
npm install
npm run dev
```

Open [http://localhost:4321](http://localhost:4321)

## Commands

| Command | Action |
|---------|--------|
| `npm run dev` | Start dev server at `localhost:4321` |
| `npm run build` | Build production site to `./dist/` |
| `npm run preview` | Preview production build locally |

## Stack

- [Astro](https://astro.build) 6.x
- [Tailwind CSS](https://tailwindcss.com) 4.x (via `@tailwindcss/vite`)
- [GSAP](https://gsap.com) 3.x + ScrollTrigger
- TypeScript
- Canvas 2D (interactive mesh background)

## Project Structure

```
src/
  layouts/
    Layout.astro          # Base HTML shell, meta tags, fonts, canvas element
  components/
    Nav.astro             # Fixed scroll-aware navigation
    Hero.astro            # Hero headline and CTAs
    Capabilities.astro    # 6-card capability grid
    Philosophy.astro      # Operating model narrative
    CaseStudies.astro     # Architecture case studies (DOVU OS, Authority Trail, Token Design)
    Principles.astro      # 8-item design principles grid
    Writing.astro         # Article/thinking preview cards
    About.astro           # Bio and domain list
    Contact.astro         # Collaboration CTA
    Footer.astro          # Footer links
  scripts/
    mesh-background.ts    # Canvas 2D interactive particle mesh
    scroll-animations.ts  # GSAP ScrollTrigger setup
    nav.ts                # Mobile menu and scroll-aware nav
  styles/
    global.css            # Tailwind v4 config, design tokens, utility classes
  pages/
    index.astro           # Page assembly
```

## Design Tokens

Defined in `src/styles/global.css` via Tailwind v4 `@theme`:

- **Background**: `--color-void` (#08090f)
- **Accent**: `--color-signal` (#22c55e)
- **Text**: primary (92% white), secondary (55%), tertiary (32%)
- **Font**: Montserrat 400-900
