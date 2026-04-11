// force-graph.ts — D3-style force-directed graph that grows from observation
// Nodes spawn where the mouse explores. Forces self-organize them into clusters.
// The graph IS the insight emerging from chaos.

// ── Types ───────────────────────────────────────────────────

interface Node {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  group: number;
  age: number;
  opacity: number;
  // Fixed position during drag (not used yet, but ready)
  fx: number | null;
  fy: number | null;
}

interface Edge {
  source: number;
  target: number;
  strength: number;
  age: number;
}

// ── Palette (violet/blue spectrum, 6 groups) ────────────────

const GROUP_COLORS = [
  [167, 139, 250],  // #a78bfa violet
  [56, 189, 248],   // #38bdf8 sky blue
  [129, 140, 248],  // #818cf8 indigo
  [196, 181, 253],  // #c4b5fd light violet
  [99, 102, 241],   // #6366f1 deep indigo
  [125, 211, 252],  // #7dd3fc light blue
];

// ── Configuration ───────────────────────────────────────────

const CONFIG = {
  // Spawning
  spawnInterval: 40,       // frames between node spawns (while mouse moving)
  minSpawnDist: 45,        // min px between new node and existing nodes
  maxNodes: 90,
  connectRadius: 160,      // max px to create an edge to existing node
  maxEdgesPerSpawn: 3,     // edges created per new node

  // Forces
  repulsionStrength: 250,  // many-body repulsion constant
  linkStrength: 0.04,      // spring stiffness
  linkRestLength: 90,      // natural spring length
  centerStrength: 0.001,   // pull toward center
  collisionPadding: 4,     // extra space between nodes
  damping: 0.92,           // velocity decay per frame

  // Visuals
  nodeRadiusMin: 3,
  nodeRadiusMax: 7,
  edgeOpacity: 0.25,
  edgeWidth: 0.8,
  glowRadius: 20,
  pulseSpeed: 0.015,
  fadeInDuration: 60,      // frames to fade in a new node
};

// ── Force Graph ─────────────────────────────────────────────

