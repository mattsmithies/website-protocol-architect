// force-graph.ts — Force-directed graph that grows on the right side of the hero
// Unique structure every visit. Nodes settle and anchor. Stray nodes fly back up.

interface Node {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  connections: number;
  opacity: number;
  age: number;
  anchorAge: number;
  anchored: boolean;
  pruning: boolean;      // marked for removal
  pruneProgress: number; // 0→1 fade-out with red hue
}

interface Edge {
  a: number;
  b: number;
  age: number;
}

// ── Config ──────────────────────────────────────────────────

const MAX_NODES = 65;
const SPAWN_INTERVAL = 80;
const CONNECT_RADIUS = 160;
const MAX_EDGES_PER_SPAWN = 2;
const MIN_SPAWN_DIST = 70;
const ANCHOR_AGE_MIN = 60;       // ~1s minimum
const ANCHOR_AGE_MAX = 300;      // ~5s maximum

// Forces
const REPULSION = 600;
const LINK_STRENGTH = 0.01;
const LINK_REST = 110;
const DAMPING = 0.94;
const COLLISION_PAD = 12;
const FLY_UP_STRENGTH = 0.15;
const PRUNE_CHECK_INTERVAL = 200; // frames between prune checks
const PRUNE_FADE_SPEED = 0.012;   // how fast pruned nodes fade out
const PRUNE_OVERCROWDED_DIST = 55; // nodes closer than this are candidates
const PRUNE_OVERCONNECTED = 3;     // nodes with more edges than this

// Visuals
const BASE_RADIUS = 3.5;
const HUB_BONUS = 0.7;
const MAX_RADIUS = 11;
const GLOW_MULT = 5;
const EDGE_ALPHA = 0.22;
const EDGE_WIDTH = 0.7;
const PULSE_SPEED = 0.0015;
const FADE_IN = 50;

// ── Spawn zone: right side of viewport, hero height ────────

function getSpawnBounds(w: number, h: number) {
  return {
    left: w * 0.45,         // right ~55% of viewport
    right: w - 50,
    top: h * 0.08,          // hero area top
    bottom: h * 0.82,       // hero area bottom
    centerX: w * 0.7,       // center of spawn zone
    centerY: h * 0.42,
  };
}

// ── Palette ─────────────────────────────────────────────────

