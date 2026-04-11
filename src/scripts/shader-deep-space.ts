// shader-deep-space.ts — Parallax star field with nebula
// Vast, quiet, grand deep space backdrop.

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
    for (int i = 0; i < 4; i++) { v += a * snoise(p * f); a *= 0.5; f *= 2.0; }
    return v;
  }

  // Hash function for pseudo-random star placement
  float hash(vec2 p) {
    vec3 p3 = fract(vec3(p.xyx) * 0.1031);
    p3 += dot(p3, p3.yzx + 33.33);
    return fract((p3.x + p3.y) * p3.z);
  }

  // Star layer: returns brightness at this pixel for a grid of stars
  // scale controls star density (higher = more cells = more stars)
  // threshold controls rarity (higher = fewer stars)
  // size controls star radius
  float starLayer(vec2 uv, float scale, float threshold, float size) {
    vec2 grid = floor(uv * scale);
    vec2 f = fract(uv * scale);

    float brightness = 0.0;

    // Check neighboring cells for stars
    for (int y = -1; y <= 1; y++) {
      for (int x = -1; x <= 1; x++) {
        vec2 neighbor = vec2(float(x), float(y));
        vec2 cell = grid + neighbor;

        // Random position within cell
        float h = hash(cell);
        float h2 = hash(cell + 127.1);

        // Only create a star if hash exceeds threshold
        if (h > threshold) {
          vec2 starPos = vec2(hash(cell + 31.7), hash(cell + 73.3));
          float d = length(f - neighbor - starPos);

          // Star intensity with soft falloff
          float star = smoothstep(size, 0.0, d);
          brightness += star;
        }
      }
    }

    return brightness;
  }

  void main() {
    vec2 uv = gl_FragCoord.xy / u_resolution;
    float aspect = u_resolution.x / u_resolution.y;
    vec2 p = vec2(uv.x * aspect, uv.y);
    float t = u_time;

    vec3 void_color = vec3(0.043, 0.043, 0.067);
    vec3 violet     = vec3(0.655, 0.545, 0.98);
    vec3 sky_blue   = vec3(0.22, 0.74, 0.97);
    vec3 indigo     = vec3(0.388, 0.4, 0.945);

    // --- Nebula background ---
    // Very faint colored fog using noise
    float neb1 = fbm(p * 1.5 + t * 0.01);
    float neb2 = fbm(p * 2.0 + vec2(5.0, 3.0) + t * 0.008);

    vec3 color = void_color;
    color += violet * 0.03 * smoothstep(-0.1, 0.5, neb1);
    color += indigo * 0.025 * smoothstep(0.0, 0.6, neb2);
    color += sky_blue * 0.015 * smoothstep(0.1, 0.7, neb1 * neb2);

    // --- Star layers with parallax drift ---

    // Far stars: tiny, many, slow drift
    vec2 farUV = p + vec2(t * 0.003, t * 0.001);
    float farStars = starLayer(farUV, 40.0, 0.6, 0.08);
    // Twinkle
    float farTwinkle = 0.7 + 0.3 * sin(t * 1.2 + hash(floor(farUV * 40.0)) * 6.28);
    vec3 farColor = vec3(0.7, 0.7, 0.8); // Slightly cool white
    color += farColor * farStars * 0.25 * farTwinkle;

    // Mid stars: medium, fewer, moderate drift
    vec2 midUV = p + vec2(t * 0.007, t * 0.003);
    float midStars = starLayer(midUV, 20.0, 0.78, 0.1);
    float midTwinkle = 0.75 + 0.25 * sin(t * 0.9 + hash(floor(midUV * 20.0)) * 6.28);
    // Occasional color tint
    float midTint = hash(floor(midUV * 20.0) + 99.0);
    vec3 midColor = mix(vec3(1.0), midTint < 0.15 ? violet : (midTint < 0.3 ? sky_blue : vec3(1.0)), 0.4);
    color += midColor * midStars * 0.4 * midTwinkle;

    // Near stars: larger, rare, faster drift
    vec2 nearUV = p + vec2(t * 0.012, t * 0.005);
    float nearStars = starLayer(nearUV, 10.0, 0.92, 0.14);
    float nearTwinkle = 0.8 + 0.2 * sin(t * 0.6 + hash(floor(nearUV * 10.0)) * 6.28);
    float nearTint = hash(floor(nearUV * 10.0) + 55.0);
    vec3 nearColor = mix(vec3(1.0), nearTint < 0.2 ? violet : (nearTint < 0.35 ? sky_blue : vec3(1.0)), 0.35);
    // Near stars get a subtle glow halo
    float nearGlow = starLayer(nearUV, 10.0, 0.92, 0.3) * 0.08;
    color += nearColor * nearStars * 0.55 * nearTwinkle;
    color += indigo * nearGlow;

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

export function initDeepSpaceShader(canvas: HTMLCanvasElement): boolean {
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
