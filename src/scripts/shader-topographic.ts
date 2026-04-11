// shader-topographic.ts — Animated contour/topographic lines
// Living elevation map flowing across a void background.

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

  // Extract contour line from a noise field
  // Returns 1.0 on the line, 0.0 away from it
  float contourLine(float value, float frequency, float thickness) {
    float scaled = value * frequency;
    float line = fract(scaled);
    // Thin line at the 0.0/1.0 boundary of fract
    float edge = min(line, 1.0 - line);
    return 1.0 - smoothstep(0.0, thickness, edge);
  }

  void main() {
    vec2 uv = gl_FragCoord.xy / u_resolution;
    float aspect = u_resolution.x / u_resolution.y;
    vec2 p = vec2(uv.x * aspect, uv.y);
    float t = u_time;

    vec3 void_color = vec3(0.043, 0.043, 0.067);
    vec3 violet     = vec3(0.655, 0.545, 0.98);
    vec3 indigo     = vec3(0.388, 0.4, 0.945);

    // Base noise field that slowly drifts
    vec2 drift = vec2(t * 0.03, t * 0.02);
    float n1 = fbm(p * 2.0 + drift);
    float n2 = fbm(p * 2.0 + drift + vec2(3.7, 8.1));

    // Warp the field for more organic shapes
    vec2 warp = vec2(n1, n2) * 0.4;
    float field = fbm(p * 1.8 + warp + drift * 0.5);

    // Two sets of contour lines at different frequencies
    float lines1 = contourLine(field, 5.0, 0.04);
    float lines2 = contourLine(field, 8.0, 0.03);

    // A third very subtle set for detail
    float lines3 = contourLine(field, 13.0, 0.02);

    // Color the contour lines
    vec3 color = void_color;

    // Primary contours in violet
    color += violet * lines1 * 0.2;

    // Secondary contours in indigo
    color += indigo * lines2 * 0.15;

    // Tertiary fine contours — barely visible
    color += mix(violet, indigo, 0.5) * lines3 * 0.07;

    // Vignette
    vec2 vigUV = uv - vec2(0.5, 0.55);
    float vignette = 1.0 - dot(vigUV, vigUV) * 1.2;
    color *= 0.7 + clamp(vignette, 0.0, 1.0) * 0.3;

    gl_FragColor = vec4(clamp(color, 0.0, 1.0), 1.0);
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

export function initTopographicShader(canvas: HTMLCanvasElement): boolean {
  const gl = canvas.getContext('webgl', {
    alpha: false, antialias: false, depth: false, stencil: false, preserveDrawingBuffer: false,
  });

  if (!gl) {
    console.warn('WebGL not available');
    return false;
  }

  const cssAurora = document.querySelector('.aurora') as HTMLElement;
  if (cssAurora) cssAurora.style.display = 'none';

  const vs = createShader(gl, gl.VERTEX_SHADER, VERTEX_SHADER);
  const fs = createShader(gl, gl.FRAGMENT_SHADER, FRAGMENT_SHADER);
  if (!vs || !fs) return false;

  const program = createProgram(gl, vs, fs);
  if (!program) return false;

  gl.useProgram(program);

  const buf = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, buf);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
  const posLoc = gl.getAttribLocation(program, 'a_position');
  gl.enableVertexAttribArray(posLoc);
  gl.vertexAttribPointer(posLoc, 2, gl.FLOAT, false, 0, 0);

  const uTime = gl.getUniformLocation(program, 'u_time');
  const uResolution = gl.getUniformLocation(program, 'u_resolution');

  let animationId = 0;

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
    gl!.drawArrays(gl!.TRIANGLES, 0, 3);
    animationId = requestAnimationFrame(render);
  }

  window.addEventListener('resize', resize);

  const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)');
  if (prefersReduced.matches) {
    resize();
    gl.uniform1f(uTime, 5);
    gl.uniform2f(uResolution, canvas.width, canvas.height);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
    return true;
  }

  prefersReduced.addEventListener('change', (e) => {
    if (e.matches) cancelAnimationFrame(animationId);
    else animationId = requestAnimationFrame(render);
  });

  resize();
  animationId = requestAnimationFrame(render);
  return true;
}
