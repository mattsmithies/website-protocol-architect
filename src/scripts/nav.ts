// nav.ts — Navigation scroll-awareness and mobile menu behaviour

export function initNav(): void {
  const nav = document.getElementById('main-nav') as HTMLElement | null;
  const toggle = document.getElementById('mobile-menu-toggle') as HTMLButtonElement | null;
  const menu = document.getElementById('mobile-menu') as HTMLElement | null;
  const bar1 = document.getElementById('bar1') as HTMLElement | null;
  const bar2 = document.getElementById('bar2') as HTMLElement | null;
  const bar3 = document.getElementById('bar3') as HTMLElement | null;

  if (!nav || !toggle || !menu || !bar1 || !bar2 || !bar3) return;

  let menuOpen = false;

  // ── 1. Scroll-aware background ───────────────────────────────────────────

  function onScroll(): void {
    if (window.scrollY > 80) {
      nav!.style.background = 'rgba(8, 9, 15, 0.85)';
      nav!.style.backdropFilter = 'blur(16px)';
      (nav!.style as CSSStyleDeclaration & { webkitBackdropFilter: string }).webkitBackdropFilter = 'blur(16px)';
      nav!.style.borderBottom = '1px solid rgba(255, 255, 255, 0.06)';
    } else {
      nav!.style.background = 'transparent';
      nav!.style.backdropFilter = '';
      (nav!.style as CSSStyleDeclaration & { webkitBackdropFilter: string }).webkitBackdropFilter = '';
      nav!.style.borderBottom = '1px solid transparent';
    }
  }

  window.addEventListener('scroll', onScroll, { passive: true });

  // Run once on init to handle page-load position
  onScroll();

  // ── 2. Mobile menu toggle ────────────────────────────────────────────────

  function openMenu(): void {
    menuOpen = true;
    menu!.style.maxHeight = `${menu!.scrollHeight}px`;
    menu!.style.opacity = '1';
    toggle!.setAttribute('aria-expanded', 'true');

    // Animate bars into X
    bar1!.style.transform = 'rotate(45deg) translateY(3.5px)';
    bar2!.style.opacity = '0';
    bar3!.style.transform = 'rotate(-45deg) translateY(-3.5px)';
  }

  function closeMenu(): void {
    menuOpen = false;
    menu!.style.maxHeight = '0';
    menu!.style.opacity = '0';
    toggle!.setAttribute('aria-expanded', 'false');

    // Reset bars
    bar1!.style.transform = '';
    bar2!.style.opacity = '';
    bar3!.style.transform = '';
  }

  toggle.addEventListener('click', () => {
    if (menuOpen) {
      closeMenu();
    } else {
      openMenu();
    }
  });

  // ── 3. Close menu when any mobile link is clicked ────────────────────────

  const mobileLinks = menu.querySelectorAll('a');
  mobileLinks.forEach((link) => {
    link.addEventListener('click', () => {
      closeMenu();
    });
  });
}
