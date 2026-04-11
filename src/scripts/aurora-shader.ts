// aurora-shader.ts — Raw WebGL fullscreen fragment shader
// Multi-mode visual system: aurora, contour topology, ridge glow
// Zero external dependencies, GPU-rendered

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
  uniform vec2 u_mouse;
  uniform float u_contours;   // 0.0 = off, 1.0 = full contour lines
  uniform float u_ridges;     // 0.0 = off, 1.0 = glowing ridges

  // ── Simplex-style noise ───────────────────────────────────

  vec3 mod289(vec3 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
  vec2 mod289(vec2 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
  vec3 permute(vec3 x) { return mod289(((x * 34.0) + 1.0) * x); }

  float snoise(vec2 v) {
    const vec4 C = vec4(
      0.211324865405187,
      0.366025403784439,
     -0.577350269189626,
      0.024390243902439
    );

    vec2 i = floor(v + dot(v, C.yy));
    vec2 x0 = v - i + dot(i, C.xx);
    vec2 i1 = (x0.x > x0.y) ? vec2(1.0, 0.0) : vec2(0.0, 1.0);
    vec4 x12 = x0.xyxy + C.xxzz;
    x12.xy -= i1;

    i = mod289(i);
    vec3 p = permute(permute(i.y + vec3(0.0, i1.y, 1.0)) + i.x + vec3(0.0, i1.x, 1.0));

    vec3 m = max(0.5 - vec3(dot(x0, x0), dot(x12.xy, x12.xy), dot(x12.zw, x12.zw)), 0.0);
    m = m * m;
    m = m * m;

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

  // ── Fractional Brownian Motion ────────────────────────────

  float fbm(vec2 p) {
    float value = 0.0;
    float amplitude = 0.5;
    float frequency = 1.0;
    for (int i = 0; i < 5; i++) {
      value += amplitude * snoise(p * frequency);
      amplitude *= 0.5;
      frequency *= 2.0;
    }
    return value;
  }

  // ── Domain warping ────────────────────────────────────────

  float warpedNoise(vec2 p, float t) {
    vec2 q = vec2(
      fbm(p + vec2(0.0, 0.0) + t * 0.12),
      fbm(p + vec2(5.2, 1.3) + t * 0.1)
    );
    vec2 r = vec2(
      fbm(p + 4.0 * q + vec2(1.7, 9.2) + t * 0.08),
      fbm(p + 4.0 * q + vec2(8.3, 2.8) + t * 0.06)
    );
    return fbm(p + 4.0 * r);
  }

  // ── Main ──────────────────────────────────────────────────

  void main() {
    vec2 uv = gl_FragCoord.xy / u_resolution;
    float aspect = u_resolution.x / u_resolution.y;
    vec2 p = vec2(uv.x * aspect, uv.y);

    float t = u_time;

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

    // ── Base aurora ─────────────────────────────────────────
    vec3 color = void_color;
    color = mix(color, deep_blue, smoothstep(-0.2, 0.6, n1) * 0.4);
    color = mix(color, violet, smoothstep(0.1, 0.8, n1) * 0.22);
    color = mix(color, sky_blue, smoothstep(0.0, 0.7, n2) * 0.14);
    color = mix(color, indigo, smoothstep(0.2, 0.9, n1 * n2) * 0.12);
    color += violet * smoothstep(0.5, 0.9, n3) * 0.06;
    color += sky_blue * smoothstep(0.4, 0.8, n3 * n2) * 0.04;

    // ── Topographic contour lines ───────────────────────────
    if (u_contours > 0.01) {
      // Primary contour set from warped noise
      float field1 = n1 * 7.0;
      float band1 = abs(fract(field1) - 0.5) * 2.0;
      float line1 = 1.0 - smoothstep(0.0, 0.035, band1);

      // Secondary contour set at different frequency
      float field2 = n2 * 5.0;
      float band2 = abs(fract(field2) - 0.5) * 2.0;
      float line2 = 1.0 - smoothstep(0.0, 0.025, band2);

      // Color contour lines with gradient across viewport
      vec3 lineColor1 = mix(violet, sky_blue, uv.x + n3 * 0.3) * 0.8;
      vec3 lineColor2 = mix(indigo, violet, uv.y) * 0.5;

      color += lineColor1 * line1 * 0.18 * u_contours;
      color += lineColor2 * line2 * 0.08 * u_contours;

      // Intersection glow where contour lines cross
      float intersection = line1 * line2;
      color += violet * intersection * 0.25 * u_contours;
    }

    // ── Ridge glow (elevated contour edges) ─────────────────
    if (u_ridges > 0.01) {
      // Ridges: bright lines at the peaks of the noise field
      float ridge1 = smoothstep(0.55, 0.7, n1) * smoothstep(0.85, 0.7, n1);
      float ridge2 = smoothstep(0.45, 0.6, n2) * smoothstep(0.75, 0.6, n2);

      color += violet * ridge1 * 0.35 * u_ridges;
      color += sky_blue * ridge2 * 0.25 * u_ridges;

      // Pulse effect on ridges
      float pulse = sin(t * 2.0 + n1 * 6.0) * 0.5 + 0.5;
      color += indigo * ridge1 * ridge2 * pulse * 0.2 * u_ridges;
    }

    // ── Mouse proximity glow ────────────────────────────────
    if (u_mouse.x > 0.0) {
      vec2 mouseUV = u_mouse / u_resolution;
      mouseUV.y = 1.0 - mouseUV.y;
      float mouseDist = distance(uv, mouseUV);
      float mouseGlow = smoothstep(0.4, 0.0, mouseDist) * 0.1;
      color += violet * mouseGlow;

      // Mouse-reactive contour brightening
      if (u_contours > 0.01) {
        float nearMouse = smoothstep(0.3, 0.0, mouseDist);
        float field = n1 * 7.0;
        float band = abs(fract(field) - 0.5) * 2.0;
        float line = 1.0 - smoothstep(0.0, 0.05, band);
        color += sky_blue * line * nearMouse * 0.15 * u_contours;
      }
    }

    // ── Vignette ────────────────────────────────────────────
    vec2 vigUV = uv - vec2(0.5, 0.55);
    float vignette = 1.0 - dot(vigUV, vigUV) * 1.2;
    vignette = clamp(vignette, 0.0, 1.0);
    color *= 0.7 + vignette * 0.3;

    color = clamp(color, 0.0, 1.0);
    gl_FragColor = vec4(color, 1.0);
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

// ── Exported state for external control ───────────────────────

export interface ShaderState {
  setContours: (value: number) => void;
  setRidges: (value: number) => void;
  getContours: () => number;
  getRidges: () => number;
}

export function initAuroraShader(canvas: HTMLCanvasElement): ShaderState | null {
  const gl = canvas.getContext('webgl', {
    alpha: false,
    antialias: false,
    depth: false,
    stencil: false,
    preserveDrawingBuffer: false,
  });

  if (!gl) {
    console.warn('WebGL not available, using CSS aurora fallback');
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

  // Fullscreen triangle
  const positionBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);

  const posLoc = gl.getAttribLocation(program, 'a_position');
  gl.enableVertexAttribArray(posLoc);
  gl.vertexAttribPointer(posLoc, 2, gl.FLOAT, false, 0, 0);

  // Uniforms
  const uTime = gl.getUniformLocation(program, 'u_time');
  const uResolution = gl.getUniformLocation(program, 'u_resolution');
  const uMouse = gl.getUniformLocation(program, 'u_mouse');
  const uContours = gl.getUniformLocation(program, 'u_contours');
  const uRidges = gl.getUniformLocation(program, 'u_ridges');

  let mouseX = 0;
  let mouseY = 0;
  let animationId = 0;
  let contourValue = 1.0;  // Default: contours ON
  let ridgeValue = 0.0;    // Default: ridges OFF

  const state: ShaderState = {
    setContours: (v) => { contourValue = v; },
    setRidges: (v) => { ridgeValue = v; },
    getContours: () => contourValue,
    getRidges: () => ridgeValue,
  };

  function resize() {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const w = window.innerWidth;
    const h = window.innerHeight;
    canvas.width = w * dpr;
    canvas.height = h * dpr;
    canvas.style.width = w + 'px';
    canvas.style.height = h + 'px';
    gl!.viewport(0, 0, canvas.width, canvas.height);
  }

  function render(time: number) {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    gl!.uniform1f(uTime, time * 0.001);
    gl!.uniform2f(uResolution, canvas.width, canvas.height);
    gl!.uniform2f(uMouse, mouseX * dpr, mouseY * dpr);
    gl!.uniform1f(uContours, contourValue);
    gl!.uniform1f(uRidges, ridgeValue);
    gl!.drawArrays(gl!.TRIANGLES, 0, 3);
    animationId = requestAnimationFrame(render);
  }

  window.addEventListener('mousemove', (e) => { mouseX = e.clientX; mouseY = e.clientY; });
  window.addEventListener('resize', resize);

  const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)');
  if (prefersReduced.matches) {
    resize();
    gl.uniform1f(uTime, 5); // Use t=5 for a nicer static frame
    gl.uniform2f(uResolution, canvas.width, canvas.height);
    gl.uniform2f(uMouse, 0, 0);
    gl.uniform1f(uContours, contourValue);
    gl.uniform1f(uRidges, ridgeValue);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
    return state;
  }

  prefersReduced.addEventListener('change', (e) => {
    if (e.matches) cancelAnimationFrame(animationId);
    else animationId = requestAnimationFrame(render);
  });

  resize();
  animationId = requestAnimationFrame(render);
  return state;
}
