// mesh-background.ts — Interactive hexagonal particle mesh background
// Canvas 2D mouse-reactive particle grid with spring physics

interface Dot {
  // Grid home position
  homeX: number;
  homeY: number;
  // Current animated position
  x: number;
  y: number;
  // Velocity for spring physics
  vx: number;
  vy: number;
}

interface MeshConfig {
  spacing: number;
  connectionDist: number;
  repelRadius: number;
  springK: number;
  damping: number;
  dotRadius: number;
  dotRadiusHover: number;
  dotAlpha: number;
  dotAlphaHover: number;
  lineAlpha: number;
  lineAlphaHover: number;
  lineWidth: number;
}

// An edge is a pair of dot indices [i, j] where i < j
type Edge = [number, number];

function getConfig(): MeshConfig {
  const isMobile = window.innerWidth < 768;
  return {
    spacing: isMobile ? 72 : 52,
    connectionDist: isMobile ? 90 : 74,
    repelRadius: 150,
    springK: 0.04,
    damping: 0.85,
    dotRadius: 1,
    dotRadiusHover: 1.8,
    dotAlpha: 0.15,
    dotAlphaHover: 0.5,
    lineAlpha: 0.06,
    lineAlphaHover: 0.18,
    lineWidth: 0.5,
  };
}

function buildGrid(
  width: number,
  height: number,
  spacing: number,
  connectionDist: number,
): { dots: Dot[]; edges: Edge[] } {
  const dots: Dot[] = [];
  const rowHeight = spacing * (Math.sqrt(3) / 2);
  // Add margin outside viewport so edges don't look truncated
  const margin = spacing;

  let row = 0;
  for (let y = -margin; y < height + margin; y += rowHeight) {
    const offsetX = row % 2 === 1 ? spacing / 2 : 0;
    for (let x = -margin + offsetX; x < width + margin; x += spacing) {
      dots.push({
        homeX: x,
        homeY: y,
        x,
        y,
        vx: 0,
        vy: 0,
      });
    }
    row++;
  }

  // Precompute edges based on home positions within connection distance
  const connDistSq = connectionDist * connectionDist;
  const edges: Edge[] = [];
  for (let i = 0; i < dots.length; i++) {
    for (let j = i + 1; j < dots.length; j++) {
      const dx = dots[j].homeX - dots[i].homeX;
      const dy = dots[j].homeY - dots[i].homeY;
      if (dx * dx + dy * dy <= connDistSq) {
        edges.push([i, j]);
      }
    }
  }

  return { dots, edges };
}

