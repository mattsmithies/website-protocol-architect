// network-graph.ts — Emergent network graph overlay
// Renders nodes and edges in deeply-observed areas of the knowledge map
// Nodes grow from observation peaks. Edges connect nearby nodes.
// The network emerges organically from where you've looked.

export interface NetworkGraphState {
  setVisible: (v: boolean) => void;
  isVisible: () => boolean;
  destroy: () => void;
}

export function initNetworkGraph(
  canvas: HTMLCanvasElement,
  getNodes: () => { x: number; y: number; strength: number }[],
): NetworkGraphState {
  const ctx = canvas.getContext('2d')!;
  let visible = true;
  let animationId = 0;
  let time = 0;

  function resize() {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = window.innerWidth * dpr;
    canvas.height = window.innerHeight * dpr;
    canvas.style.width = window.innerWidth + 'px';
    canvas.style.height = window.innerHeight + 'px';
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  function render() {
    if (!visible) {
      animationId = requestAnimationFrame(render);
      return;
    }

    time += 0.016;
    const w = window.innerWidth;
    const h = window.innerHeight;

    ctx.clearRect(0, 0, w, h);

    const nodes = getNodes();
    if (nodes.length < 2) {
      animationId = requestAnimationFrame(render);
      return;
    }

    const MAX_EDGE_DIST = 0.18; // normalized distance for edges

    // Draw edges first (behind nodes)
    for (let i = 0; i < nodes.length; i++) {
      for (let j = i + 1; j < nodes.length; j++) {
        const a = nodes[i];
        const b = nodes[j];
        const dx = a.x - b.x;
        const dy = a.y - b.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist > MAX_EDGE_DIST) continue;

        const edgeStrength = Math.min(a.strength, b.strength);
        const distFade = 1 - dist / MAX_EDGE_DIST;
        const alpha = edgeStrength * distFade * 0.3;

        if (alpha < 0.01) continue;

        // Pulse along edge
        const pulsePos = (time * 0.3 + i * 0.1) % 1;
        const ax = a.x * w;
        const ay = a.y * h;
        const bx = b.x * w;
        const by = b.y * h;

        // Base edge
        ctx.beginPath();
        ctx.moveTo(ax, ay);
        ctx.lineTo(bx, by);
        ctx.strokeStyle = `rgba(167, 139, 250, ${alpha})`;
        ctx.lineWidth = 0.6;
        ctx.stroke();

        // Pulse dot traveling along edge
        if (edgeStrength > 0.5) {
          const px = ax + (bx - ax) * pulsePos;
          const py = ay + (by - ay) * pulsePos;
          ctx.beginPath();
          ctx.arc(px, py, 1.5, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(56, 189, 248, ${alpha * 1.5})`;
          ctx.fill();
        }
      }
    }

    // Draw nodes
    for (let i = 0; i < nodes.length; i++) {
      const node = nodes[i];
      const x = node.x * w;
      const y = node.y * h;

      // Node visibility based on strength
      const nodeAlpha = Math.max(0, (node.strength - 0.3) / 0.7); // fade in from 0.3
      if (nodeAlpha < 0.01) continue;

      // Pulsing size
      const pulse = Math.sin(time * 1.5 + i * 1.7) * 0.3 + 0.7;
      const baseRadius = 2 + node.strength * 3;
      const radius = baseRadius * pulse;

      // Glow
      const glowRadius = radius * 4;
      const gradient = ctx.createRadialGradient(x, y, 0, x, y, glowRadius);
      gradient.addColorStop(0, `rgba(167, 139, 250, ${nodeAlpha * 0.15})`);
      gradient.addColorStop(0.5, `rgba(56, 189, 248, ${nodeAlpha * 0.05})`);
      gradient.addColorStop(1, 'rgba(167, 139, 250, 0)');
      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.arc(x, y, glowRadius, 0, Math.PI * 2);
      ctx.fill();

      // Core dot
      ctx.beginPath();
      ctx.arc(x, y, radius, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(167, 139, 250, ${nodeAlpha * 0.8})`;
      ctx.fill();

      // Bright center
      ctx.beginPath();
      ctx.arc(x, y, radius * 0.4, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(232, 232, 240, ${nodeAlpha * 0.6})`;
      ctx.fill();
    }

    animationId = requestAnimationFrame(render);
  }

  const state: NetworkGraphState = {
    setVisible: (v) => { visible = v; if (!v) ctx.clearRect(0, 0, canvas.width, canvas.height); },
    isVisible: () => visible,
    destroy: () => cancelAnimationFrame(animationId),
  };

  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    return state;
  }

  window.addEventListener('resize', resize);
  resize();
  animationId = requestAnimationFrame(render);
  return state;
}
