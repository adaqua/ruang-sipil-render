// Pile cap strut-and-tie — RuangSipil 3D scene (gaya Civil Xplained).
// 33 s, 3 SHOT dengan HARD CUT, kamera STATIS di dalam tiap shot.
//   S1  0-10.4 s: overview — kolom + pile cap + 4 tiang pancang, panah beban kuning
//   S2 10.4-20.4 s: cap X-ray transparan — 4 strut biru + tulangan bawah oranye (tie)
//   S3 20.4-33 s: split-screen — cap tipis (strut datar, retak merah) vs cap tebal (aman)
// Semua geometri dari kode, tanpa model file. Timeline digerakkan
// window.__recordFrame(t) saat recording, atau rAF live (loop tiap 33 s).
import * as THREE from "three";
import { RoomEnvironment } from "three/addons/environments/RoomEnvironment.js";
import { Labels } from "./explode.js";

const DUR = 33;
const S1_END = 10.4, S2_END = 20.4;
const clamp01 = (x) => Math.min(1, Math.max(0, x));
const smooth = (x) => { const t = clamp01(x); return t * t * (3 - 2 * t); };

// ---------------------------------------------------------------- renderer
const app = document.getElementById("app");
const renderer = new THREE.WebGLRenderer({ antialias: true, preserveDrawingBuffer: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.05;
app.prepend(renderer.domElement);

const scene = new THREE.Scene();
scene.background = new THREE.Color(0xe9edf1);
scene.fog = new THREE.Fog(0xe9edf1, 16, 30);

const camera = new THREE.PerspectiveCamera(42, window.innerWidth / window.innerHeight, 0.1, 60);

const pmrem = new THREE.PMREMGenerator(renderer);
scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;

// ---------------------------------------------------------------- lights
scene.add(new THREE.HemisphereLight(0xe8f0f8, 0x8a7a66, 0.8));
const sun = new THREE.DirectionalLight(0xfff2e0, 2.1);
sun.position.set(4.5, 7, 4);
sun.castShadow = true;
sun.shadow.mapSize.set(2048, 2048);
sun.shadow.camera.left = -5; sun.shadow.camera.right = 5;
sun.shadow.camera.top = 5; sun.shadow.camera.bottom = -5;
sun.shadow.camera.near = 1; sun.shadow.camera.far = 22;
sun.shadow.bias = -0.0005;
sun.shadow.normalBias = 0.02;
scene.add(sun);
const fill = new THREE.DirectionalLight(0xdfe8ff, 0.55);
fill.position.set(-4, 3, -3);
scene.add(fill);

// ---------------------------------------------------------------- textures (prosedural — JANGAN beton polos)
// Beton: abu-abu hangat bertekstur — speckle padat + agregat + garis bekisting.
function concreteTexture() {
  const c = document.createElement("canvas");
  c.width = c.height = 256;
  const g = c.getContext("2d");
  g.fillStyle = "#8d8880";
  g.fillRect(0, 0, 256, 256);
  let s = 987654321;
  const rnd = () => (s = (s * 16807) % 2147483647) / 2147483647;
  // agregat: gumpalan abu-abu gelap/terang
  for (let i = 0; i < 260; i++) {
    const v = 105 + Math.floor(rnd() * 75);
    g.fillStyle = `rgba(${v},${v - 3},${v - 8},${0.25 + rnd() * 0.3})`;
    const r = 2 + rnd() * 5;
    g.beginPath(); g.arc(rnd() * 256, rnd() * 256, r, 0, Math.PI * 2); g.fill();
  }
  // speckle halus padat
  for (let i = 0; i < 9000; i++) {
    const v = 110 + Math.floor(rnd() * 90);
    g.fillStyle = `rgba(${v},${v - 4},${v - 10},${0.15 + rnd() * 0.3})`;
    g.fillRect(rnd() * 256, rnd() * 256, 1 + rnd() * 2, 1 + rnd() * 2);
  }
  // pori gelap kecil
  for (let i = 0; i < 350; i++) {
    g.fillStyle = `rgba(60,56,50,${0.2 + rnd() * 0.3})`;
    g.beginPath(); g.arc(rnd() * 256, rnd() * 256, 0.8 + rnd() * 1.4, 0, Math.PI * 2); g.fill();
  }
  // garis bekisting samar
  g.strokeStyle = "rgba(70,66,58,0.20)";
  g.lineWidth = 1;
  for (let y = 32; y < 256; y += 64) { g.beginPath(); g.moveTo(0, y); g.lineTo(256, y); g.stroke(); }
  const tex = new THREE.CanvasTexture(c);
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

// Lantai kayu: plank cokelat hangat dengan serat + celah antar papan.
function woodTexture() {
  const c = document.createElement("canvas");
  c.width = c.height = 512;
  const g = c.getContext("2d");
  let s = 424242;
  const rnd = () => (s = (s * 16807) % 2147483647) / 2147483647;
  const plankH = 64;
  for (let p = 0; p < 8; p++) {
    const base = 122 + Math.floor(rnd() * 36);
    g.fillStyle = `rgb(${base + 18},${Math.floor(base * 0.62)},${Math.floor(base * 0.36)})`;
    g.fillRect(0, p * plankH, 512, plankH);
    // serat kayu
    for (let i = 0; i < 26; i++) {
      g.strokeStyle = `rgba(70,42,18,${0.08 + rnd() * 0.16})`;
      g.lineWidth = 0.8 + rnd() * 1.4;
      const y = p * plankH + rnd() * plankH;
      g.beginPath(); g.moveTo(0, y);
      g.bezierCurveTo(170, y + rnd() * 6 - 3, 340, y + rnd() * 6 - 3, 512, y + rnd() * 4 - 2);
      g.stroke();
    }
    // celah antar papan + sambungan
    g.fillStyle = "rgba(52,30,12,0.85)";
    g.fillRect(0, p * plankH, 512, 2);
    const jx = rnd() * 512;
    g.fillRect(jx, p * plankH, 2, plankH);
  }
  const tex = new THREE.CanvasTexture(c);
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(3, 3);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

const concreteTex = concreteTexture();
const edgeMat = new THREE.LineBasicMaterial({ color: 0x2b3440 });

// ---------------------------------------------------------------- materials
const concreteMat = new THREE.MeshStandardMaterial({
  map: concreteTex, bumpMap: concreteTex, bumpScale: 0.6,
  roughness: 0.95, metalness: 0.0, envMapIntensity: 0.25,
});
// Cap utama pakai clone sendiri: di S2 hanya cap yang jadi X-ray, kolom tetap solid.
const capMat = concreteMat.clone();
const pileTex = concreteTex.clone();
pileTex.repeat.set(2, 1);
pileTex.needsUpdate = true;
const pileMat = new THREE.MeshStandardMaterial({
  map: pileTex, roughness: 0.95, metalness: 0.0, envMapIntensity: 0.25,
});
const woodMat = new THREE.MeshStandardMaterial({
  map: woodTexture(), roughness: 0.8, metalness: 0.0, envMapIntensity: 0.3,
});
const goldMat = new THREE.MeshStandardMaterial({
  color: 0xe8912d, roughness: 0.35, metalness: 0.75, envMapIntensity: 0.9,
  emissive: 0x7a4a08, emissiveIntensity: 0.25,
});
const strutMat = new THREE.MeshStandardMaterial({
  color: 0x2563eb, roughness: 0.3, metalness: 0.1,
  emissive: 0x1d4ed8, emissiveIntensity: 0.7, envMapIntensity: 0.5,
});
const flowMat = new THREE.MeshBasicMaterial({ color: 0x60a5fa });
const dropMat = new THREE.MeshBasicMaterial({ color: 0x93c5fd });
const arrowMat = new THREE.MeshStandardMaterial({
  color: 0xfacc15, roughness: 0.4, metalness: 0.1,
  emissive: 0xa16207, emissiveIntensity: 0.45, envMapIntensity: 0.5,
});
const crackMat = new THREE.MeshBasicMaterial({ color: 0xdc2626 });

// ---------------------------------------------------------------- helpers
function addEdges(mesh) {
  const edges = new THREE.LineSegments(new THREE.EdgesGeometry(mesh.geometry, 30), edgeMat);
  mesh.add(edges);
  return mesh;
}
function tubeBetween(a, b, r, mat, seg = 12) {
  const dir = b.clone().sub(a);
  const len = dir.length();
  const mesh = new THREE.Mesh(new THREE.CylinderGeometry(r, r, len, seg), mat);
  mesh.position.copy(a).addScaledVector(dir, 0.5);
  mesh.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir.normalize());
  mesh.castShadow = true;
  return mesh;
}

// ---------------------------------------------------------------- lantai kayu
const floor = new THREE.Mesh(new THREE.PlaneGeometry(26, 26), woodMat);
floor.rotation.x = -Math.PI / 2;
floor.position.y = 0;
floor.receiveShadow = true;
scene.add(floor);

// ---------------------------------------------------------------- assembly S1/S2 (satu grup, state berubah per shot)
// Ukuran: tiang r=0.28 h=1.3 di (±0.75, ±0.75); cap 2.4 x 0.9 x 2.4 (y 1.3-2.2);
// kolom 0.8 x 1.6 x 0.8 (y 2.2-3.8). Total tinggi 3.8.
const assembly = new THREE.Group();
scene.add(assembly);

const pileGeo = new THREE.CylinderGeometry(0.28, 0.28, 1.3, 20);
for (const [px, pz] of [[0.75, 0.75], [-0.75, 0.75], [0.75, -0.75], [-0.75, -0.75]]) {
  const pile = addEdges(new THREE.Mesh(pileGeo, pileMat));
  pile.position.set(px, 0.65, pz);
  pile.castShadow = pile.receiveShadow = true;
  assembly.add(pile);
}

const cap = addEdges(new THREE.Mesh(new THREE.BoxGeometry(2.4, 0.9, 2.4), capMat));
cap.position.y = 1.75;
cap.castShadow = cap.receiveShadow = true;
assembly.add(cap);

const column = addEdges(new THREE.Mesh(new THREE.BoxGeometry(0.8, 1.6, 0.8), concreteMat));
column.position.y = 3.0;
column.castShadow = column.receiveShadow = true;
assembly.add(column);

// Panah beban kuning di muka kolom (+z), menunjuk ke bawah.
const arrowShape = new THREE.Shape();
arrowShape.moveTo(-0.09, 0.62); arrowShape.lineTo(0.09, 0.62);
arrowShape.lineTo(0.09, 0.02); arrowShape.lineTo(0.24, 0.02);
arrowShape.lineTo(0, -0.36); arrowShape.lineTo(-0.24, 0.02);
arrowShape.lineTo(-0.09, 0.02); arrowShape.closePath();
const loadArrow = new THREE.Mesh(
  new THREE.ExtrudeGeometry(arrowShape, { depth: 0.06, bevelEnabled: false }), arrowMat);
loadArrow.position.set(0, 3.05, 0.41);
loadArrow.castShadow = true;
assembly.add(loadArrow);

// Strut: 4 silinder biru dari bawah kolom (0, 2.18, 0) ke puncak tiap tiang.
const struts = new THREE.Group();
const strutTop = new THREE.Vector3(0, 2.18, 0);
const strutEnds = [];
for (const [px, pz] of [[0.75, 0.75], [-0.75, 0.75], [0.75, -0.75], [-0.75, -0.75]]) {
  const end = new THREE.Vector3(px, 1.32, pz);
  strutEnds.push(end);
  struts.add(tubeBetween(strutTop, end, 0.10, strutMat));
}
assembly.add(struts);

// Tulangan bawah (tie): anyaman oranye/emas di dasar cap, y = 1.42.
const rebar = new THREE.Group();
{
  const barGeoX = new THREE.CylinderGeometry(0.035, 0.035, 2.2, 8);
  const barGeoZ = new THREE.CylinderGeometry(0.035, 0.035, 2.2, 8);
  for (let k = 0; k < 5; k++) {
    const bx = new THREE.Mesh(barGeoX, goldMat);
    bx.rotation.z = Math.PI / 2;
    bx.position.set(0, 1.42, -0.88 + k * 0.44);
    bx.castShadow = true;
    rebar.add(bx);
    const bz = new THREE.Mesh(barGeoZ, goldMat);
    bz.rotation.x = Math.PI / 2;
    bz.position.set(-0.88 + k * 0.44, 1.42, 0);
    bz.castShadow = true;
    rebar.add(bz);
  }
}
assembly.add(rebar);

// Aliran biru di sepanjang strut (S2): 4 droplet, satu per strut.
const droplets = [];
for (let i = 0; i < 4; i++) {
  const d = new THREE.Mesh(new THREE.SphereGeometry(0.07, 12, 12), dropMat);
  assembly.add(d);
  droplets.push(d);
}

// ---------------------------------------------------------------- mini-scene S3 (split-screen)
// buildMini(thin): kolom + cap + 4 tiang mini. Tipis: cap 0.30 (strut ~14°,
// hampir datar) + retak merah. Tebal: cap 0.85 (strut ~44°) + utuh.
function buildMini(thin) {
  const g = new THREE.Group();
  const pileH = 1.0, capH = thin ? 0.30 : 0.85, colH = 1.1;
  const capW = 1.5, colW = 0.55, pr = 0.17, off = 0.55;
  const capY = pileH + capH / 2;          // pusat cap
  const colY = pileH + capH + colH / 2;   // pusat kolom
  // Cap mini SELALU X-ray (transparan) supaya strut di dalamnya kelihatan —
  // itu inti perbandingan tipis vs tebal. Kolom & tiang tetap solid.
  const miniCapMat = concreteMat.clone();
  miniCapMat.transparent = true;
  miniCapMat.opacity = 0.32;
  miniCapMat.depthWrite = false;
  const mPileGeo = new THREE.CylinderGeometry(pr, pr, pileH + 0.12, 14);
  for (const [px, pz] of [[off, off], [-off, off], [off, -off], [-off, -off]]) {
    const pile = addEdges(new THREE.Mesh(mPileGeo, pileMat));
    pile.position.set(px, (pileH + 0.12) / 2, pz);
    pile.castShadow = pile.receiveShadow = true;
    g.add(pile);
  }
  const mCap = addEdges(new THREE.Mesh(new THREE.BoxGeometry(capW, capH, capW), miniCapMat));
  mCap.position.y = capY;
  mCap.castShadow = mCap.receiveShadow = true;
  g.add(mCap);
  const mCol = addEdges(new THREE.Mesh(new THREE.BoxGeometry(colW, colH, colW), concreteMat));
  mCol.position.y = colY;
  mCol.castShadow = mCol.receiveShadow = true;
  g.add(mCol);
  // strut mini: bawah kolom -> puncak tiang
  const top = new THREE.Vector3(0, pileH + capH - 0.04, 0);
  for (const [px, pz] of [[off, off], [-off, off], [off, -off], [-off, -off]]) {
    g.add(tubeBetween(top, new THREE.Vector3(px, pileH + 0.06, pz), 0.07, strutMat, 10));
  }
  // tulangan bawah mini
  for (let k = -1; k <= 1; k++) {
    const bx = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 1.3, 8), goldMat);
    bx.rotation.z = Math.PI / 2;
    bx.position.set(0, pileH + 0.09, k * 0.5);
    g.add(bx);
    const bz = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 1.3, 8), goldMat);
    bz.rotation.x = Math.PI / 2;
    bz.position.set(k * 0.5, pileH + 0.09, 0);
    g.add(bz);
  }
  let crack = null;
  if (thin) {
    // retak zigzag merah di muka cap (+z) + menyebar ke atas
    const pts = [
      new THREE.Vector3(-0.55, capY - capH / 2 + 0.03, capW / 2 + 0.012),
      new THREE.Vector3(-0.28, capY + 0.02, capW / 2 + 0.012),
      new THREE.Vector3(-0.05, capY - capH / 2 + 0.06, capW / 2 + 0.012),
      new THREE.Vector3(0.22, capY + 0.05, capW / 2 + 0.012),
      new THREE.Vector3(0.48, capY - capH / 2 + 0.04, capW / 2 + 0.012),
    ];
    crack = new THREE.Mesh(
      new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 24, 0.03, 6), crackMat);
    g.add(crack);
    // retak kedua di atas cap (permukaan atas)
    const pts2 = [
      new THREE.Vector3(-0.4, pileH + capH + 0.005, 0.3),
      new THREE.Vector3(-0.1, pileH + capH + 0.005, 0.1),
      new THREE.Vector3(0.2, pileH + capH + 0.005, 0.35),
      new THREE.Vector3(0.45, pileH + capH + 0.005, 0.15),
    ];
    g.add(new THREE.Mesh(
      new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts2), 20, 0.028, 6), crackMat));
  }
  g.userData = { capY, capH, pileH, capW, colY };
  return g;
}

