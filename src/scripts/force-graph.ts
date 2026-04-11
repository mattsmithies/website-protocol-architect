// force-graph.ts — Force-directed graph that grows top-to-bottom
// Starts from a seed and expands outward over time. Physics-driven,
// alive, striking. Understanding growing from nothing.

interface Node {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  generation: number;  // when it was born (affects color)
  connections: number; // edge count (hubs grow larger)
  opacity: number;
  age: number;
}

interface Edge {
  a: number;
  b: number;
  age: number;
}

// ── Config ──────────────────────────────────────────────────

const MAX_NODES = 120;
const SPAWN_INTERVAL = 90;       // slower spawning — time to breathe
const CONNECT_RADIUS = 160;      // max px to form an edge
const MAX_EDGES_PER_SPAWN = 3;

// Forces — slow, drifting, no gravity
const REPULSION = 350;
const LINK_STRENGTH = 0.015;     // softer springs
const LINK_REST = 100;           // more space between connected nodes
const DAMPING = 0.97;            // much less friction — things drift longer
const COLLISION_PAD = 8;

// Visuals
const BASE_RADIUS = 3.5;
const HUB_BONUS = 0.8;
const MAX_RADIUS = 12;
const GLOW_MULT = 5;
const EDGE_ALPHA = 0.22;
const EDGE_WIDTH = 0.7;
const PULSE_SPEED = 0.0015;
const FADE_IN = 60;

// ── Palette: violet at top → blue at bottom ─────────────────

function nodeColor(node: Node, h: number): [number, number, number] {
  const t = Math.min(node.y / h, 1); // 0 at top, 1 at bottom
  // Violet → indigo → sky blue
  const r = Math.round(167 + (56 - 167) * t);
  const g = Math.round(139 + (189 - 139) * t);
  const b = Math.round(250 + (248 - 250) * t);
  return [r, g, b];
}

// ── Graph ───────────────────────────────────────────────────

