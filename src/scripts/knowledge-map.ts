// knowledge-map.ts — Persistent observation memory
// Tracks where the mouse has been. Builds a cumulative "knowledge" buffer.
// The buffer is uploaded as a WebGL texture so the shader can read it.
// Also tracks observation peaks for the network graph overlay.

const GRID_SIZE = 128;
const STAMP_RADIUS = 8;       // cells affected per frame around the mouse
const STAMP_STRENGTH = 0.012; // how fast knowledge builds (per frame)
const DECAY_RATE = 0.99992;   // very slow fade (knowledge is mostly permanent)
const DIFFUSION = 0.003;      // how much knowledge spreads to neighbors

export interface KnowledgeMapState {
  getTextureData: () => Uint8Array;
  getNodes: () => { x: number; y: number; strength: number }[];
  update: (mouseX: number, mouseY: number, screenW: number, screenH: number) => void;
  getGridSize: () => number;
}

export function createKnowledgeMap(): KnowledgeMapState {
  // Two buffers for ping-pong diffusion
  let current = new Float32Array(GRID_SIZE * GRID_SIZE);
  let next = new Float32Array(GRID_SIZE * GRID_SIZE);
  const textureData = new Uint8Array(GRID_SIZE * GRID_SIZE * 4); // RGBA

  // Tracked observation peaks (become network nodes)
  let nodes: { x: number; y: number; strength: number; age: number }[] = [];
  let frameCount = 0;

  function idx(gx: number, gy: number): number {
    return gy * GRID_SIZE + gx;
  }

  function update(mouseX: number, mouseY: number, screenW: number, screenH: number) {
    frameCount++;

    // Convert mouse screen coords to grid coords
    const gridX = Math.floor((mouseX / screenW) * GRID_SIZE);
    const gridY = Math.floor((1 - mouseY / screenH) * GRID_SIZE); // flip Y

    // Stamp knowledge at mouse position (gaussian-ish falloff)
    if (mouseX > 0 && mouseY > 0 && mouseX < screenW && mouseY < screenH) {
      for (let dy = -STAMP_RADIUS; dy <= STAMP_RADIUS; dy++) {
        for (let dx = -STAMP_RADIUS; dx <= STAMP_RADIUS; dx++) {
          const gx = gridX + dx;
          const gy = gridY + dy;
          if (gx < 0 || gx >= GRID_SIZE || gy < 0 || gy >= GRID_SIZE) continue;

          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist > STAMP_RADIUS) continue;

          const falloff = 1 - dist / STAMP_RADIUS;
          const strength = STAMP_STRENGTH * falloff * falloff; // quadratic falloff
          const i = idx(gx, gy);
          current[i] = Math.min(current[i] + strength, 1.0);
        }
      }
    }

    // Diffusion + decay pass
    for (let gy = 0; gy < GRID_SIZE; gy++) {
      for (let gx = 0; gx < GRID_SIZE; gx++) {
        const i = idx(gx, gy);
        let val = current[i] * DECAY_RATE;

        // Diffusion: average with neighbors
        let neighborSum = 0;
        let neighborCount = 0;
        if (gx > 0) { neighborSum += current[idx(gx - 1, gy)]; neighborCount++; }
        if (gx < GRID_SIZE - 1) { neighborSum += current[idx(gx + 1, gy)]; neighborCount++; }
        if (gy > 0) { neighborSum += current[idx(gx, gy - 1)]; neighborCount++; }
        if (gy < GRID_SIZE - 1) { neighborSum += current[idx(gx, gy + 1)]; neighborCount++; }

        const neighborAvg = neighborSum / neighborCount;
        val = val + (neighborAvg - val) * DIFFUSION;

        next[i] = Math.min(val, 1.0);
      }
    }

    // Swap buffers
    const temp = current;
    current = next;
    next = temp;

    // Pack into RGBA texture (knowledge in R channel, node hints in G)
    for (let i = 0; i < GRID_SIZE * GRID_SIZE; i++) {
      const v = Math.floor(current[i] * 255);
      const ti = i * 4;
      textureData[ti] = v;     // R: knowledge level
      textureData[ti + 1] = v; // G: same (for easier shader access)
      textureData[ti + 2] = v; // B: same
      textureData[ti + 3] = 255;
    }

    // Extract network nodes from high-knowledge areas (every 30 frames)
    if (frameCount % 30 === 0) {
      updateNodes();
    }

    // Age existing nodes
    for (const node of nodes) {
      node.age++;
    }
  }

  function updateNodes() {
    // Find local maxima in the knowledge grid above threshold
    const NODE_THRESHOLD = 0.35;
    const MIN_NODE_DISTANCE = 8; // grid cells apart

    for (let gy = 2; gy < GRID_SIZE - 2; gy += 3) {
      for (let gx = 2; gx < GRID_SIZE - 2; gx += 3) {
        const val = current[idx(gx, gy)];
        if (val < NODE_THRESHOLD) continue;

        // Check if local maximum (3x3 neighborhood)
        let isMax = true;
        for (let dy = -1; dy <= 1 && isMax; dy++) {
          for (let dx = -1; dx <= 1 && isMax; dx++) {
            if (dx === 0 && dy === 0) continue;
            if (current[idx(gx + dx, gy + dy)] > val) isMax = false;
          }
        }
        if (!isMax) continue;

        // Check distance from existing nodes
        const screenX = gx / GRID_SIZE;
        const screenY = 1 - gy / GRID_SIZE;
        let tooClose = false;
        for (const n of nodes) {
          const dx = n.x - screenX;
          const dy = n.y - screenY;
          if (Math.sqrt(dx * dx + dy * dy) < MIN_NODE_DISTANCE / GRID_SIZE) {
            // Update existing node strength instead
            n.strength = Math.max(n.strength, val);
            tooClose = true;
            break;
          }
        }

        if (!tooClose) {
          nodes.push({ x: screenX, y: screenY, strength: val, age: 0 });
        }
      }
    }

    // Cap node count
    if (nodes.length > 60) {
      nodes.sort((a, b) => b.strength - a.strength);
      nodes = nodes.slice(0, 60);
    }
  }

  return {
    getTextureData: () => textureData,
    getNodes: () => nodes.map(n => ({ x: n.x, y: n.y, strength: n.strength })),
    update,
    getGridSize: () => GRID_SIZE,
  };
}