export function initForceGraph(canvas: HTMLCanvasElement): {
  getNodeCount: () => number;
  destroy: () => void;
} {
  const ctx = canvas.getContext('2d')!;
  const nodes: Node[] = [];
  const edges: Edge[] = [];

  let mouseX = -1;
  let mouseY = -1;
  let prevMouseX = -1;
  let prevMouseY = -1;
  let frameCount = 0;
  let animationId = 0;
  let groupCounter = 0;

  function resize() {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = window.innerWidth * dpr;
    canvas.height = window.innerHeight * dpr;
    canvas.style.width = window.innerWidth + 'px';
    canvas.style.height = window.innerHeight + 'px';
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  // ── Node spawning ───────────────────────────────────────

  function trySpawnNode() {
    if (mouseX < 0 || mouseY < 0) return;
    if (nodes.length >= CONFIG.maxNodes) return;

    // Only spawn if mouse has moved enough (not sitting still)
    const mouseDx = mouseX - prevMouseX;
    const mouseDy = mouseY - prevMouseY;
    const mouseSpeed = Math.sqrt(mouseDx * mouseDx + mouseDy * mouseDy);
    if (mouseSpeed < 2) return;

    // Check minimum distance to all existing nodes
    for (const n of nodes) {
      const dx = n.x - mouseX;
      const dy = n.y - mouseY;
      if (Math.sqrt(dx * dx + dy * dy) < CONFIG.minSpawnDist) return;
    }

    // Determine group based on screen region + some randomness
    const regionX = Math.floor((mouseX / window.innerWidth) * 3);
    const regionY = Math.floor((mouseY / window.innerHeight) * 2);
    const region = regionY * 3 + regionX;
    const group = region % GROUP_COLORS.length;

    const newNode: Node = {
      x: mouseX,
      y: mouseY,
      vx: (Math.random() - 0.5) * 2,
      vy: (Math.random() - 0.5) * 2,
      radius: CONFIG.nodeRadiusMin + Math.random() * (CONFIG.nodeRadiusMax - CONFIG.nodeRadiusMin),
      group,
      age: 0,
      opacity: 0,
      fx: null,
      fy: null,
    };

    const nodeIndex = nodes.length;
    nodes.push(newNode);

    // Connect to nearest existing nodes
    const distances: { idx: number; dist: number }[] = [];
    for (let i = 0; i < nodes.length - 1; i++) {
      const dx = nodes[i].x - mouseX;
      const dy = nodes[i].y - mouseY;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < CONFIG.connectRadius) {
        distances.push({ idx: i, dist });
      }
    }

    distances.sort((a, b) => a.dist - b.dist);
    const edgeCount = Math.min(distances.length, CONFIG.maxEdgesPerSpawn);

    for (let e = 0; e < edgeCount; e++) {
      edges.push({
        source: nodeIndex,
        target: distances[e].idx,
        strength: 1 - distances[e].dist / CONFIG.connectRadius,
        age: 0,
      });
    }

    groupCounter++;
  }

  // ── Force simulation ────────────────────────────────────

  function simulate() {
    const w = window.innerWidth;
    const h = window.innerHeight;
    const cx = w / 2;
    const cy = h / 2;

    // Reset accelerations (applied as velocity changes)
    for (const node of nodes) {
      if (node.fx !== null) { node.x = node.fx; node.vx = 0; }
      if (node.fy !== null) { node.y = node.fy; node.vy = 0; }
    }

    // Many-body repulsion (O(n²) — fine for <100 nodes)
    for (let i = 0; i < nodes.length; i++) {
      for (let j = i + 1; j < nodes.length; j++) {
        const a = nodes[i];
        const b = nodes[j];
        let dx = b.x - a.x;
        let dy = b.y - a.y;
        let distSq = dx * dx + dy * dy;
        if (distSq < 1) distSq = 1; // prevent division by zero
        const dist = Math.sqrt(distSq);

        const force = -CONFIG.repulsionStrength / distSq;
        const fx = (dx / dist) * force;
        const fy = (dy / dist) * force;

        if (a.fx === null) { a.vx -= fx; a.vy -= fy; }
        if (b.fx === null) { b.vx += fx; b.vy += fy; }
      }
    }

    // Link spring forces
    for (const edge of edges) {
      const a = nodes[edge.source];
      const b = nodes[edge.target];
      if (!a || !b) continue;

      const dx = b.x - a.x;
      const dy = b.y - a.y;
      const dist = Math.sqrt(dx * dx + dy * dy) || 1;

      const displacement = dist - CONFIG.linkRestLength;
      const force = displacement * CONFIG.linkStrength * edge.strength;
      const fx = (dx / dist) * force;
      const fy = (dy / dist) * force;

      if (a.fx === null) { a.vx += fx; a.vy += fy; }
      if (b.fx === null) { b.vx -= fx; b.vy -= fy; }
    }

    // Center positioning force + collision + integration
    for (const node of nodes) {
      if (node.fx !== null && node.fy !== null) continue;

      // Gentle centering
      node.vx += (cx - node.x) * CONFIG.centerStrength;
      node.vy += (cy - node.y) * CONFIG.centerStrength;

      // Damping
      node.vx *= CONFIG.damping;
      node.vy *= CONFIG.damping;

      // Integration
      node.x += node.vx;
      node.y += node.vy;

      // Soft boundary (bounce off edges)
      const margin = 30;
      if (node.x < margin) { node.x = margin; node.vx *= -0.5; }
      if (node.x > w - margin) { node.x = w - margin; node.vx *= -0.5; }
      if (node.y < margin) { node.y = margin; node.vy *= -0.5; }
      if (node.y > h - margin) { node.y = h - margin; node.vy *= -0.5; }

      // Age and fade-in
      node.age++;
      node.opacity = Math.min(node.age / CONFIG.fadeInDuration, 1.0);
    }

    // Collision detection (simple pairwise)
    for (let i = 0; i < nodes.length; i++) {
      for (let j = i + 1; j < nodes.length; j++) {
        const a = nodes[i];
        const b = nodes[j];
        const dx = b.x - a.x;
        const dy = b.y - a.y;
        const dist = Math.sqrt(dx * dx + dy * dy) || 1;
        const minDist = a.radius + b.radius + CONFIG.collisionPadding;

        if (dist < minDist) {
          const overlap = (minDist - dist) * 0.5;
          const nx = dx / dist;
          const ny = dy / dist;
          if (a.fx === null) { a.x -= nx * overlap; a.y -= ny * overlap; }
          if (b.fx === null) { b.x += nx * overlap; b.y += ny * overlap; }
        }
      }
    }

    // Age edges
    for (const edge of edges) {
      edge.age++;
    }
  }

  // ── Rendering ─────────────────────────────────────────────

  function render() {
    const w = window.innerWidth;
    const h = window.innerHeight;

    ctx.clearRect(0, 0, w, h);

    if (nodes.length === 0) return;

    const time = frameCount * CONFIG.pulseSpeed;

    // Draw edges
    for (const edge of edges) {
      const a = nodes[edge.source];
      const b = nodes[edge.target];
      if (!a || !b) continue;

      const alpha = Math.min(a.opacity, b.opacity) * CONFIG.edgeOpacity * edge.strength;
      if (alpha < 0.005) continue;

      // Edge color: blend between source and target group colors
      const ca = GROUP_COLORS[a.group % GROUP_COLORS.length];
      const cb = GROUP_COLORS[b.group % GROUP_COLORS.length];
      const r = Math.round((ca[0] + cb[0]) / 2);
      const g = Math.round((ca[1] + cb[1]) / 2);
      const bl = Math.round((ca[2] + cb[2]) / 2);

      ctx.beginPath();
      ctx.moveTo(a.x, a.y);
      ctx.lineTo(b.x, b.y);
      ctx.strokeStyle = `rgba(${r}, ${g}, ${bl}, ${alpha})`;
      ctx.lineWidth = CONFIG.edgeWidth;
      ctx.stroke();

      // Pulse traveling along edge (for established edges)
      if (edge.age > 60 && edge.strength > 0.3) {
        const pulseT = (time + edge.source * 0.3) % 1;
        const px = a.x + (b.x - a.x) * pulseT;
        const py = a.y + (b.y - a.y) * pulseT;
        ctx.beginPath();
        ctx.arc(px, py, 1.2, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${r}, ${g}, ${bl}, ${alpha * 2})`;
        ctx.fill();
      }
    }

    // Draw nodes
    for (let i = 0; i < nodes.length; i++) {
      const node = nodes[i];
      if (node.opacity < 0.01) continue;

      const [cr, cg, cb] = GROUP_COLORS[node.group % GROUP_COLORS.length];
      const pulse = Math.sin(time * 1.8 + i * 0.7) * 0.15 + 0.85;
      const r = node.radius * pulse;

      // Glow
      const grad = ctx.createRadialGradient(node.x, node.y, 0, node.x, node.y, r * 5);
      grad.addColorStop(0, `rgba(${cr}, ${cg}, ${cb}, ${node.opacity * 0.1})`);
      grad.addColorStop(1, `rgba(${cr}, ${cg}, ${cb}, 0)`);
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(node.x, node.y, r * 5, 0, Math.PI * 2);
      ctx.fill();

      // Outer ring
      ctx.beginPath();
      ctx.arc(node.x, node.y, r, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(${cr}, ${cg}, ${cb}, ${node.opacity * 0.5})`;
      ctx.fill();

      // Inner bright core
      ctx.beginPath();
      ctx.arc(node.x, node.y, r * 0.45, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(232, 232, 240, ${node.opacity * 0.7})`;
      ctx.fill();
    }
  }

  // ── Main loop ─────────────────────────────────────────────

  function tick() {
    frameCount++;

    // Spawn nodes from mouse movement
    if (frameCount % CONFIG.spawnInterval === 0) {
      trySpawnNode();
    }

    prevMouseX = mouseX;
    prevMouseY = mouseY;

    simulate();
    render();
    animationId = requestAnimationFrame(tick);
  }

  // ── Events ────────────────────────────────────────────────

  window.addEventListener('mousemove', (e) => {
    mouseX = e.clientX;
    mouseY = e.clientY;
  });

  window.addEventListener('mouseleave', () => {
    mouseX = -1;
    mouseY = -1;
  });

  window.addEventListener('resize', () => {
    resize();
  });

  // ── Init ──────────────────────────────────────────────────

  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    return { getNodeCount: () => 0, destroy: () => {} };
  }

  resize();
  animationId = requestAnimationFrame(tick);

  return {
    getNodeCount: () => nodes.length,
    destroy: () => cancelAnimationFrame(animationId),
  };
}
