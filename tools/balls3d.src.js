// The one 3D moment of Webprojekte: the three logo balls of mrlololi («drei Kugeln») as soft
// spheres that turn slowly and lean a little towards the pointer.
// Source of assets/js/balls3d.js. Built with OGL (Unlicense, https://github.com/oframe/ogl):
//   cd ..\qa && node build-balls.mjs
// landing.js imports the built file only after the page is idle, and only with a fine pointer,
// hover and no reduced motion. Everyone else keeps the flat SVG logo.
import { Renderer, Camera, Transform, Sphere, Program, Mesh } from 'ogl';

const vertex = /* glsl */ `
attribute vec3 position;
attribute vec3 normal;
uniform mat4 modelViewMatrix;
uniform mat4 projectionMatrix;
uniform mat3 normalMatrix;
uniform float uGrow;
varying vec3 vNormal;
varying vec3 vView;
void main() {
  vec4 mv = modelViewMatrix * vec4(position * (1.0 + uGrow), 1.0);
  vNormal = normalize(normalMatrix * normal);
  vView = -mv.xyz;
  gl_Position = projectionMatrix * mv;
}`;

// Soft pastel shading: the colour stays light, a gentle shadow side, a small highlight.
const fill = /* glsl */ `
precision highp float;
uniform vec3 uColor;
varying vec3 vNormal;
varying vec3 vView;
void main() {
  vec3 n = normalize(vNormal);
  vec3 v = normalize(vView);
  vec3 l = normalize(vec3(-0.55, 0.75, 0.9));
  float d = max(dot(n, l), 0.0);
  vec3 c = mix(uColor * 0.8, uColor * 1.04, d);
  float spec = pow(max(dot(n, normalize(l + v)), 0.0), 48.0) * 0.4;
  float rim = pow(1.0 - max(dot(n, v), 0.0), 3.0) * 0.12;
  gl_FragColor = vec4(min(c + spec + rim, vec3(1.0)), 1.0);
}`;

// The ink outline of the flat logo: the back faces of a slightly bigger sphere.
const line = /* glsl */ `
precision highp float;
uniform vec3 uColor;
void main() { gl_FragColor = vec4(uColor, 1.0); }`;

const hex = (h) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16) / 255);
const rgb = (css) => (css.match(/[\d.]+/g) || [43, 42, 51]).slice(0, 3).map((x) => +x / 255);

// Logo order: pink left, pistachio right, blue in the middle in front (as in the SVG).
const BALLS = [
  { color: '#F4C9D3', x: -0.92, z: 0 },
  { color: '#CFE3C2', x: 0.92, z: 0 },
  { color: '#BFD8EE', x: 0, z: 0.3 },
];

export function init(box) {
  const canvas = document.createElement('canvas');
  box.appendChild(canvas);
  let renderer;
  try {
    renderer = new Renderer({ canvas, dpr: Math.min(window.devicePixelRatio || 1, 2), alpha: true, antialias: true });
  } catch (e) {
    canvas.remove();
    return;
  }
  const gl = renderer.gl;
  if (!gl) { canvas.remove(); return; }
  gl.clearColor(0, 0, 0, 0);

  const camera = new Camera(gl, { fov: 18 });
  camera.position.z = 11;
  const scene = new Transform();
  const group = new Transform();
  group.setParent(scene);

  const geometry = new Sphere(gl, { radius: 1, widthSegments: 40, heightSegments: 28 });
  const ink = { value: rgb(getComputedStyle(box).color) };
  const meshes = BALLS.map((b) => {
    const holder = new Transform();
    holder.position.set(b.x, 0, b.z);
    holder.setParent(group);
    const outline = new Mesh(gl, {
      geometry,
      program: new Program(gl, { vertex, fragment: line, cullFace: gl.FRONT, uniforms: { uColor: ink, uGrow: { value: 0.085 } } }),
    });
    const ball = new Mesh(gl, {
      geometry,
      program: new Program(gl, { vertex, fragment: fill, uniforms: { uColor: { value: hex(b.color) }, uGrow: { value: 0 } } }),
    });
    outline.setParent(holder);
    ball.setParent(holder);
    return holder;
  });

  function resize() {
    const r = canvas.getBoundingClientRect();
    if (!r.width || !r.height) return;
    renderer.setSize(r.width, r.height);
    camera.perspective({ aspect: r.width / r.height });
  }
  resize();
  if ('ResizeObserver' in window) new ResizeObserver(resize).observe(canvas);

  // The outline follows the theme (ink on light, light ink on dark).
  const syncInk = () => { ink.value = rgb(getComputedStyle(box).color); };
  new MutationObserver(syncInk).observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
  window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', syncInk);

  // A little lean towards the pointer, eased.
  const target = { x: 0, y: 0 };
  const lean = { x: 0, y: 0 };
  window.addEventListener('pointermove', (e) => {
    const r = canvas.getBoundingClientRect();
    const cx = r.left + r.width / 2;
    const cy = r.top + r.height / 2;
    target.x = Math.max(-1, Math.min(1, (e.clientX - cx) / (window.innerWidth / 2)));
    target.y = Math.max(-1, Math.min(1, (e.clientY - cy) / (window.innerHeight / 2)));
  }, { passive: true });

  // Runs only while the balls are on screen and the tab is visible.
  let visible = false;
  let frame = 0;
  let shown = false;
  const start = performance.now();
  function tick(now) {
    frame = 0;
    const t = (now - start) / 1000;
    lean.x += (target.x - lean.x) * 0.06;
    lean.y += (target.y - lean.y) * 0.06;
    group.rotation.y = Math.sin(t * 0.35) * 0.45 + lean.x * 0.35;
    group.rotation.x = Math.sin(t * 0.27) * 0.12 + lean.y * 0.22;
    meshes.forEach((m, i) => { m.position.y = Math.sin(t * 1.1 + i * 2.1) * 0.06; });
    renderer.render({ scene, camera });
    if (!shown) { shown = true; box.classList.add('is-3d'); }
    loop();
  }
  function loop() {
    if (visible && !document.hidden && !frame) frame = requestAnimationFrame(tick);
  }
  function stop() {
    if (frame) cancelAnimationFrame(frame);
    frame = 0;
  }
  new IntersectionObserver((entries) => {
    visible = entries[0].isIntersecting;
    if (visible) loop(); else stop();
  }).observe(box);
  document.addEventListener('visibilitychange', () => { if (document.hidden) stop(); else loop(); });
}