const miniThin = buildMini(true);
miniThin.scale.setScalar(0.80);
miniThin.position.set(-0.82, 0, 0);
scene.add(miniThin);
const miniThick = buildMini(false);
miniThick.scale.setScalar(0.80);
miniThick.position.set(0.82, 0, 0);
scene.add(miniThick);

// ---------------------------------------------------------------- labels (HANYA bahasa Indonesia)
const labelsEl = document.getElementById("labels");
const labels = new Labels(labelsEl, camera, renderer.domElement);
const lbKolom = labels.add(assembly, "KOLOM", { anchor: [0.45, 3.55, 0.45] });
const lbCap = labels.add(assembly, "PILE CAP", { anchor: [1.25, 1.95, 0.55] });
const lbTiang = labels.add(assembly, "TIANG PANCANG", { anchor: [0.78, 0.65, 1.03] });
const lbStrut = labels.add(assembly, "STRUT", { anchor: [0.40, 1.78, 0.40] });
const lbTie = labels.add(assembly, "TIE", { anchor: [0.0, 1.42, 1.08] });
const lbTulangan = labels.add(assembly, "TULANGAN BAWAH", { anchor: [-1.08, 1.42, 0.35] });
const lbTipis = labels.add(miniThin, "CAP TIPIS", { anchor: [0, 1.15, 0.76] });
const lbRetak = labels.add(miniThin, "RETAK", { anchor: [0.35, 1.12, 0.78] });
lbRetak.el.classList.add("bad");
lbRetak.line.classList.add("bad");
const lbTebal = labels.add(miniThick, "CAP TEBAL", { anchor: [0, 1.42, 0.76] });
const lbAman = labels.add(miniThick, "AMAN", { anchor: [0.3, 1.90, 0.76] });
lbAman.el.classList.add("ok");
lbAman.line.classList.add("ok");

