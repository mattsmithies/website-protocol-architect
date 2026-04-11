// force-graph.ts — Structured knowledge graph
// A living tree of concepts that grows from the left side of the viewport.
// Each node represents a real architectural concept. Growth is time-driven.
// Gentle forces keep it breathing but layout is intentional, not chaotic.

// ── Knowledge Tree Data ─────────────────────────────────────

interface TreeNode {
  id: string;
  label: string;
  children?: TreeNode[];
}

const KNOWLEDGE_TREE: TreeNode = {
  id: 'root', label: 'Systems Architecture',
  children: [
    {
      id: 'trust', label: 'Trust',
      children: [
        { id: 'provenance', label: 'Provenance' },
        { id: 'audit', label: 'Audit Trail' },
        { id: 'verification', label: 'Verification' },
      ],
    },
    {
      id: 'workflow', label: 'Workflow',
      children: [
        { id: 'state', label: 'State' },
        { id: 'evidence', label: 'Evidence' },
        { id: 'replay', label: 'Replayability' },
      ],
    },
    {
      id: 'authority', label: 'Authority',
      children: [
        { id: 'roles', label: 'Roles' },
        { id: 'permissions', label: 'Permissions' },
        { id: 'temporal', label: 'Time-bound' },
      ],
    },
    {
      id: 'token', label: 'Token Economy',
      children: [
        { id: 'flywheel', label: 'Flywheels' },
        { id: 'sinks', label: 'Demand Sinks' },
        { id: 'issuance', label: 'Issuance' },
      ],
    },
    {
      id: 'protocol', label: 'Protocol',
      children: [
        { id: 'primitives', label: 'Primitives' },
        { id: 'coordination', label: 'Coordination' },
        { id: 'boundaries', label: 'Boundaries' },
      ],
    },
    {
      id: 'incentives', label: 'Incentives',
      children: [
        { id: 'mechanism', label: 'Mechanism' },
        { id: 'alignment', label: 'Alignment' },
        { id: 'behaviour', label: 'Behaviour' },
      ],
    },
  ],
};

// ── Layout Node (computed from tree) ────────────────────────

interface LayoutNode {
  id: string;
  label: string;
  targetX: number;
  targetY: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  depth: number;
  parentIndex: number | null;
  revealOrder: number;
  opacity: number;
  scale: number;
  group: number;
}

interface LayoutEdge {
  source: number;
  target: number;
  progress: number; // 0 = invisible, 1 = fully drawn
}

// ── Palette ─────────────────────────────────────────────────

const DEPTH_COLORS = [
  [167, 139, 250],  // depth 0: violet (root)
  [129, 140, 248],  // depth 1: indigo (branches)
  [56, 189, 248],   // depth 2: sky blue (leaves)
];

// ── Configuration ───────────────────────────────────────────

const CFG = {
  // Layout
  startX: 70,               // root X position (left-anchored)
  levelSpacing: 180,         // horizontal space between depths
  siblingSpacing: 58,        // vertical space between siblings
  groupSpacing: 20,          // extra vertical gap between branch groups

  // Reveal timing
  revealInterval: 800,       // ms between node reveals
  edgeDrawSpeed: 0.04,       // progress per frame (edge draw animation)

  // Forces (gentle — for breathing, not layout)
  breathAmplitude: 3,        // max px of micro-movement
  breathSpeed: 0.0008,       // oscillation speed

  // Visuals
  rootRadius: 6,
  branchRadius: 4.5,
  leafRadius: 3,
  edgeWidth: 0.8,
  edgeCurve: 0.4,            // bezier curve strength
  labelSize: 10,
  labelOffset: 14,
  glowSize: 18,
  pulseSpeed: 0.002,
};

// ── Build flat layout from tree ─────────────────────────────