export function initForceGraph(canvas: HTMLCanvasElement): {
  getNodeCount: () => number;
  destroy: () => void;
} {
  const ctx = canvas.getContext('2d')!;
  const nodes: Node[] = [];
  const edges: Edge[] = [];
  let frame = 0;
  let animationId = 0;

  function resize() {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = window.innerWidth * dpr;
    canvas.height = window.innerHeight * dpr;
    canvas.style.width = window.innerWidth + 'px';
    canvas.style.height = window.innerHeight + 'px';
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  // ── Seed ────────────────────────────────────────────────

  function seed() {
    const cx = window.innerWidth * 0.5;
    const cy = window.innerHeight * 0.4;
    nodes.push({
      x: cx, y: cy,
      vx: 0, vy: 0,
      radius: 8,
      generation: 0,
      connections: 0,
      opacity: 0, age: 0,
    });
  }

  // ── Spawn ───────────────────────────────────────────────

  function spawn() {
    if (nodes.length >= MAX_NODES) return;

    // Pick a random existing node to branch from
    const parentIdx = Math.floor(Math.random() * nodes.length);
    const parent = nodes[parentIdx];

    // New node spawns nearby, any direction
    const angle = Math.random() * Math.PI * 2;
    const dist = 50 + Math.random() * 70;
    const nx = parent.x + Math.cos(angle) * dist;
    const ny = parent.y + Math.sin(angle) * dist;

    const newIdx = nodes.length;
    nodes.push({
      x: nx,
      y: ny,
      vx: (Math.random() - 0.5) * 0.8,  // slow initial velocity
      vy: (Math.random() - 0.5) * 0.8,
      radius: BASE_RADIUS,
      generation: frame,
      connections: 0,
      opacity: 0,
      age: 0,
    });

    // Connect to parent
    edges.push({ a: parentIdx, b: newIdx, age: 0 });
    parent.connections++;
    nodes[newIdx].connections++;

    // Connect to nearby nodes (not just parent)
    const nearby: { idx: number; dist: number }[] = [];
    for (let i = 0; i < nodes.length - 1; i++) {
      if (i === parentIdx) continue;
      const dx = nodes[i].x - nx;
      const dy = nodes[i].y - ny;
      const d = Math.sqrt(dx * dx + dy * dy);
      if (d < CONNECT_RADIUS) {
        nearby.push({ idx: i, dist: d });
      }
    }
    nearby.sort((a, b) => a.dist - b.dist);

    const extraEdges = Math.min(nearby.length, MAX_EDGES_PER_SPAWN - 1);
    for (let e = 0; e < extraEdges; e++) {
      // Avoid duplicate edges
      const exists = edges.some(
        edge => (edge.a === newIdx && edge.b === nearby[e].idx) ||
                (edge.b === newIdx && edge.a === nearby[e].idx)
      );
      if (!exists) {
        edges.push({ a: newIdx, b: nearby[e].idx, age: 0 });
        nodes[newIdx].connections++;
        nodes[nearby[e].idx].connections++;
      }
    }
  }

  // ── Physics ─────────────────────────────────────────────

  function simulate() {
    const w = window.innerWidth;

    // Many-body repulsion
    for (let i = 0; i < nodes.length; i++) {
      for (let j = i + 1; j < nodes.length; j++) {
        const a = nodes[i], b = nodes[j];
        let dx = b.x - a.x;
        let dy = b.y - a.y;
        let distSq = dx * dx + dy * dy;
        if (distSq < 1) distSq = 1;
        const dist = Math.sqrt(distSq);
        const f = -REPULSION / distSq;
        const fx = (dx / dist) * f;
        const fy = (dy / dist) * f;
        a.vx -= fx; a.vy -= fy;
        b.vx += fx; b.vy += fy;
      }
    }

    // Link springs
    for (const edge of edges) {
      const a = nodes[edge.a], b = nodes[edge.b];
      if (!a || !b) continue;
      const dx = b.x - a.x;
      const dy = b.y - a.y;
      const dist = Math.sqrt(dx * dx + dy * dy) || 1;
      const displacement = dist - LINK_REST;
      const f = displacement * LINK_STRENGTH;
      const fx = (dx / dist) * f;
      const fy = (dy / dist) * f;
      a.vx += fx; a.vy += fy;
      b.vx -= fx; b.vy -= fy;
    }

    // Per-node forces + integration
    const h = window.innerHeight;
    for (const node of nodes) {
      // No gravity. No centering. Just drift, forces, and walls.

      // Damping (high value = slow, drifting movement)
      node.vx *= DAMPING;
      node.vy *= DAMPING;

      // Integrate
      node.x += node.vx;
      node.y += node.vy;

      // Bounce off all walls (elastic, preserves energy)
      const margin = 40;
      if (node.x < margin) { node.x = margin; node.vx = Math.abs(node.vx) * 0.6; }
      if (node.x > w - margin) { node.x = w - margin; node.vx = -Math.abs(node.vx) * 0.6; }
      if (node.y < margin) { node.y = margin; node.vy = Math.abs(node.vy) * 0.6; }
      if (node.y > h - margin) { node.y = h - margin; node.vy = -Math.abs(node.vy) * 0.6; }

      // Age + fade-in
      node.age++;
      node.opacity = Math.min(node.age / FADE_IN, 1.0);

      // Hub radius (grows with connections)
      node.radius = Math.min(BASE_RADIUS + node.connections * HUB_BONUS, MAX_RADIUS);
    }

    // Collision
    for (let i = 0; i < nodes.length; i++) {
      for (let j = i + 1; j < nodes.length; j++) {
        const a = nodes[i], b = nodes[j];
        const dx = b.x - a.x, dy = b.y - a.y;
        const dist = Math.sqrt(dx * dx + dy * dy) || 1;
        const minDist = a.radius + b.radius + COLLISION_PAD;
        if (dist < minDist) {
          const push = (minDist - dist) * 0.5;
          const nx = dx / dist, ny = dy / dist;
          a.x -= nx * push; a.y -= ny * push;
          b.x += nx * push; b.y += ny * push;
        }
      }
    }

    // Age edges
    for (const edge of edges) edge.age++;
  }

  // ── Render ──────────────────────────────────────────────

  function render(now: number) {
    frame++;
    const w = window.innerWidth;
    const h = window.innerHeight;
    const time = now * PULSE_SPEED;

    ctx.clearRect(0, 0, w, h);

    // Spawn
    if (frame % SPAWN_INTERVAL === 0 && nodes.length > 0) {
      spawn();
    }

    simulate();

    // ── Edges ───────────────────────────────────────────
    for (let i = 0; i < edges.length; i++) {
      const edge = edges[i];
      const a = nodes[edge.a], b = nodes[edge.b];
      if (!a || !b) continue;

      const alpha = Math.min(a.opacity, b.opacity) * EDGE_ALPHA;
      if (alpha < 0.005) continue;

      const [cr, cg, cb] = nodeColor(a, h);
      const [cr2, cg2, cb2] = nodeColor(b, h);
      const mr = (cr + cr2) >> 1;
      const mg = (cg + cg2) >> 1;
      const mb = (cb + cb2) >> 1;

      ctx.beginPath();
      ctx.moveTo(a.x, a.y);
      ctx.lineTo(b.x, b.y);
      ctx.strokeStyle = `rgba(${mr}, ${mg}, ${mb}, ${alpha})`;
      ctx.lineWidth = EDGE_WIDTH;
      ctx.stroke();

      // Signal pulse
      if (edge.age > 30) {
        const pt = (time * 0.6 + i * 0.17) % 1;
        const px = a.x + (b.x - a.x) * pt;
        const py = a.y + (b.y - a.y) * pt;
        ctx.beginPath();
        ctx.arc(px, py, 1.3, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(232, 232, 240, ${alpha * 2})`;
        ctx.fill();
      }
    }

    // ── Nodes ───────────────────────────────────────────
    for (let i = 0; i < nodes.length; i++) {
      const node = nodes[i];
      if (node.opacity < 0.01) continue;

      const [cr, cg, cb] = nodeColor(node, h);
      const pulse = Math.sin(time * 1.5 + i * 0.8) * 0.12 + 0.88;
      const r = node.radius * pulse;

      // Glow
      const glowR = r * GLOW_MULT;
      const grad = ctx.createRadialGradient(node.x, node.y, 0, node.x, node.y, glowR);
      grad.addColorStop(0, `rgba(${cr}, ${cg}, ${cb}, ${node.opacity * 0.12})`);
      grad.addColorStop(0.5, `rgba(${cr}, ${cg}, ${cb}, ${node.opacity * 0.03})`);
      grad.addColorStop(1, `rgba(${cr}, ${cg}, ${cb}, 0)`);
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(node.x, node.y, glowR, 0, Math.PI * 2);
      ctx.fill();

      // Outer
      ctx.beginPath();
      ctx.arc(node.x, node.y, r, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(${cr}, ${cg}, ${cb}, ${node.opacity * 0.55})`;
      ctx.fill();

      // Core
      ctx.beginPath();
      ctx.arc(node.x, node.y, r * 0.35, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(232, 232, 240, ${node.opacity * 0.8})`;
      ctx.fill();
    }

    animationId = requestAnimationFrame(render);
  }

  // ── Init ──────────────────────────────────────────────

  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    return { getNodeCount: () => 0, destroy: () => {} };
  }

  window.addEventListener('resize', resize);
  resize();
  seed();
  animationId = requestAnimationFrame(render);

  return {
    getNodeCount: () => nodes.length,
    destroy: () => cancelAnimationFrame(animationId),
  };
}
