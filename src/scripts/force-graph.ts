// force-graph.ts — Force-directed graph that grows and crystallizes
// Nodes appear, settle briefly via forces, then anchor permanently.
// The graph builds like a structure, not a soup.

interface Node {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  generation: number;
  connections: number;
  opacity: number;
  age: number;
  anchored: boolean;   // frozen in place after settling
}

interface Edge {
  a: number;
  b: number;
  age: number;
}

// ── Config ──────────────────────────────────────────────────

const MAX_NODES = 80;
const SPAWN_INTERVAL = 100;
const CONNECT_RADIUS = 180;
const MAX_EDGES_PER_SPAWN = 2;
const MIN_SPAWN_DIST = 80;       // no spawning near existing nodes
const ANCHOR_AGE = 180;          // ~3 seconds at 60fps — then freeze

// Forces (only affect un-anchored nodes during settling)
const REPULSION = 600;
const LINK_STRENGTH = 0.01;
const LINK_REST = 120;
const DAMPING = 0.94;
const COLLISION_PAD = 14;

// Visuals
const BASE_RADIUS = 3.5;
const HUB_BONUS = 0.8;
const MAX_RADIUS = 12;
const GLOW_MULT = 5;
const EDGE_ALPHA = 0.22;
const EDGE_WIDTH = 0.7;
const PULSE_SPEED = 0.0015;
const FADE_IN = 50;

// ── Palette ─────────────────────────────────────────────────

