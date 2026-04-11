// aurora-shader.ts — Raw WebGL fragment shader with knowledge texture
// Background starts as chaos. Where the mouse has observed, knowledge
// accumulates and structure emerges: patterns → contours → clarity.
// The background *learns* from your attention.

const VERTEX_SHADER = `
  attribute vec2 a_position;
  void main() {
    gl_Position = vec4(a_position, 0.0, 1.0);
  }
`;

const FRAGMENT_SHADER = `
  precision highp float;

  uniform float u_time;
  uniform vec2 u_resolution;
  uniform float u_contours;
  uniform float u_ridges;
  uniform sampler2D u_knowledge;  // accumulated observation map

  // ── Noise ─────────────────────────────────────────────────

  vec3 mod289(vec3 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
  vec2 mod289(vec2 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
  vec3 permute(vec3 x) { return mod289(((x * 34.0) + 1.0) * x); }

  float snoise(vec2 v) {
    const vec4 C = vec4(0.211324865405187, 0.366025403784439, -0.577350269189626, 0.024390243902439);
    vec2 i = floor(v + dot(v, C.yy));
    vec2 x0 = v - i + dot(i, C.xx);
    vec2 i1 = (x0.x > x0.y) ? vec2(1.0, 0.0) : vec2(0.0, 1.0);
    vec4 x12 = x0.xyxy + C.xxzz;
    x12.xy -= i1;
    i = mod289(i);
    vec3 p = permute(permute(i.y + vec3(0.0, i1.y, 1.0)) + i.x + vec3(0.0, i1.x, 1.0));
    vec3 m = max(0.5 - vec3(dot(x0, x0), dot(x12.xy, x12.xy), dot(x12.zw, x12.zw)), 0.0);
    m = m * m; m = m * m;
    vec3 x = 2.0 * fract(p * C.www) - 1.0;
    vec3 h = abs(x) - 0.5;
    vec3 ox = floor(x + 0.5);
    vec3 a0 = x - ox;
    m *= 1.79284291400159 - 0.85373472095314 * (a0 * a0 + h * h);
    vec3 g;
    g.x = a0.x * x0.x + h.x * x0.y;
    g.yz = a0.yz * x12.xz + h.yz * x12.yw;
    return 130.0 * dot(m, g);
  }

  float fbm(vec2 p) {
    float v = 0.0, a = 0.5, f = 1.0;
    for (int i = 0; i < 5; i++) { v += a * snoise(p * f); a *= 0.5; f *= 2.0; }
    return v;
  }

  float warpedNoise(vec2 p, float t) {
    vec2 q = vec2(fbm(p + t * 0.12), fbm(p + vec2(5.2, 1.3) + t * 0.1));
    vec2 r = vec2(fbm(p + 4.0*q + vec2(1.7,9.2) + t*0.08), fbm(p + 4.0*q + vec2(8.3,2.8) + t*0.06));
    return fbm(p + 4.0 * r);
  }

  // ── Main ──────────────────────────────────────────────────

  void main() {
    vec2 uv = gl_FragCoord.xy / u_resolution;
    float aspect = u_resolution.x / u_resolution.y;
    vec2 p = vec2(uv.x * aspect, uv.y);
    float t = u_time;

    // Sample the knowledge map — how much has this area been observed?
    float knowledge = texture2D(u_knowledge, uv).r;

    // Palette
    vec3 void_color = vec3(0.043, 0.043, 0.067);
    vec3 violet     = vec3(0.655, 0.545, 0.98);
    vec3 sky_blue   = vec3(0.22, 0.74, 0.97);
    vec3 indigo     = vec3(0.388, 0.4, 0.945);
    vec3 deep_blue  = vec3(0.11, 0.11, 0.25);

    // Noise layers
    float n1 = warpedNoise(p * 1.5, t);
    float n2 = warpedNoise(p * 2.5 + 10.0, t * 0.7);
    float n3 = fbm(p * 4.0 + t * 0.15);

    // ── Phase 0: Chaos (knowledge = 0) ──────────────────────
    // Raw, turbulent aurora. No structure visible.
    vec3 color = void_color;
    float chaosAmt = 1.0 - knowledge * 0.4;
    color = mix(color, deep_blue, smoothstep(-0.2, 0.6, n1) * 0.4 * chaosAmt);
    color = mix(color, violet * 0.6, smoothstep(0.1, 0.8, n1) * 0.18 * chaosAmt);
    color = mix(color, sky_blue * 0.5, smoothstep(0.0, 0.7, n2) * 0.1 * chaosAmt);
    color = mix(color, indigo * 0.4, smoothstep(0.2, 0.9, n1 * n2) * 0.08);

    // ── Phase 1: Patterns emerging (knowledge 0.05 - 0.25) ──
    // Faint contour hints. The first sign that structure exists.
    float phase1 = smoothstep(0.05, 0.25, knowledge);
    if (phase1 > 0.0 && u_contours > 0.01) {
      float field = n1 * 5.0;
      float band = abs(fract(field) - 0.5) * 2.0;
      float line = 1.0 - smoothstep(0.0, 0.08, band); // soft, wide lines
      vec3 lineCol = mix(violet * 0.3, violet * 0.5, n3);
      color += lineCol * line * phase1 * 0.1 * u_contours;
    }

    // ── Phase 2: Structure forming (knowledge 0.2 - 0.55) ───
    // Clear contour lines. Two frequency sets. Intersections glow.
    float phase2 = smoothstep(0.2, 0.55, knowledge);
    if (phase2 > 0.0 && u_contours > 0.01) {
      // Primary contours
      float field1 = n1 * 7.0;
      float band1 = abs(fract(field1) - 0.5) * 2.0;
      float sharpness1 = mix(0.06, 0.025, phase2);
      float line1 = 1.0 - smoothstep(0.0, sharpness1, band1);

      // Secondary contours
      float field2 = n2 * 5.0;
      float band2 = abs(fract(field2) - 0.5) * 2.0;
      float sharpness2 = mix(0.05, 0.02, phase2);
      float line2 = 1.0 - smoothstep(0.0, sharpness2, band2);

      vec3 lineColor1 = mix(violet, sky_blue, uv.x + n3 * 0.3);
      vec3 lineColor2 = mix(indigo, violet, uv.y);

      color += lineColor1 * line1 * phase2 * 0.2 * u_contours;
      color += lineColor2 * line2 * phase2 * 0.08 * u_contours;

      // Intersection brightening
      float ix = line1 * line2;
      color += mix(violet, sky_blue, n3) * ix * phase2 * 0.3 * u_contours;
    }

    // ── Phase 3: Insight (knowledge 0.5 - 1.0) ─────────────
    // Full clarity. Grid visible. Colors brighten. Node regions glow.
    float phase3 = smoothstep(0.5, 1.0, knowledge);
    if (phase3 > 0.0) {
      // Subtle grid alignment
      vec2 g = abs(fract(p * 14.0) - 0.5) * 2.0;
      float grid = 1.0 - min(smoothstep(0.0, 0.03, g.x), smoothstep(0.0, 0.03, g.y));
      color += violet * grid * phase3 * 0.04;

      // Brightened, more saturated aurora in observed areas
      color = mix(color, color * 1.4 + violet * 0.02, phase3 * 0.3);

      // Node glow at high-knowledge peaks (will align with network-graph.ts nodes)
      if (knowledge > 0.7) {
        float nodeGlow = smoothstep(0.7, 0.95, knowledge);
        float pulse = sin(t * 2.0 + uv.x * 20.0 + uv.y * 20.0) * 0.5 + 0.5;
        color += violet * nodeGlow * pulse * 0.08;
      }
    }

    // ── Ridge glow (optional mode) ──────────────────────────
    if (u_ridges > 0.01 && knowledge > 0.15) {
      float ridgeK = smoothstep(0.15, 0.6, knowledge) * u_ridges;
      float ridge1 = smoothstep(0.55, 0.7, n1) * smoothstep(0.85, 0.7, n1);
      float ridge2 = smoothstep(0.45, 0.6, n2) * smoothstep(0.75, 0.6, n2);
      color += violet * ridge1 * ridgeK * 0.3;
      color += sky_blue * ridge2 * ridgeK * 0.2;
      float pulse = sin(t * 2.0 + n1 * 6.0) * 0.5 + 0.5;
      color += indigo * ridge1 * ridge2 * pulse * ridgeK * 0.15;
    }

    // ── Vignette ────────────────────────────────────────────
    vec2 vigUV = uv - vec2(0.5, 0.55);
    float vignette = 1.0 - dot(vigUV, vigUV) * 1.2;
    color *= 0.7 + clamp(vignette, 0.0, 1.0) * 0.3;

    gl_FragColor = vec4(clamp(color, 0.0, 1.0), 1.0);
  }
`;