function buildLayout(): { nodes: LayoutNode[]; edges: LayoutEdge[] } {
  const nodes: LayoutNode[] = [];
  const edges: LayoutEdge[] = [];
  let revealCounter = 0;

  function traverse(
    tree: TreeNode,
    depth: number,
    parentIndex: number | null,
    groupIndex: number,
    yOffset: number,
    ySlot: number,
    totalSiblings: number,
  ) {
    const nodeIndex = nodes.length;

    const radius = depth === 0 ? CFG.rootRadius
      : depth === 1 ? CFG.branchRadius
      : CFG.leafRadius;

    const x = CFG.startX + depth * CFG.levelSpacing;
    const y = yOffset + ySlot * CFG.siblingSpacing;

    nodes.push({
      id: tree.id,
      label: tree.label,
      targetX: x,
      targetY: y,
      x: x - 30, // start slightly left (for entrance animation)
      y,
      vx: 0,
      vy: 0,
      radius,
      depth,
      parentIndex,
      revealOrder: revealCounter++,
      opacity: 0,
      scale: 0,
      group: groupIndex,
    });

    if (parentIndex !== null) {
      edges.push({
        source: parentIndex,
        target: nodeIndex,
        progress: 0,
      });
    }

    if (tree.children) {
      const childCount = tree.children.length;
      const childBlockHeight = (childCount - 1) * CFG.siblingSpacing;
      const childYStart = y - childBlockHeight / 2;

      tree.children.forEach((child, i) => {
        traverse(child, depth + 1, nodeIndex, depth === 0 ? i : groupIndex, childYStart, i, childCount);
      });
    }
  }

  // Calculate total vertical extent for centering
  const branchCount = KNOWLEDGE_TREE.children?.length || 0;
  const leavesPerBranch = 3;
  const branchBlockHeight = (leavesPerBranch - 1) * CFG.siblingSpacing;
  const totalHeight = (branchCount - 1) * (branchBlockHeight + CFG.groupSpacing + CFG.siblingSpacing);

  traverse(KNOWLEDGE_TREE, 0, null, 0, 0, 0, 1);

  // Center everything vertically in viewport
  const minY = Math.min(...nodes.map(n => n.targetY));
  const maxY = Math.max(...nodes.map(n => n.targetY));
  const centerOffset = (window.innerHeight / 2) - (minY + maxY) / 2;

  for (const node of nodes) {
    node.targetY += centerOffset;
    node.y = node.targetY;
  }

  return { nodes, edges };
}

// ── Main ────────────────────────────────────────────────────