function nodeColor(node: Node, h: number): [number, number, number] {
  const t = Math.min(node.y / h, 1);
  return [
    Math.round(167 + (56 - 167) * t),
    Math.round(139 + (189 - 139) * t),
    Math.round(250 + (248 - 250) * t),
  ];
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

  // ── Seed ──────────────────────────────────────────────────

  function seed() {
    nodes.push({
      x: window.innerWidth * 0.5,
      y: window.innerHeight * 0.4,
      vx: 0, vy: 0,
      radius: 8,
      generation: 0,
      connections: 0,
      opacity: 0,
      age: 0,
      anchored: false,
    });
  }

  // ── Spawn ─────────────────────────────────────────────────

  function spawn() {
    if (nodes.length >= MAX_NODES) return;

    // Pick a random anchored node to branch from (prefer structure)
    const anchored = nodes.filter(n => n.anchored);
    const pool = anchored.length > 0 ? anchored : nodes;
    const parent = pool[Math.floor(Math.random() * pool.length)];
    const parentIdx = nodes.indexOf(parent);

    // Try a few angles to find one that has space
    for (let attempt = 0; attempt < 6; attempt++) {
      const angle = Math.random() * Math.PI * 2;
      const dist = 100 + Math.random() * 70;
      const nx = parent.x + Math.cos(angle) * dist;
      const ny = parent.y + Math.sin(angle) * dist;

      // Check bounds
      const margin = 60;
      if (nx < margin || nx > window.innerWidth - margin) continue;
      if (ny < margin || ny > window.innerHeight - margin) continue;

      // Check distance from ALL existing nodes
      let tooClose = false;
      for (const n of nodes) {
        const dx = n.x - nx;
        const dy = n.y - ny;
        if (dx * dx + dy * dy < MIN_SPAWN_DIST * MIN_SPAWN_DIST) {
          tooClose = true;
          break;
        }
      }
      if (tooClose) continue;

      // Good spot found
      const newIdx = nodes.length;
      nodes.push({
        x: nx, y: ny,
        vx: (Math.random() - 0.5) * 0.5,
        vy: (Math.random() - 0.5) * 0.5,
        radius: BASE_RADIUS,
        generation: frame,
        connections: 0,
        opacity: 0,
        age: 0,
        anchored: false,
      });

      // Connect to parent
      edges.push({ a: parentIdx, b: newIdx, age: 0 });
      parent.connections++;
      nodes[newIdx].connections++;

      // Connect to one nearby node (not parent)
      let bestIdx = -1;
      let bestDist = Infinity;
      for (let i = 0; i < nodes.length - 1; i++) {
        if (i === parentIdx) continue;
        const dx = nodes[i].x - nx;
        const dy = nodes[i].y - ny;
        const d = Math.sqrt(dx * dx + dy * dy);
        if (d < CONNECT_RADIUS && d < bestDist) {
          bestDist = d;
          bestIdx = i;
        }
      }
      if (bestIdx >= 0) {
        const exists = edges.some(
          e => (e.a === newIdx && e.b === bestIdx) || (e.b === newIdx && e.a === bestIdx)
        );
        if (!exists) {
          edges.push({ a: newIdx, b: bestIdx, age: 0 });
          nodes[newIdx].connections++;
          nodes[bestIdx].connections++;
        }
      }

      return; // spawned successfully
    }
    // All attempts failed — skip this spawn cycle
  }

  // ── Physics ───────────────────────────────────────────────

  function simulate() {
    const w = window.innerWidth;
    const h = window.innerHeight;

    // Many-body repulsion (anchored nodes exert force but don't receive it)
    for (let i = 0; i < nodes.length; i++) {
      for (let j = i + 1; j < nodes.length; j++) {
        const a = nodes[i], b = nodes[j];
        // Skip if both anchored — nothing moves
        if (a.anchored && b.anchored) continue;

        let dx = b.x - a.x;
        let dy = b.y - a.y;
        let distSq = dx * dx + dy * dy;
        if (distSq < 1) distSq = 1;
        const dist = Math.sqrt(distSq);
        const f = -REPULSION / distSq;
        const fx = (dx / dist) * f;
        const fy = (dy / dist) * f;

        if (!a.anchored) { a.vx -= fx; a.vy -= fy; }
        if (!b.anchored) { b.vx += fx; b.vy += fy; }
      }
    }

    // Link springs (only pull un-anchored nodes)
    for (const edge of edges) {
      const a = nodes[edge.a], b = nodes[edge.b];
      if (!a || !b) continue;
      if (a.anchored && b.anchored) continue;

      const dx = b.x - a.x;
      const dy = b.y - a.y;
      const dist = Math.sqrt(dx * dx + dy * dy) || 1;
      const displacement = dist - LINK_REST;
      const f = displacement * LINK_STRENGTH;
      const fx = (dx / dist) * f;
      const fy = (dy / dist) * f;

      if (!a.anchored) { a.vx += fx; a.vy += fy; }
      if (!b.anchored) { b.vx -= fx; b.vy -= fy; }
    }

    // Integration (only un-anchored nodes)
    for (const node of nodes) {
      node.age++;
      node.opacity = Math.min(node.age / FADE_IN, 1.0);
      node.radius = Math.min(BASE_RADIUS + node.connections * HUB_BONUS, MAX_RADIUS);

      // Anchor after settling period
      if (!node.anchored && node.age >= ANCHOR_AGE) {
        node.anchored = true;
        node.vx = 0;
        node.vy = 0;
        continue;
      }

      if (node.anchored) continue;

      // Damping
      node.vx *= DAMPING;
      node.vy *= DAMPING;

      // Integrate
      node.x += node.vx;
      node.y += node.vy;

      // Bounce off walls
      const margin = 50;
      if (node.x < margin) { node.x = margin; node.vx = Math.abs(node.vx) * 0.5; }
      if (node.x > w - margin) { node.x = w - margin; node.vx = -Math.abs(node.vx) * 0.5; }
      if (node.y < margin) { node.y = margin; node.vy = Math.abs(node.vy) * 0.5; }
      if (node.y > h - margin) { node.y = h - margin; node.vy = -Math.abs(node.vy) * 0.5; }
    }

    // Collision (push un-anchored away from everything)
    for (let i = 0; i < nodes.length; i++) {
      for (let j = i + 1; j < nodes.length; j++) {
        const a = nodes[i], b = nodes[j];
        if (a.anchored && b.anchored) continue;

        const dx = b.x - a.x, dy = b.y - a.y;
        const dist = Math.sqrt(dx * dx + dy * dy) || 1;
        const minDist = a.radius + b.radius + COLLISION_PAD;

        if (dist < minDist) {
          const push = (minDist - dist) * 0.5;
          const nx = dx / dist, ny = dy / dist;
          if (!a.anchored) { a.x -= nx * push; a.y -= ny * push; }
          if (!b.anchored) { b.x += nx * push; b.y += ny * push; }
        }
      }
    }

    for (const edge of edges) edge.age++;
  }

  // ── Render ────────────────────────────────────────────────

  function render(now: number) {
    frame++;
    const w = window.innerWidth;
    const h = window.innerHeight;
    const time = now * PULSE_SPEED;

    ctx.clearRect(0, 0, w, h);

    if (frame % SPAWN_INTERVAL === 0 && nodes.length > 0) {
      spawn();
    }

    simulate();

    // Edges
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

      // Signal pulse along edge
      if (edge.age > 40 && a.anchored && b.anchored) {
        const pt = (time * 0.5 + i * 0.2) % 1;
        const px = a.x + (b.x - a.x) * pt;
        const py = a.y + (b.y - a.y) * pt;
        ctx.beginPath();
        ctx.arc(px, py, 1.2, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(232, 232, 240, ${alpha * 2.5})`;
        ctx.fill();
      }
    }

    // Nodes
    for (let i = 0; i < nodes.length; i++) {
      const node = nodes[i];
      if (node.opacity < 0.01) continue;

      const [cr, cg, cb] = nodeColor(node, h);
      const pulse = Math.sin(time * 1.5 + i * 0.8) * 0.1 + 0.9;
      const r = node.radius * pulse;

      // Glow (brighter once anchored)
      const glowAlpha = node.anchored ? 0.14 : 0.08;
      const glowR = r * GLOW_MULT;
      const grad = ctx.createRadialGradient(node.x, node.y, 0, node.x, node.y, glowR);
      grad.addColorStop(0, `rgba(${cr}, ${cg}, ${cb}, ${node.opacity * glowAlpha})`);
      grad.addColorStop(0.5, `rgba(${cr}, ${cg}, ${cb}, ${node.opacity * 0.02})`);
      grad.addColorStop(1, `rgba(${cr}, ${cg}, ${cb}, 0)`);
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(node.x, node.y, glowR, 0, Math.PI * 2);
      ctx.fill();

      // Outer ring
      const outerAlpha = node.anchored ? 0.65 : 0.4;
      ctx.beginPath();
      ctx.arc(node.x, node.y, r, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(${cr}, ${cg}, ${cb}, ${node.opacity * outerAlpha})`;
      ctx.fill();

      // Bright core
      ctx.beginPath();
      ctx.arc(node.x, node.y, r * 0.35, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(232, 232, 240, ${node.opacity * 0.8})`;
      ctx.fill();
    }

    animationId = requestAnimationFrame(render);
  }

  // ── Init ──────────────────────────────────────────────────

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