function setLabel(item, k) {
  const o = clamp01(k);
  item.alpha = o;
  item.el.style.opacity = o;
  item.line.style.opacity = o;
}

// ---------------------------------------------------------------- kamera per shot (STATIS di dalam shot)
const shots = [
  // S1 overview: isometrik, framing rapat (model 3.8 / visible 5.7 ≈ 67%)
  { target: new THREE.Vector3(0, 1.9, 0), dir: new THREE.Vector3(0.58, 0.42, 1.0).normalize(), dist: 7.4 },
  // S2 x-ray: sudut sedikit beda (hard cut), sedikit lebih dekat
  { target: new THREE.Vector3(0, 1.85, 0), dir: new THREE.Vector3(0.72, 0.33, 1.0).normalize(), dist: 7.0 },
  // S3 split-screen: lebih frontal + menunduk (background lantai kayu penuh,
  // tanpa langit abu-abu kosong), mencakup kedua mini (lebar total ~2.84)
  { target: new THREE.Vector3(0, 1.15, 0), dir: new THREE.Vector3(0.30, 0.45, 1.0).normalize(), dist: 6.9 },
];

// ---------------------------------------------------------------- choreography (33 s)
function applyState(t) {
  const shot = t < S1_END ? 0 : t < S2_END ? 1 : 2;
  const shotStart = shot === 0 ? 0 : shot === 1 ? S1_END : S2_END;
  const fadeIn = smooth((t - shotStart) / 0.4);

  // visibilitas grup per shot
  assembly.visible = shot < 2;
  miniThin.visible = shot === 2;
  miniThick.visible = shot === 2;

  // S1: cap solid, panah beban; S2: cap X-ray transparan, strut + tulangan + aliran
  const ghost = shot === 1;
  capMat.opacity = ghost ? 0.32 : 1;
  capMat.transparent = ghost;
  capMat.depthWrite = !ghost;
  capMat.needsUpdate = true;
  loadArrow.visible = shot === 0;
  struts.visible = shot === 1;
  rebar.visible = shot === 1;

  // droplet biru mengalir di sepanjang strut (S2 saja), loop ~2.2 s
  droplets.forEach((d, i) => {
    d.visible = shot === 1;
    if (d.visible) {
      const s = (((t - S1_END) / 2.2) + i * 0.25) % 1;
      d.position.lerpVectors(strutTop, strutEnds[i], s);
    }
  });

  // label per shot (fade-in cepat 0.4 s setelah hard cut)
  const s1 = shot === 0 ? fadeIn : 0;
  const s2 = shot === 1 ? fadeIn : 0;
  const s3 = shot === 2 ? fadeIn : 0;
  setLabel(lbKolom, s1); setLabel(lbCap, s1); setLabel(lbTiang, s1);
  setLabel(lbStrut, s2); setLabel(lbTie, s2); setLabel(lbTulangan, s2);
  setLabel(lbTipis, s3); setLabel(lbRetak, s3); setLabel(lbTebal, s3); setLabel(lbAman, s3);

  // kamera STATIS per shot — hard cut di batas, tanpa gerakan di dalam shot
  const sh = shots[shot];
  camera.position.copy(sh.target).addScaledVector(sh.dir, sh.dist);
  camera.lookAt(sh.target);
}

// ---------------------------------------------------------------- frame loop
let currentT = 0;
window.__recordFrame = (t) => { currentT = Math.min(t, DUR); };

function frame() {
  const t = window.__recording ? currentT : (performance.now() / 1000) % DUR;
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
