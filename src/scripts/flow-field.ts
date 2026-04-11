// flow-field.ts — Canvas 2D particle flow overlay
// Particles follow noise-derived flow lines, creating stream visualization
// Layered on top of the WebGL aurora shader

interface Particle {
  x: number;
  y: number;
  prevX: number;
  prevY: number;
  speed: number;
  life: number;
  maxLife: number;
  opacity: number;
}

// Simplified noise for JS — doesn't need to match shader exactly
function hash(x: number, y: number): number {
  let h = x * 374761393 + y * 668265263;
  h = (h ^ (h >> 13)) * 1274126177;
  return ((h ^ (h >> 16)) & 0x7fffffff) / 0x7fffffff;
}

function smoothNoise(x: number, y: number): number {
  const ix = Math.floor(x);
  const iy = Math.floor(y);
  const fx = x - ix;
  const fy = y - iy;

  // Smoothstep
  const sx = fx * fx * (3 - 2 * fx);
  const sy = fy * fy * (3 - 2 * fy);

  const n00 = hash(ix, iy);
  const n10 = hash(ix + 1, iy);
  const n01 = hash(ix, iy + 1);
  const n11 = hash(ix + 1, iy + 1);

  const nx0 = n00 + (n10 - n00) * sx;
  const nx1 = n01 + (n11 - n01) * sx;

  return nx0 + (nx1 - nx0) * sy;
}

function fbm(x: number, y: number, octaves: number): number {
  let value = 0;
  let amplitude = 0.5;
  let frequency = 1;
  for (let i = 0; i < octaves; i++) {
    value += amplitude * smoothNoise(x * frequency, y * frequency);
    amplitude *= 0.5;
    frequency *= 2;
  }
  return value;
}

function getFlowAngle(x: number, y: number, time: number): number {
  const scale = 0.003;
  const n = fbm(x * scale + time * 0.05, y * scale + time * 0.03, 4);
  return n * Math.PI * 4;
}

export interface FlowFieldState {
  setVisible: (visible: boolean) => void;
  isVisible: () => boolean;
  destroy: () => void;
}

export function initFlowField(canvas: HTMLCanvasElement): FlowFieldState {
  const ctx = canvas.getContext('2d')!;
  const PARTICLE_COUNT = 1200;
  const particles: Particle[] = [];
  let visible = false;
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

  function createParticle(): Particle {
    const maxLife = 100 + Math.random() * 200;
    return {
      x: Math.random() * window.innerWidth,
      y: Math.random() * window.innerHeight,
      prevX: 0,
      prevY: 0,
      speed: 0.5 + Math.random() * 1.0,
      life: Math.random() * maxLife, // stagger initial life
      maxLife,
      opacity: 0,
    };
  }

  function initParticles() {
    particles.length = 0;
    for (let i = 0; i < PARTICLE_COUNT; i++) {
      particles.push(createParticle());
    }
  }

  function animate() {
    if (!visible) {
      animationId = requestAnimationFrame(animate);
      return;
    }

    const w = window.innerWidth;
    const h = window.innerHeight;
    time += 0.016; // ~60fps timestep

    // Fade trail effect
    ctx.fillStyle = 'rgba(11, 11, 17, 0.06)';
    ctx.fillRect(0, 0, w, h);

    for (const p of particles) {
      p.prevX = p.x;
      p.prevY = p.y;

      // Get flow direction from noise
      const angle = getFlowAngle(p.x, p.y, time);
      p.x += Math.cos(angle) * p.speed;
      p.y += Math.sin(angle) * p.speed;

      p.life++;

      // Fade in/out over life
      const lifeRatio = p.life / p.maxLife;
      if (lifeRatio < 0.1) {
        p.opacity = lifeRatio / 0.1;
      } else if (lifeRatio > 0.85) {
        p.opacity = (1 - lifeRatio) / 0.15;
      } else {
        p.opacity = 1;
      }

      // Reset if dead or off-screen
      if (p.life >= p.maxLife || p.x < -20 || p.x > w + 20 || p.y < -20 || p.y > h + 20) {
        Object.assign(p, createParticle());
        p.life = 0;
        continue;
      }

      // Draw line from prev to current position
      const alpha = p.opacity * 0.35;
      // Alternate between violet and blue based on position
      const hueShift = (p.x / w + p.y / h) * 0.5;
      if (hueShift > 0.5) {
        ctx.strokeStyle = `rgba(167, 139, 250, ${alpha})`; // violet
      } else {
        ctx.strokeStyle = `rgba(56, 189, 248, ${alpha})`;  // sky blue
      }

      ctx.lineWidth = 0.8;
      ctx.beginPath();
      ctx.moveTo(p.prevX, p.prevY);
      ctx.lineTo(p.x, p.y);
      ctx.stroke();
    }

    animationId = requestAnimationFrame(animate);
  }

  const state: FlowFieldState = {
    setVisible: (v) => {
      visible = v;
      if (!v) {
        // Clear canvas when hiding
        ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);
      }
    },
    isVisible: () => visible,
    destroy: () => {
      cancelAnimationFrame(animationId);
    },
  };

  // Respect reduced motion
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    return state;
  }

  window.addEventListener('resize', () => {
    resize();
    ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);
  });

  resize();
  initParticles();
  animationId = requestAnimationFrame(animate);

  return state;
}