// ── WebGL helpers ─────────────────────────────────────────────

function createShader(gl: WebGLRenderingContext, type: number, source: string): WebGLShader | null {
  const shader = gl.createShader(type);
  if (!shader) return null;
  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    console.warn('Shader compile error:', gl.getShaderInfoLog(shader));
    gl.deleteShader(shader);
    return null;
  }
  return shader;
}

function createProgram(gl: WebGLRenderingContext, vs: WebGLShader, fs: WebGLShader): WebGLProgram | null {
  const program = gl.createProgram();
  if (!program) return null;
  gl.attachShader(program, vs);
  gl.attachShader(program, fs);
  gl.linkProgram(program);
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    console.warn('Program link error:', gl.getProgramInfoLog(program));
    gl.deleteProgram(program);
    return null;
  }
  return program;
}

// ── Exported state ────────────────────────────────────────────

export interface ShaderState {
  setContours: (value: number) => void;
  setRidges: (value: number) => void;
  getContours: () => number;
  getRidges: () => number;
  updateKnowledge: (data: Uint8Array, size: number) => void;
}

export function initAuroraShader(canvas: HTMLCanvasElement): ShaderState | null {
  const gl = canvas.getContext('webgl', {
    alpha: false, antialias: false, depth: false, stencil: false, preserveDrawingBuffer: false,
  });

  if (!gl) {
    console.warn('WebGL not available');
    return null;
  }

  const cssAurora = document.querySelector('.aurora') as HTMLElement;
  if (cssAurora) cssAurora.style.display = 'none';

  const vs = createShader(gl, gl.VERTEX_SHADER, VERTEX_SHADER);
  const fs = createShader(gl, gl.FRAGMENT_SHADER, FRAGMENT_SHADER);
  if (!vs || !fs) return null;

  const program = createProgram(gl, vs, fs);
  if (!program) return null;

  gl.useProgram(program);

  // Geometry
  const buf = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, buf);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
  const posLoc = gl.getAttribLocation(program, 'a_position');
  gl.enableVertexAttribArray(posLoc);
  gl.vertexAttribPointer(posLoc, 2, gl.FLOAT, false, 0, 0);

  // Uniforms
  const uTime = gl.getUniformLocation(program, 'u_time');
  const uResolution = gl.getUniformLocation(program, 'u_resolution');
  const uContours = gl.getUniformLocation(program, 'u_contours');
  const uRidges = gl.getUniformLocation(program, 'u_ridges');
  const uKnowledge = gl.getUniformLocation(program, 'u_knowledge');

  // Knowledge texture
  const knowledgeTex = gl.createTexture();
  gl.activeTexture(gl.TEXTURE0);
  gl.bindTexture(gl.TEXTURE_2D, knowledgeTex);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  gl.uniform1i(uKnowledge, 0);

  let animationId = 0;
  let contourValue = 1.0;
  let ridgeValue = 0.0;
  let knowledgeSize = 128;

  const state: ShaderState = {
    setContours: (v) => { contourValue = v; },
    setRidges: (v) => { ridgeValue = v; },
    getContours: () => contourValue,
    getRidges: () => ridgeValue,
    updateKnowledge: (data, size) => {
      knowledgeSize = size;
      gl!.activeTexture(gl!.TEXTURE0);
      gl!.bindTexture(gl!.TEXTURE_2D, knowledgeTex);
      gl!.texImage2D(gl!.TEXTURE_2D, 0, gl!.RGBA, size, size, 0, gl!.RGBA, gl!.UNSIGNED_BYTE, data);
    },
  };

  function resize() {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = window.innerWidth * dpr;
    canvas.height = window.innerHeight * dpr;
    canvas.style.width = window.innerWidth + 'px';
    canvas.style.height = window.innerHeight + 'px';
    gl!.viewport(0, 0, canvas.width, canvas.height);
  }

  function render(time: number) {
    gl!.uniform1f(uTime, time * 0.001);
    gl!.uniform2f(uResolution, canvas.width, canvas.height);
    gl!.uniform1f(uContours, contourValue);
    gl!.uniform1f(uRidges, ridgeValue);
    gl!.drawArrays(gl!.TRIANGLES, 0, 3);
    animationId = requestAnimationFrame(render);
  }

  window.addEventListener('resize', resize);

  const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)');
  if (prefersReduced.matches) {
    resize();
    // Initialize with empty knowledge
    const emptyData = new Uint8Array(128 * 128 * 4);
    state.updateKnowledge(emptyData, 128);
    gl.uniform1f(uTime, 5);
    gl.uniform2f(uResolution, canvas.width, canvas.height);
    gl.uniform1f(uContours, contourValue);
    gl.uniform1f(uRidges, ridgeValue);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
    return state;
  }

  prefersReduced.addEventListener('change', (e) => {
    if (e.matches) cancelAnimationFrame(animationId);
    else animationId = requestAnimationFrame(render);
  });

  // Init with empty knowledge texture
  const initData = new Uint8Array(128 * 128 * 4);
  state.updateKnowledge(initData, 128);

  resize();
  animationId = requestAnimationFrame(render);
  return state;
}