export function initForceGraph(canvas: HTMLCanvasElement): {
  getNodeCount: () => number;
  destroy: () => void;
} {
  const ctx = canvas.getContext('2d')!;
  let animationId = 0;
  let startTime = 0;
  let frameCount = 0;

  const { nodes, edges } = buildLayout();

  function resize() {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = window.innerWidth * dpr;
    canvas.height = window.innerHeight * dpr;
    canvas.style.width = window.innerWidth + 'px';
    canvas.style.height = window.innerHeight + 'px';
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    // Recenter vertically on resize
    const minY = Math.min(...nodes.map(n => n.targetY));
    const maxY = Math.max(...nodes.map(n => n.targetY));
    const currentCenter = (minY + maxY) / 2;
    const desiredCenter = window.innerHeight / 2;
    const shift = desiredCenter - currentCenter;
    for (const node of nodes) {
      node.targetY += shift;
      node.y += shift;
    }
  }

  function render(now: number) {
    if (startTime === 0) startTime = now;
    const elapsed = now - startTime;
    frameCount++;

    const w = window.innerWidth;
    const h = window.innerHeight;
    ctx.clearRect(0, 0, w, h);

    const time = now * CFG.pulseSpeed;

    // ── Reveal nodes progressively ────────────────────────
    for (const node of nodes) {
      const revealTime = node.revealOrder * CFG.revealInterval;
      if (elapsed < revealTime) continue;

      const revealProgress = Math.min((elapsed - revealTime) / 600, 1); // 600ms fade-in
      const ease = 1 - Math.pow(1 - revealProgress, 3); // cubic ease-out

      node.opacity = ease;
      node.scale = ease;

      // Gentle breathing (micro-movement around target)
      const breathX = Math.sin(now * CFG.breathSpeed + node.revealOrder * 1.3) * CFG.breathAmplitude;
      const breathY = Math.cos(now * CFG.breathSpeed * 0.7 + node.revealOrder * 0.9) * CFG.breathAmplitude * 0.6;

      // Ease toward target position (entrance slide)
      node.x += (node.targetX + breathX - node.x) * 0.08;
      node.y += (node.targetY + breathY - node.y) * 0.08;
    }

    // ── Draw edges ────────────────────────────────────────
    for (const edge of edges) {
      const source = nodes[edge.source];
      const target = nodes[edge.target];
      if (!source || !target) continue;
      if (target.opacity < 0.01) continue;

      // Edge draws in after target node starts revealing
      edge.progress = Math.min(edge.progress + CFG.edgeDrawSpeed, target.opacity);
      if (edge.progress < 0.01) continue;

      const alpha = Math.min(source.opacity, target.opacity) * 0.3 * edge.progress;
      const [cr, cg, cb] = DEPTH_COLORS[Math.min(target.depth, DEPTH_COLORS.length - 1)];

      // Curved bezier edge (horizontal bias)
      const midX = source.x + (target.x - source.x) * CFG.edgeCurve;

      ctx.beginPath();
      ctx.moveTo(source.x, source.y);
      ctx.bezierCurveTo(midX, source.y, midX, target.y, target.x, target.y);
      ctx.strokeStyle = `rgba(${cr}, ${cg}, ${cb}, ${alpha})`;
      ctx.lineWidth = CFG.edgeWidth;
      ctx.stroke();

      // Signal pulse along edge (for fully revealed edges)
      if (edge.progress > 0.9 && source.opacity > 0.9) {
        const pulseT = ((now * 0.0003 + edge.source * 0.2) % 1);
        // Approximate point along bezier
        const t = pulseT;
        const t2 = t * t;
        const t3 = t2 * t;
        const mt = 1 - t;
        const mt2 = mt * mt;
        const mt3 = mt2 * mt;
        // Simplified cubic bezier with 4 control points
        const px = mt3 * source.x + 3 * mt2 * t * midX + 3 * mt * t2 * midX + t3 * target.x;
        const py = mt3 * source.y + 3 * mt2 * t * source.y + 3 * mt * t2 * target.y + t3 * target.y;

        ctx.beginPath();
        ctx.arc(px, py, 1.2, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${cr}, ${cg}, ${cb}, ${alpha * 2.5})`;
        ctx.fill();
      }
    }

    // ── Draw nodes ────────────────────────────────────────
    for (let i = 0; i < nodes.length; i++) {
      const node = nodes[i];
      if (node.opacity < 0.01) continue;

      const [cr, cg, cb] = DEPTH_COLORS[Math.min(node.depth, DEPTH_COLORS.length - 1)];
      const r = node.radius * node.scale;
      const pulse = Math.sin(time + i * 1.1) * 0.12 + 0.88;
      const pr = r * pulse;

      // Glow
      const grad = ctx.createRadialGradient(node.x, node.y, 0, node.x, node.y, CFG.glowSize * node.scale);
      grad.addColorStop(0, `rgba(${cr}, ${cg}, ${cb}, ${node.opacity * 0.12})`);
      grad.addColorStop(1, `rgba(${cr}, ${cg}, ${cb}, 0)`);
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(node.x, node.y, CFG.glowSize * node.scale, 0, Math.PI * 2);
      ctx.fill();

      // Outer ring
      ctx.beginPath();
      ctx.arc(node.x, node.y, pr, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(${cr}, ${cg}, ${cb}, ${node.opacity * 0.6})`;
      ctx.fill();

      // Bright core
      ctx.beginPath();
      ctx.arc(node.x, node.y, pr * 0.4, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(232, 232, 240, ${node.opacity * 0.8})`;
      ctx.fill();

      // Label (only for depth 0 and 1)
      if (node.depth <= 1 && node.opacity > 0.3) {
        ctx.font = `${CFG.labelSize * (node.depth === 0 ? 1.2 : 1)}px 'Space Grotesk', system-ui, sans-serif`;
        ctx.fillStyle = `rgba(232, 232, 240, ${node.opacity * (node.depth === 0 ? 0.6 : 0.35)})`;
        ctx.textAlign = node.depth === 0 ? 'center' : 'left';
        ctx.textBaseline = 'middle';

        const labelX = node.depth === 0 ? node.x : node.x + node.radius + 8;
        const labelY = node.depth === 0 ? node.y + node.radius + CFG.labelOffset : node.y;

        ctx.fillText(node.label, labelX, labelY);
      }
    }

    animationId = requestAnimationFrame(render);
  }

  // ── Init ──────────────────────────────────────────────────

  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    // Show final state immediately
    for (const node of nodes) {
      node.opacity = 1;
      node.scale = 1;
      node.x = node.targetX;
      node.y = node.targetY;
    }
    for (const edge of edges) {
      edge.progress = 1;
    }
    resize();
    render(20000); // fake elapsed time
    return { getNodeCount: () => nodes.length, destroy: () => {} };
  }

  window.addEventListener('resize', resize);
  resize();
  animationId = requestAnimationFrame(render);

  return {
    getNodeCount: () => nodes.filter(n => n.opacity > 0.01).length,
    destroy: () => cancelAnimationFrame(animationId),
  };
}
