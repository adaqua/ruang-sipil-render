// Dak beton cutaway — RuangSipil 3D test scene.
// Combined style: SMECO visual language (three.js, ACES, soft shadows, floating
// labels, focus/isolation) + CADAnimation CAD look (outlines, grid, cutting plane,
// annotations) + open-3d-skills exploded-view (staged explode, x-ray, leader lines).
// All geometry built from code, no model files. Timeline is 30 s, driven by
// window.__recordFrame(t) under the frame-capture virtual clock, or by rAF when
// viewed live (loops every 30 s).
import * as THREE from "three";
import { RoomEnvironment } from "three/addons/environments/RoomEnvironment.js";
import { Exploder, Labels, Section } from "./explode.js";

const clamp01 = (x) => Math.min(1, Math.max(0, x));
const smooth = (x) => { const t = clamp01(x); return t * t * (3 - 2 * t); };
const lerp = (a, b, k) => a + (b - a) * k;

// ---------------------------------------------------------------- renderer
const app = document.getElementById("app");
const renderer = new THREE.WebGLRenderer({ antialias: true, preserveDrawingBuffer: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.0;
renderer.localClippingEnabled = true;
app.prepend(renderer.domElement);

const scene = new THREE.Scene();
scene.background = new THREE.Color(0xe9edf1);
scene.fog = new THREE.Fog(0xe9edf1, 14, 26);

const camera = new THREE.PerspectiveCamera(42, window.innerWidth / window.innerHeight, 0.1, 60);

// IBL so steel and concrete read properly (one-time cost)
const pmrem = new THREE.PMREMGenerator(renderer);
scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;

// ---------------------------------------------------------------- lights
scene.add(new THREE.HemisphereLight(0xe8f0f8, 0x9a8f80, 0.75));
const sun = new THREE.DirectionalLight(0xfff2e0, 2.0);
sun.position.set(4.5, 7, 4);
sun.castShadow = true;
sun.shadow.mapSize.set(2048, 2048);
sun.shadow.camera.left = -4.5; sun.shadow.camera.right = 4.5;
sun.shadow.camera.top = 4.5; sun.shadow.camera.bottom = -4.5;
sun.shadow.camera.near = 1; sun.shadow.camera.far = 20;
sun.shadow.bias = -0.0005;
sun.shadow.normalBias = 0.02;
scene.add(sun);
const fill = new THREE.DirectionalLight(0xdfe8ff, 0.5);
fill.position.set(-4, 3, -3);
scene.add(fill);

// ---------------------------------------------------------------- ground: CAD grid + soft shadow catcher
const grid = new THREE.GridHelper(10, 50, 0x8fa3b8, 0xc3ccd6);
grid.position.y = 0;
scene.add(grid);
const ground = new THREE.Mesh(
  new THREE.PlaneGeometry(30, 30),
  new THREE.ShadowMaterial({ opacity: 0.12 })
);
ground.rotation.x = -Math.PI / 2;
ground.position.y = -0.002;
ground.receiveShadow = true;
scene.add(ground);

// ---------------------------------------------------------------- materials
function concreteTexture() {
  const c = document.createElement("canvas");
  c.width = c.height = 256;
  const g = c.getContext("2d");
  g.fillStyle = "#9d9890";
  g.fillRect(0, 0, 256, 256);
  // seeded speckle
  let s = 12345;
  const rnd = () => (s = (s * 16807) % 2147483647) / 2147483647;
  for (let i = 0; i < 5200; i++) {
    const v = 150 + Math.floor(rnd() * 70);
    g.fillStyle = `rgba(${v},${v - 4},${v - 10},${0.12 + rnd() * 0.25})`;
    g.fillRect(rnd() * 256, rnd() * 256, 1 + rnd() * 2, 1 + rnd() * 2);
  }
  // faint formwork lines
  g.strokeStyle = "rgba(90,86,78,0.18)";
  g.lineWidth = 1;
  for (let y = 42; y < 256; y += 64) { g.beginPath(); g.moveTo(0, y); g.lineTo(256, y); g.stroke(); }
  const tex = new THREE.CanvasTexture(c);
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

const slabMat = new THREE.MeshStandardMaterial({
  map: concreteTexture(), roughness: 0.92, metalness: 0.0, envMapIntensity: 0.25,
});
const membraneMat = new THREE.MeshStandardMaterial({
  color: 0x17191d, roughness: 0.5, metalness: 0.1, envMapIntensity: 0.5,
});
const steelMat = new THREE.MeshStandardMaterial({
  color: 0x707a86, roughness: 0.38, metalness: 0.85, envMapIntensity: 0.8,
});
const pipeMat = new THREE.MeshStandardMaterial({
  color: 0x9aa3ab, roughness: 0.6, metalness: 0.2, envMapIntensity: 0.5,
});
const gutterMat = new THREE.MeshStandardMaterial({
  color: 0x5b6470, roughness: 0.7, metalness: 0.3, envMapIntensity: 0.4,
});
const crackMat = new THREE.MeshBasicMaterial({ color: 0x8a150c });
const crackGlowMat = new THREE.MeshBasicMaterial({
  color: 0xff3b30, transparent: true, opacity: 0.15,
  blending: THREE.AdditiveBlending, depthWrite: false,
});
const flowMat = new THREE.MeshBasicMaterial({ color: 0x35a7ff, transparent: true, opacity: 0 });
const dropMat = new THREE.MeshBasicMaterial({ color: 0x4db8ff });
const pondMat = new THREE.MeshStandardMaterial({
  color: 0x2f9dff, roughness: 0.12, metalness: 0.0, transparent: true, opacity: 0.55,
});
const edgeMat = new THREE.LineBasicMaterial({ color: 0x2b3440 });

// ---------------------------------------------------------------- assembly
// Slab 2.2 x 0.14 x 1.5, tilted 1.5% (~0.86 deg) toward the drain at -X.
const assembly = new THREE.Group();
assembly.position.y = 0.95;
scene.add(assembly);

const tilt = new THREE.Group();
tilt.rotation.z = 0.015;
assembly.add(tilt);

function addEdges(mesh) {
  const edges = new THREE.LineSegments(
    new THREE.EdgesGeometry(mesh.geometry, 30), edgeMat);
  mesh.add(edges);
  return mesh;
}

// --- slab (shell, stage 1, stays put; x-ray ghost during explode)
const slab = addEdges(new THREE.Mesh(new THREE.BoxGeometry(2.2, 0.14, 1.5), slabMat));
slab.castShadow = slab.receiveShadow = true;
slab.userData = { shell: true, stage: 1, explode: [0, 0, 0] };
tilt.add(slab);

// --- waterproofing membrane (shell, stage 0, lifts first)
const membrane = addEdges(new THREE.Mesh(new THREE.BoxGeometry(2.2, 0.012, 1.5), membraneMat));
membrane.position.y = 0.076;
membrane.castShadow = membrane.receiveShadow = true;
membrane.userData = { shell: true, stage: 0, explode: [0, 1.1, 0] };
tilt.add(membrane);

// --- rebar meshes (stage 2, separate up / down)
function rebarMesh(yTop, yBottom) {
  const geo = new THREE.CylinderGeometry(0.009, 0.009, 1, 8);
  const count = 6 + 5;
  const inst = new THREE.InstancedMesh(geo, steelMat, count);
  const m = new THREE.Matrix4(), q = new THREE.Quaternion(), sc = new THREE.Vector3(), p = new THREE.Vector3();
  const e = new THREE.Euler();
  let i = 0;
  for (let k = 0; k < 6; k++) {           // longitudinal bars along X
    e.set(0, 0, Math.PI / 2); q.setFromEuler(e);
    p.set(0, yTop, -0.6 + k * 0.24); sc.set(2.1, 1, 1);
    m.compose(p, q, sc); inst.setMatrixAt(i++, m);
  }
  for (let k = 0; k < 5; k++) {           // transverse bars along Z
    e.set(Math.PI / 2, 0, 0); q.setFromEuler(e);
    p.set(-0.8 + k * 0.4, yBottom, 0); sc.set(1.4, 1, 1);
    m.compose(p, q, sc); inst.setMatrixAt(i++, m);
  }
  inst.castShadow = true;
  inst.instanceMatrix.needsUpdate = true;
  return inst;
}
const rebarTop = new THREE.Group();
rebarTop.add(rebarMesh(0.052, 0.034));
rebarTop.userData = { stage: 2, explode: [0, 0.55, 0] };
tilt.add(rebarTop);
const rebarBottom = new THREE.Group();
rebarBottom.add(rebarMesh(-0.052, -0.034));
rebarBottom.userData = { stage: 2, explode: [0, -0.55, 0] };
tilt.add(rebarBottom);

// --- shrinkage crack (stage 1, stays in the slab; red X-ray glow)
const crackPts = [
  new THREE.Vector3(0.15, 0.09, 0.4),
  new THREE.Vector3(0.22, 0.04, 0.4),
  new THREE.Vector3(0.14, 0.0, 0.4),
  new THREE.Vector3(0.26, -0.04, 0.4),
  new THREE.Vector3(0.18, -0.075, 0.4),
];
const crackCurve = new THREE.CatmullRomCurve3(crackPts);
const crack = new THREE.Group();
crack.add(new THREE.Mesh(new THREE.TubeGeometry(crackCurve, 24, 0.012, 6), crackMat));
const crackGlow = new THREE.Mesh(new THREE.TubeGeometry(crackCurve, 24, 0.03, 6), crackGlowMat);
crack.add(crackGlow);
crack.userData = { stage: 1, explode: [0, 0, 0] };
tilt.add(crack);
const crackLight = new THREE.PointLight(0xff3020, 0, 1.4, 2);
crackLight.position.set(0.18, 0.05, 0.45);
tilt.add(crackLight);

// --- ponding water on top (stage 0, lifts and fades)
const pond = new THREE.Mesh(new THREE.BoxGeometry(1.1, 0.012, 0.9), pondMat);
pond.position.set(0.5, 0.088, 0.1);
pond.userData = { stage: 0, explode: [0, 0.5, 0] };
tilt.add(pond);

// --- neon flow arrows on the membrane (pointing to the drain, -X)
const arrowMats = [];
for (const ax of [0.6, 0.1, -0.4]) {
  const am = new THREE.MeshBasicMaterial({ color: 0x35a7ff, transparent: true, opacity: 0 });
  const cone = new THREE.Mesh(new THREE.ConeGeometry(0.045, 0.13, 12), am);
  cone.rotation.z = Math.PI / 2;   // point toward -X (the drain)
  cone.position.set(ax, 0.019, -0.3);
  membrane.add(cone);
  arrowMats.push(am);
}

// --- blue seepage flow: crack -> along the underside -> into the drain
const flowPts = [
  new THREE.Vector3(0.18, -0.075, 0.4),
  new THREE.Vector3(-0.1, -0.1, 0.4),
  new THREE.Vector3(-0.7, -0.1, 0.4),
  new THREE.Vector3(-1.05, -0.1, 0.4),
  new THREE.Vector3(-1.18, -0.02, 0.42),
  new THREE.Vector3(-1.22, -0.25, 0.45),
];
const flowCurve = new THREE.CatmullRomCurve3(flowPts);
const flowTube = new THREE.Mesh(new THREE.TubeGeometry(flowCurve, 40, 0.016, 8), flowMat);
tilt.add(flowTube);
const droplet = new THREE.Mesh(new THREE.SphereGeometry(0.028, 12, 12), dropMat);
droplet.visible = false;
tilt.add(droplet);

// --- clean top flow (solution): rain water runs over the membrane to the drain
const topFlowPts = [
  new THREE.Vector3(0.55, 0.1, 0.15),
  new THREE.Vector3(0.0, 0.1, 0.2),
  new THREE.Vector3(-0.6, 0.095, 0.25),
  new THREE.Vector3(-1.05, 0.09, 0.3),
  new THREE.Vector3(-1.18, 0.05, 0.35),
];
const topFlowCurve = new THREE.CatmullRomCurve3(topFlowPts);
const topFlowMat = new THREE.MeshBasicMaterial({ color: 0x35a7ff, transparent: true, opacity: 0 });
const topFlowTube = new THREE.Mesh(new THREE.TubeGeometry(topFlowCurve, 32, 0.014, 8), topFlowMat);
tilt.add(topFlowTube);

// --- drain pipe + gutter (outside the tilted group, static)
const drain = new THREE.Group();
drain.position.set(-1.22, 0.55, 0.4);
const pipe = new THREE.Mesh(new THREE.CylinderGeometry(0.055, 0.055, 0.75, 16), pipeMat);
pipe.castShadow = true;
drain.add(pipe);
assembly.add(drain);
const gutter = new THREE.Mesh(new THREE.BoxGeometry(0.26, 0.05, 0.8), gutterMat);
gutter.position.set(-1.12, 0.83, 0.25);
gutter.castShadow = gutter.receiveShadow = true;
assembly.add(gutter);

// ---------------------------------------------------------------- explode / x-ray / section
const ex = new Exploder(tilt, {
  parts: [membrane, slab, rebarTop, rebarBottom, crack, pond],
});
renderer.localClippingEnabled = true;
const section = new Section(tilt, [0, 0, -1]);
section.set(0.45);   // cut the front quarter of the shells away (z > 0.45)
// rebar is cut cleanly too, so the section reads like a drawing
for (const m of [steelMat]) {
  m.clippingPlanes = [section.plane];
  m.clipShadows = true;
  m.side = THREE.DoubleSide;
}

// ---------------------------------------------------------------- labels
const labelsEl = document.getElementById("labels");
const labels = new Labels(labelsEl, camera, renderer.domElement);
const lbDak = labels.add(slab, "DAK BETON", { anchor: [1.0, 0.07, 0.45] });
const lbRebar = labels.add(rebarTop, "TULANGAN", { anchor: [-0.5, 0.05, -0.7] });
const lbCrack = labels.add(crack, "RETAK SUSUT", { anchor: [0.15, 0.09, 0.4] });
const lbMembrane = labels.add(membrane, "WATERPROOFING", { anchor: [-0.9, 0.01, -0.5] });
const lbSlope = labels.add(slab, "KEMIRINGAN 1-2%", { anchor: [1.15, 0.07, -0.4] });
const lbDrain = labels.add(drain, "SALURAN", { anchor: [0, 0.3, 0] });
// solution label: appears only once the assembly is fixed again
const lbFixed = labels.add(slab, "DAK AMAN", { anchor: [0.3, 0.08, 0.0] });
lbFixed.el.classList.add("ok");
lbFixed.line.classList.add("ok");

// ---------------------------------------------------------------- choreography (30 s)
//   0-4 s:  assembled slab, ponding water, slow dolly-in, DAK BETON label
//   4-12 s: staged explode (membrane lifts, rebar separates, slab X-ray,
//           crack glows red, blue water flows to the drain), labels one by one
//  12-20 s: hold fully exploded, all 6 labels visible
//  20-26 s: reverse explode, membrane returns with a green glow (solution),
//           DAK AMAN label, clean water flows over the top to the drain
//  26-30 s: hold assembled, DAK AMAN label
const target = new THREE.Vector3(-0.25, 1.0, 0);
const baseDir = new THREE.Vector3(0.58, 0.40, 1.0).normalize();
const crackDark = new THREE.Color(0x8a150c);
const crackBright = new THREE.Color(0xff2a1a);

// per-label fade: sets opacity on the pill + leader line and tells the layout
// to skip the label while fully transparent (so hidden labels don't reserve space)
function setLabel(item, k) {
  const o = clamp01(k);
  item.alpha = o;
  item.el.style.opacity = o;
  item.line.style.opacity = o;
}

function applyState(t) {
  // explode factor: up 4-12 s, hold to 20 s, reverse 20-26 s
  const eUp = smooth((t - 4) / 8);
  const eDown = smooth((t - 20) / 6);
  const e = eUp * (1 - eDown);
  ex.set(e);

  // slab goes ghostly (x-ray) as it explodes, solid again on the reverse
  slabMat.opacity = 1 - 0.8 * e;
  slabMat.transparent = e > 0.01;
  slabMat.depthWrite = e < 0.4;
  slabMat.needsUpdate = true;

  // crack heats up from dull to neon red with the explode, cools on reverse
  crackMat.color.lerpColors(crackDark, crackBright, 0.3 + 0.7 * e);
  crackGlowMat.opacity = 0.15 + 0.45 * e;
  crackLight.intensity = 0.6 * e;

  // membrane green solution glow: fades in 21-24 s, holds to the end
  const glow = smooth((t - 21) / 3);
  membraneMat.emissive.setHex(0x16a34a);
  membraneMat.emissiveIntensity = 0.5 * glow;

  // ponding drains away 4-7 s, stays gone
  pondMat.opacity = 0.55 * (1 - clamp01((t - 4) / 3));
  pond.visible = pondMat.opacity > 0.01;

  // blue seepage (leak path) follows the explode factor
  flowMat.opacity = e * 0.95;
  // clean top flow (solution): fades in 21-23 s, holds to the end
  const tf = smooth((t - 21) / 2);
  topFlowMat.opacity = tf * 0.9;
  // droplet: leak path while exploded, clean path after the fix
  if (t < 20.5) {
    droplet.visible = e > 0.15;
    if (droplet.visible) {
      const s = ((t - 4) / 6) % 1;
      flowCurve.getPointAt(s, droplet.position);
    }
  } else {
    droplet.visible = tf > 0.15;
    if (droplet.visible) {
      const s = ((t - 21) / 5) % 1;
      topFlowCurve.getPointAt(s, droplet.position);
    }
  }

  // neon slope arrows: in with the explode, out on the reverse
  const a = clamp01((t - 5) / 1.5) * (1 - clamp01((t - 20) / 2));
  arrowMats.forEach((m, i) => { m.opacity = a * (0.6 + 0.4 * Math.sin(t * 3 + i * 1.7)); });

  // labels one by one, following their stage; the six problem labels fade
  // out on the reverse (21-23.5 s), DAK AMAN fades in for the fix
  const out = 1 - smooth((t - 21) / 2.5);
  setLabel(lbDak, smooth((t - 0.5) / 1.5) * out);
  setLabel(lbMembrane, smooth((t - 4.5) / 1) * out);
  setLabel(lbCrack, smooth((t - 6.5) / 1) * out);
  setLabel(lbRebar, smooth((t - 8) / 1) * out);
  setLabel(lbSlope, smooth((t - 9.5) / 1) * out);
  setLabel(lbDrain, smooth((t - 11) / 1) * out);
  setLabel(lbFixed, smooth((t - 22.5) / 2));

  // camera: slow dolly-in 0-4 s, pull back as it explodes, back in on reverse
  const dist = 6.9 - 0.5 * smooth(t / 4) + 0.8 * e;
  const az = 0.05 * Math.sin(t * 0.25);
  const dir = baseDir.clone().applyAxisAngle(new THREE.Vector3(0, 1, 0), az);
  camera.position.copy(target).addScaledVector(dir, dist);
  camera.lookAt(target);
}

// ---------------------------------------------------------------- frame loop
let currentT = 0;
window.__recordFrame = (t) => { currentT = Math.min(t, 30); };

function frame() {
  const t = window.__recording ? currentT : (performance.now() / 1000) % 30;
  applyState(t);
  renderer.render(scene, camera);
  labels.update();
  if (!window.__ready) window.__ready = true;
  requestAnimationFrame(frame);
}
frame();

window.addEventListener("resize", () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});