export function initMeshBackground(canvas: HTMLCanvasElement): void {
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  let config = getConfig();
  let dots: Dot[] = [];
  let edges: Edge[] = [];
  let mouseX = -9999;
  let mouseY = -9999;
  let animationId = 0;
  let reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function resize(): void {
    const dpr = window.devicePixelRatio || 1;
    const w = window.innerWidth;
    const h = window.innerHeight;
    canvas.width = w * dpr;
    canvas.height = h * dpr;
    // CSS size is handled by Tailwind classes (w-full h-full), but set explicitly for safety
    canvas.style.width = `${w}px`;
    canvas.style.height = `${h}px`;
    ctx!.setTransform(dpr, 0, 0, dpr, 0, 0);
    config = getConfig();
    const grid = buildGrid(w, h, config.spacing, config.connectionDist);
    dots = grid.dots;
    edges = grid.edges;
  }

  function drawStaticMesh(): void {
    const w = window.innerWidth;
    const h = window.innerHeight;
    ctx!.clearRect(0, 0, w, h);

    // Draw lines (all at base alpha, single batched path)
    ctx!.lineWidth = config.lineWidth;
    ctx!.strokeStyle = `rgba(34, 197, 94, ${config.lineAlpha})`;
    ctx!.beginPath();
    for (const [i, j] of edges) {
      ctx!.moveTo(dots[i].homeX, dots[i].homeY);
      ctx!.lineTo(dots[j].homeX, dots[j].homeY);
    }
    ctx!.stroke();

    // Draw dots (all at base alpha)
    ctx!.fillStyle = `rgba(34, 197, 94, ${config.dotAlpha})`;
    for (const dot of dots) {
      ctx!.beginPath();
      ctx!.arc(dot.homeX, dot.homeY, config.dotRadius, 0, Math.PI * 2);
      ctx!.fill();
    }
  }

  function animate(): void {
    const w = window.innerWidth;
    const h = window.innerHeight;
    ctx!.clearRect(0, 0, w, h);

    const repelRadiusSq = config.repelRadius * config.repelRadius;

    // Physics update
    for (const dot of dots) {
      // Spring back to home
      const dxHome = dot.homeX - dot.x;
      const dyHome = dot.homeY - dot.y;
      let ax = dxHome * config.springK;
      let ay = dyHome * config.springK;

      // Mouse repulsion
      const dxMouse = dot.x - mouseX;
      const dyMouse = dot.y - mouseY;
      const distMouseSq = dxMouse * dxMouse + dyMouse * dyMouse;
      if (distMouseSq < repelRadiusSq && distMouseSq > 0) {
        const distMouse = Math.sqrt(distMouseSq);
        const force = (1 - distMouse / config.repelRadius) * 3;
        ax += (dxMouse / distMouse) * force;
        ay += (dyMouse / distMouse) * force;
      }

      dot.vx = (dot.vx + ax) * config.damping;
      dot.vy = (dot.vy + ay) * config.damping;
      dot.x += dot.vx;
      dot.y += dot.vy;
    }

    // Draw lines along precomputed edges
    ctx!.lineWidth = config.lineWidth;
    for (const [i, j] of edges) {
      const a = dots[i];
      const b = dots[j];

      // Calculate midpoint distance to mouse for brightness
      const midX = (a.x + b.x) * 0.5;
      const midY = (a.y + b.y) * 0.5;
      const dxm = midX - mouseX;
      const dym = midY - mouseY;
      const distToMouseSq = dxm * dxm + dym * dym;
      let alpha: number;
      if (distToMouseSq < repelRadiusSq) {
        const proximity = 1 - Math.sqrt(distToMouseSq) / config.repelRadius;
        alpha = config.lineAlpha + (config.lineAlphaHover - config.lineAlpha) * proximity;
      } else {
        alpha = config.lineAlpha;
      }

      ctx!.strokeStyle = `rgba(34, 197, 94, ${alpha})`;
      ctx!.beginPath();
      ctx!.moveTo(a.x, a.y);
      ctx!.lineTo(b.x, b.y);
      ctx!.stroke();
    }

    // Draw dots
    for (const dot of dots) {
      const dxm = dot.x - mouseX;
      const dym = dot.y - mouseY;
      const distToMouseSq = dxm * dxm + dym * dym;
      let alpha: number;
      let radius: number;
      if (distToMouseSq < repelRadiusSq) {
        const proximity = 1 - Math.sqrt(distToMouseSq) / config.repelRadius;
        alpha = config.dotAlpha + (config.dotAlphaHover - config.dotAlpha) * proximity;
        radius = config.dotRadius + (config.dotRadiusHover - config.dotRadius) * proximity;
      } else {
        alpha = config.dotAlpha;
        radius = config.dotRadius;
      }

      ctx!.fillStyle = `rgba(34, 197, 94, ${alpha})`;
      ctx!.beginPath();
      ctx!.arc(dot.x, dot.y, radius, 0, Math.PI * 2);
      ctx!.fill();
    }

    animationId = requestAnimationFrame(animate);
  }

  // Event handlers
  function onMouseMove(e: MouseEvent): void {
    mouseX = e.clientX;
    mouseY = e.clientY;
  }

  function onMouseLeave(): void {
    mouseX = -9999;
    mouseY = -9999;
  }

  function onResize(): void {
    resize();
    if (reducedMotion) {
      drawStaticMesh();
    }
  }

  // Listen for reduced motion preference changes
  const motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
  motionQuery.addEventListener('change', (e) => {
    reducedMotion = e.matches;
    if (reducedMotion) {
      cancelAnimationFrame(animationId);
      // Reset dots to home positions
      for (const dot of dots) {
        dot.x = dot.homeX;
        dot.y = dot.homeY;
        dot.vx = 0;
        dot.vy = 0;
      }
      drawStaticMesh();
    } else {
      animationId = requestAnimationFrame(animate);
    }
  });

  // Bind events
  window.addEventListener('mousemove', onMouseMove);
  document.addEventListener('mouseleave', onMouseLeave);
  window.addEventListener('resize', onResize);

  // Initialize
  resize();

  if (reducedMotion) {
    drawStaticMesh();
  } else {
    animationId = requestAnimationFrame(animate);
  }
}
