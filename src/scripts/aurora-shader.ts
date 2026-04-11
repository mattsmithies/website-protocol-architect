// aurora-shader.ts — Raw WebGL fullscreen fragment shader
// Creates flowing aurora/nebula visuals in violet/blue palette
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

  // ── Simplex-style noise ───────────────────────────────────

  vec3 mod289(vec3 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
  vec2 mod289(vec2 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
  vec3 permute(vec3 x) { return mod289(((x * 34.0) + 1.0) * x); }

  float snoise(vec2 v) {
    const vec4 C = vec4(
      0.211324865405187,   // (3.0 - sqrt(3.0)) / 6.0
      0.366025403784439,   // 0.5 * (sqrt(3.0) - 1.0)
     -0.577350269189626,   // -1.0 + 2.0 * C.x
      0.024390243902439    // 1.0 / 41.0
    );

    vec2 i = floor(v + dot(v, C.yy));
    vec2 x0 = v - i + dot(i, C.xx);

    vec2 i1;
    i1 = (x0.x > x0.y) ? vec2(1.0, 0.0) : vec2(0.0, 1.0);

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

  // ── Domain warping (creates organic, flowing distortion) ──

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
    vec3 void_color = vec3(0.043, 0.043, 0.067);   // #0b0b11
    vec3 violet     = vec3(0.655, 0.545, 0.98);     // #a78bfa
    vec3 sky_blue   = vec3(0.22, 0.74, 0.97);       // #38bdf8
    vec3 indigo     = vec3(0.388, 0.4, 0.945);      // #6366f1
    vec3 deep_blue  = vec3(0.11, 0.11, 0.25);       // subtle blue undertone

    // Primary flowing layer (domain-warped noise)
    float n1 = warpedNoise(p * 1.5, t);

    // Secondary layer at different scale and speed
    float n2 = warpedNoise(p * 2.5 + 10.0, t * 0.7);

    // Tertiary detail layer
    float n3 = fbm(p * 4.0 + t * 0.15);

    // Build color from layers
    vec3 color = void_color;

    // Deep blue undertone
    color = mix(color, deep_blue, smoothstep(-0.2, 0.6, n1) * 0.4);

    // Violet aurora band
    color = mix(color, violet, smoothstep(0.1, 0.8, n1) * 0.22);

    // Sky blue secondary
    color = mix(color, sky_blue, smoothstep(0.0, 0.7, n2) * 0.14);

    // Indigo bridging tones
    color = mix(color, indigo, smoothstep(0.2, 0.9, n1 * n2) * 0.12);

    // Fine detail highlights
    color += violet * smoothstep(0.5, 0.9, n3) * 0.06;
    color += sky_blue * smoothstep(0.4, 0.8, n3 * n2) * 0.04;

    // Mouse proximity glow (soft, subtle)
    if (u_mouse.x > 0.0) {
      vec2 mouseUV = u_mouse / u_resolution;
      mouseUV.y = 1.0 - mouseUV.y; // flip Y
      float mouseDist = distance(uv, mouseUV);
      float mouseGlow = smoothstep(0.4, 0.0, mouseDist) * 0.08;
      color += violet * mouseGlow;
    }

    // Vignette (darker at edges, brighter near center-top)
    vec2 vigUV = uv - vec2(0.5, 0.55);
    float vignette = 1.0 - dot(vigUV, vigUV) * 1.2;
    vignette = clamp(vignette, 0.0, 1.0);
    color *= 0.7 + vignette * 0.3;

    // Clamp and output
    color = clamp(color, 0.0, 1.0);
    gl_FragColor = vec4(color, 1.0);
  }
`;

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

export function initAuroraShader(canvas: HTMLCanvasElement): void {
  const gl = canvas.getContext('webgl', {
    alpha: false,
    antialias: false,
    depth: false,
    stencil: false,
    preserveDrawingBuffer: false,
  });

  if (!gl) {
    // WebGL not available — CSS aurora fallback remains visible
    console.warn('WebGL not available, using CSS aurora fallback');
    return;
  }

  // Hide CSS aurora fallback since WebGL is working
  const cssAurora = document.querySelector('.aurora') as HTMLElement;
  if (cssAurora) cssAurora.style.display = 'none';

  // Compile shaders
  const vs = createShader(gl, gl.VERTEX_SHADER, VERTEX_SHADER);
  const fs = createShader(gl, gl.FRAGMENT_SHADER, FRAGMENT_SHADER);
  if (!vs || !fs) return;

  const program = createProgram(gl, vs, fs);
  if (!program) return;

  gl.useProgram(program);

  // Fullscreen triangle (covers viewport with a single triangle — more efficient than a quad)
  const positionBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([
    -1, -1,
     3, -1,
    -1,  3,
  ]), gl.STATIC_DRAW);

  const posLoc = gl.getAttribLocation(program, 'a_position');
  gl.enableVertexAttribArray(posLoc);
  gl.vertexAttribPointer(posLoc, 2, gl.FLOAT, false, 0, 0);

  // Uniform locations
  const uTime = gl.getUniformLocation(program, 'u_time');
  const uResolution = gl.getUniformLocation(program, 'u_resolution');
  const uMouse = gl.getUniformLocation(program, 'u_mouse');

  let mouseX = 0;
  let mouseY = 0;
  let animationId = 0;

  function resize() {
    const dpr = Math.min(window.devicePixelRatio || 1, 2); // Cap at 2x for performance
    const w = window.innerWidth;
    const h = window.innerHeight;
    canvas.width = w * dpr;
    canvas.height = h * dpr;
    canvas.style.width = w + 'px';
    canvas.style.height = h + 'px';
    gl!.viewport(0, 0, canvas.width, canvas.height);
  }

  function render(time: number) {
    gl!.uniform1f(uTime, time * 0.001); // Convert ms to seconds
    gl!.uniform2f(uResolution, canvas.width, canvas.height);
    gl!.uniform2f(uMouse, mouseX * (Math.min(window.devicePixelRatio, 2)), mouseY * (Math.min(window.devicePixelRatio, 2)));
    gl!.drawArrays(gl!.TRIANGLES, 0, 3);
    animationId = requestAnimationFrame(render);
  }

  // Event listeners
  window.addEventListener('mousemove', (e) => {
    mouseX = e.clientX;
    mouseY = e.clientY;
  });

  window.addEventListener('resize', resize);

  // Reduced motion: render one frame and stop
  const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)');
  if (prefersReduced.matches) {
    resize();
    gl.uniform1f(uTime, 0);
    gl.uniform2f(uResolution, canvas.width, canvas.height);
    gl.uniform2f(uMouse, 0, 0);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
    return;
  }

  prefersReduced.addEventListener('change', (e) => {
    if (e.matches) {
      cancelAnimationFrame(animationId);
    } else {
      animationId = requestAnimationFrame(render);
    }
  });

  resize();
  animationId = requestAnimationFrame(render);
}