function nodeColor(node: Node, bounds: ReturnType<typeof getSpawnBounds>): [number, number, number] {
  // Color based on distance from spawn center — inner violet, outer blue
  const dx = (node.x - bounds.centerX) / (bounds.right - bounds.left);
  const dy = (node.y - bounds.centerY) / (bounds.bottom - bounds.top);
  const t = Math.min(Math.sqrt(dx * dx + dy * dy) * 1.5, 1);
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

  // Canvas matches the hero section (not full page)
  function resize() {
    const hero = canvas.parentElement;
    if (!hero) return;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const rect = hero.getBoundingClientRect();
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    canvas.style.width = rect.width + 'px';
    canvas.style.height = rect.height + 'px';
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  function seed() {
    const w = canvas.clientWidth;
    const h = canvas.clientHeight;
    const bounds = getSpawnBounds(w, h);
    nodes.push({
      x: bounds.centerX,
      y: bounds.centerY,
      vx: 0, vy: 0,
      radius: 7,
      connections: 0,
      opacity: 0,
      age: 0,
      anchorAge: ANCHOR_AGE_MIN + Math.random() * (ANCHOR_AGE_MAX - ANCHOR_AGE_MIN),
      anchored: false,
      pruning: false,
      pruneProgress: 0,
    });
  }

  function spawn() {
    if (nodes.length >= MAX_NODES) return;
    const w = canvas.clientWidth;
    const h = canvas.clientHeight;
    const bounds = getSpawnBounds(w, h);

    // Pick an anchored node to branch from
    const anchored = nodes.filter(n => n.anchored);
    const pool = anchored.length > 0 ? anchored : nodes;
    const parent = pool[Math.floor(Math.random() * pool.length)];
    const parentIdx = nodes.indexOf(parent);

    for (let attempt = 0; attempt < 8; attempt++) {
      const angle = Math.random() * Math.PI * 2;
      const dist = 80 + Math.random() * 60;
      const nx = parent.x + Math.cos(angle) * dist;
      const ny = parent.y + Math.sin(angle) * dist;

      // Must be within spawn bounds (with some overflow allowed)
      const overflow = 60;
      if (nx < bounds.left - overflow || nx > bounds.right + overflow) continue;
      if (ny < bounds.top - overflow || ny > bounds.bottom + overflow) continue;

      // Check distance from existing nodes
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

      const newIdx = nodes.length;
      nodes.push({
        x: nx, y: ny,
        vx: (Math.random() - 0.5) * 0.4,
        vy: (Math.random() - 0.5) * 0.4,
        radius: BASE_RADIUS,
        connections: 0,
        opacity: 0,
        age: 0,
        anchorAge: ANCHOR_AGE_MIN + Math.random() * (ANCHOR_AGE_MAX - ANCHOR_AGE_MIN),
        anchored: false,
        pruning: false,
        pruneProgress: 0,
      });

      // Connect to parent
      edges.push({ a: parentIdx, b: newIdx, age: 0 });
      parent.connections++;
      nodes[newIdx].connections++;

      // Connect to one nearby node
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
      return;
    }
  }

  function simulate() {
    const w = canvas.clientWidth;
    const h = canvas.clientHeight;
    const bounds = getSpawnBounds(w, h);

    // Repulsion
    for (let i = 0; i < nodes.length; i++) {
      for (let j = i + 1; j < nodes.length; j++) {
        const a = nodes[i], b = nodes[j];
        if (a.anchored && b.anchored) continue;
        let dx = b.x - a.x, dy = b.y - a.y;
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

    // Link springs
    for (const edge of edges) {
      const a = nodes[edge.a], b = nodes[edge.b];
      if (!a || !b || (a.anchored && b.anchored)) continue;
      const dx = b.x - a.x, dy = b.y - a.y;
      const dist = Math.sqrt(dx * dx + dy * dy) || 1;
      const f = (dist - LINK_REST) * LINK_STRENGTH;
      const fx = (dx / dist) * f;
      const fy = (dy / dist) * f;
      if (!a.anchored) { a.vx += fx; a.vy += fy; }
      if (!b.anchored) { b.vx -= fx; b.vy -= fy; }
    }

    // Integration
    for (const node of nodes) {
      node.age++;
      node.opacity = Math.min(node.age / FADE_IN, 1.0);
      node.radius = Math.min(BASE_RADIUS + node.connections * HUB_BONUS, MAX_RADIUS);

      if (!node.anchored && node.age >= node.anchorAge) {
        node.anchored = true;
        node.vx = 0;
        node.vy = 0;
        continue;
      }
      if (node.anchored) continue;

      // Fly-up force: nodes below the hero zone get pulled back up
      if (node.y > bounds.bottom) {
        node.vy -= FLY_UP_STRENGTH;
      }
      // Gentle pull toward spawn zone center if node drifts too far
      if (node.x < bounds.left - 40) node.vx += 0.05;
      if (node.x > bounds.right + 40) node.vx -= 0.05;
      if (node.y < bounds.top - 40) node.vy += 0.05;

      node.vx *= DAMPING;
      node.vy *= DAMPING;
      node.x += node.vx;
      node.y += node.vy;

      // Bounce off canvas edges
      const margin = 20;
      if (node.x < margin) { node.x = margin; node.vx = Math.abs(node.vx) * 0.5; }
      if (node.x > w - margin) { node.x = w - margin; node.vx = -Math.abs(node.vx) * 0.5; }
      if (node.y < margin) { node.y = margin; node.vy = Math.abs(node.vy) * 0.5; }
      if (node.y > h - margin) { node.y = h - margin; node.vy = -Math.abs(node.vy) * 0.5; }
    }

    // Collision
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

    // ── Pruning: refine the structure over time ───────────
    // Mark overcrowded or overconnected anchored nodes for removal
    if (frame % PRUNE_CHECK_INTERVAL === 0 && nodes.length > 15) {
      for (let i = 0; i < nodes.length; i++) {
        const node = nodes[i];
        if (!node.anchored || node.pruning) continue;

        let shouldPrune = false;

        // Overconnected: too many edges — redundant hub
        if (node.connections > PRUNE_OVERCONNECTED && Math.random() < 0.3) {
          shouldPrune = true;
        }

        // Overcrowded: another anchored node too close
        if (!shouldPrune) {
          for (let j = 0; j < nodes.length; j++) {
            if (i === j || !nodes[j].anchored || nodes[j].pruning) continue;
            const dx = node.x - nodes[j].x;
            const dy = node.y - nodes[j].y;
            if (dx * dx + dy * dy < PRUNE_OVERCROWDED_DIST * PRUNE_OVERCROWDED_DIST) {
              // Prune the one with fewer connections (keep the stronger node)
              if (node.connections <= nodes[j].connections && Math.random() < 0.25) {
                shouldPrune = true;
                break;
              }
            }
          }
        }

        if (shouldPrune) {
          node.pruning = true;
        }
      }
    }

    // Advance prune fade-out and remove dead nodes
    for (let i = nodes.length - 1; i >= 0; i--) {
      const node = nodes[i];
      if (!node.pruning) continue;

      node.pruneProgress += PRUNE_FADE_SPEED;

      if (node.pruneProgress >= 1) {
        // Remove all edges referencing this node
        for (let e = edges.length - 1; e >= 0; e--) {
          if (edges[e].a === i || edges[e].b === i) {
            // Decrement connection count on the other node
            const otherIdx = edges[e].a === i ? edges[e].b : edges[e].a;
            if (nodes[otherIdx]) nodes[otherIdx].connections--;
            edges.splice(e, 1);
          }
        }
        nodes.splice(i, 1);
        // Reindex edges (indices shifted)
        for (const edge of edges) {
          if (edge.a > i) edge.a--;
          if (edge.b > i) edge.b--;
        }
      }
    }
  }

  function render(now: number) {
    frame++;
    const w = canvas.clientWidth;
    const h = canvas.clientHeight;
    const bounds = getSpawnBounds(w, h);
    const time = now * PULSE_SPEED;

    ctx.clearRect(0, 0, w, h);

    if (frame % SPAWN_INTERVAL === 0 && nodes.length > 0) spawn();
    simulate();

    // Edges
    for (let i = 0; i < edges.length; i++) {
      const edge = edges[i];
      const a = nodes[edge.a], b = nodes[edge.b];
      if (!a || !b) continue;

      // Fade edges connected to pruning nodes
      const pruneMax = Math.max(a.pruning ? a.pruneProgress : 0, b.pruning ? b.pruneProgress : 0);
      const fadeMult = 1 - pruneMax;
      const alpha = Math.min(a.opacity, b.opacity) * EDGE_ALPHA * fadeMult;
      if (alpha < 0.005) continue;

      let [cr, cg, cb] = nodeColor(a, bounds);
      const [cr2, cg2, cb2] = nodeColor(b, bounds);
      let mr = (cr + cr2) >> 1;
      let mg = (cg + cg2) >> 1;
      let mb = (cb + cb2) >> 1;

      // Shift edge toward red if connected to a pruning node
      if (pruneMax > 0) {
        mr = Math.round(mr + (200 - mr) * pruneMax);
        mg = Math.round(mg * (1 - pruneMax * 0.7));
        mb = Math.round(mb * (1 - pruneMax * 0.5));
      }

      ctx.beginPath();
      ctx.moveTo(a.x, a.y);
      ctx.lineTo(b.x, b.y);
      ctx.strokeStyle = `rgba(${mr}, ${mg}, ${mb}, ${alpha})`;
      ctx.lineWidth = EDGE_WIDTH;
      ctx.stroke();

      // Signal pulse on anchored edges (not pruning)
      if (edge.age > 40 && a.anchored && b.anchored && !a.pruning && !b.pruning) {
        const pt = (time * 0.5 + i * 0.2) % 1;
        ctx.beginPath();
        ctx.arc(a.x + (b.x - a.x) * pt, a.y + (b.y - a.y) * pt, 1.2, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(232, 232, 240, ${alpha * 2.5})`;
        ctx.fill();
      }
    }

    // Nodes
    for (let i = 0; i < nodes.length; i++) {
      const node = nodes[i];
      if (node.opacity < 0.01) continue;

      // Color: shift toward red when pruning
      let [cr, cg, cb] = nodeColor(node, bounds);
      const fadeAlpha = node.pruning ? (1 - node.pruneProgress) : 1;
      if (node.pruning) {
        const p = node.pruneProgress;
        cr = Math.round(cr + (220 - cr) * p);  // shift red up
        cg = Math.round(cg * (1 - p * 0.8));   // drop green
        cb = Math.round(cb * (1 - p * 0.6));    // drop blue
      }

      const pulse = Math.sin(time * 1.5 + i * 0.8) * 0.1 + 0.9;
      const r = node.radius * pulse * (node.pruning ? (1 - node.pruneProgress * 0.3) : 1);

      // Glow
      const glowA = node.anchored ? 0.14 : 0.08;
      const glowR = r * GLOW_MULT;
      const grad = ctx.createRadialGradient(node.x, node.y, 0, node.x, node.y, glowR);
      grad.addColorStop(0, `rgba(${cr}, ${cg}, ${cb}, ${node.opacity * glowA * fadeAlpha})`);
      grad.addColorStop(0.5, `rgba(${cr}, ${cg}, ${cb}, ${node.opacity * 0.02 * fadeAlpha})`);
      grad.addColorStop(1, `rgba(${cr}, ${cg}, ${cb}, 0)`);
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(node.x, node.y, glowR, 0, Math.PI * 2);
      ctx.fill();

      // Outer ring
      ctx.beginPath();
      ctx.arc(node.x, node.y, r, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(${cr}, ${cg}, ${cb}, ${node.opacity * (node.anchored ? 0.65 : 0.4) * fadeAlpha})`;
      ctx.fill();

      // Core
      const coreWhite = node.pruning ? `rgba(${cr}, ${cg}, ${cb}, ${node.opacity * 0.6 * fadeAlpha})` : `rgba(232, 232, 240, ${node.opacity * 0.8})`;
      ctx.beginPath();
      ctx.arc(node.x, node.y, r * 0.35, 0, Math.PI * 2);
      ctx.fillStyle = coreWhite;
      ctx.fill();
    }

    animationId = requestAnimationFrame(render);
  }

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
