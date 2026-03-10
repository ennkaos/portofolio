import * as THREE from 'three';

const SPROUT_WHITE  = new THREE.Color(0xE8E0D8);
const BARK_DARK     = new THREE.Color(0x3D2510);
const BARK_MID      = new THREE.Color(0x4A3220);
const BARK_LIGHT    = new THREE.Color(0x5C3A1E);
const BRANCH_BROWN  = new THREE.Color(0x6B4A28);
const LEAF_GREEN    = new THREE.Color(0x4A8B3F);
const LEAF_LIGHT    = new THREE.Color(0x6ECB63);
const CANOPY_DEEP   = new THREE.Color(0x2A3D22);
const CANOPY_DARK   = new THREE.Color(0x354A2A);
const CANOPY_MID    = new THREE.Color(0x405830);
const CANOPY_LIGHT  = new THREE.Color(0x4D6B38);
const CANOPY_BRIGHT = new THREE.Color(0x5A7A42);
const CANOPY_WARM   = new THREE.Color(0x6B8A4A);
const CANOPY_SUN    = new THREE.Color(0x7A9A52);

const TRUNK_HEIGHT = 6.0;

function v3(x, y, z) { return new THREE.Vector3(x, y, z); }

function buildTube(curve, segments, baseRadius, tipRadius, radialSegs) {
  radialSegs = radialSegs || 8;
  const geo = new THREE.TubeGeometry(curve, segments, baseRadius, radialSegs, false);
  const pos = geo.attributes.position;
  const vpr = radialSegs + 1;
  for (let i = 0; i < pos.count; i++) {
    const ring = Math.floor(i / vpr);
    const t = ring / segments;
    const c = curve.getPointAt(Math.min(t, 1));
    const taper = THREE.MathUtils.lerp(1.0, tipRadius / baseRadius, t);
    pos.setXYZ(i,
      c.x + (pos.getX(i) - c.x) * taper,
      c.y + (pos.getY(i) - c.y) * taper,
      c.z + (pos.getZ(i) - c.z) * taper,
    );
  }
  geo.computeVertexNormals();
  return geo;
}

function makeCanopyGeo(radius, seed) {
  const s = seed || 0;
  const geo = new THREE.IcosahedronGeometry(radius, 3);
  const pos = geo.attributes.position;

  const flatness = 0.5 + Math.sin(s * 6.28) * 0.2;
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i), y = pos.getY(i), z = pos.getZ(i);

    const n1 = Math.sin(x * 6 + y * 4 + s) * 0.10;
    const n2 = Math.cos(z * 5 + x * 3 + s * 1.3) * 0.07;
    const n3 = Math.sin(x * 11 + z * 9 + s * 1.8) * 0.04;
    const n = n1 + n2 + n3;

    const yNorm = y / radius;
    const yMod = yNorm < -0.25 ? 0.84 : (1.0 + Math.max(yNorm, 0) * 0.06);
    const stretch = 0.98 + Math.sin(x * 4 + z * 3 + s) * 0.03;
    const squash = 1.0 - Math.abs(yNorm) * flatness * 0.15;

    pos.setXYZ(i, x * (1 + n) * stretch * squash, y * (1 + n * 0.35) * yMod, z * (1 + n) / stretch * squash);
  }

  geo.computeVertexNormals();
  return geo;
}

// ── Procedural bark shader ──

const BARK_COMPILE = (shader) => {
  shader.vertexShader = shader.vertexShader.replace(
    '#include <common>',
    '#include <common>\nvarying vec3 vBarkPos;'
  );
  shader.vertexShader = shader.vertexShader.replace(
    '#include <begin_vertex>',
    '#include <begin_vertex>\nvBarkPos = position;'
  );
  shader.fragmentShader = shader.fragmentShader.replace(
    '#include <common>',
    `#include <common>
    varying vec3 vBarkPos;
    float bkH(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
    float bkN(vec2 p){
      vec2 i=floor(p);vec2 f=fract(p);f=f*f*(3.0-2.0*f);
      return mix(mix(bkH(i),bkH(i+vec2(1,0)),f.x),mix(bkH(i+vec2(0,1)),bkH(i+vec2(1,1)),f.x),f.y);
    }`
  );
  shader.fragmentShader = shader.fragmentShader.replace(
    '#include <color_fragment>',
    `#include <color_fragment>
    float bA=atan(vBarkPos.z,vBarkPos.x);
    float groove=bkN(vec2(bA*8.0,vBarkPos.y*28.0));
    float groove2=bkN(vec2(bA*3.0,vBarkPos.y*12.0))*0.5;
    float det=bkN(vBarkPos.xy*42.0)*0.25;
    float vary=bkN(vBarkPos.yx*5.0)*0.2;
    float yNorm=(vBarkPos.y+0.5)/6.5;
    diffuseColor.rgb*=0.75+det+vary;
    diffuseColor.rgb=mix(diffuseColor.rgb,diffuseColor.rgb*0.42,smoothstep(0.3,0.55,groove)*0.58);
    diffuseColor.rgb=mix(diffuseColor.rgb,diffuseColor.rgb*0.7,smoothstep(0.4,0.6,groove2)*0.35);
    diffuseColor.rgb*=0.92+0.08*(1.0-yNorm);`
  );
};

const CANOPY_COMPILE = (shader) => {
  shader.vertexShader = shader.vertexShader.replace(
    '#include <common>',
    '#include <common>\nvarying vec3 vCNorm;\nvarying vec3 vCPos;'
  );
  shader.vertexShader = shader.vertexShader.replace(
    '#include <begin_vertex>',
    '#include <begin_vertex>\nvCNorm = normal;\nvCPos = position;'
  );
  shader.fragmentShader = shader.fragmentShader.replace(
    '#include <common>',
    `#include <common>
    varying vec3 vCNorm;
    varying vec3 vCPos;

    float lfH(vec2 p){ return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453); }
    float lfN(vec2 p){
      vec2 i=floor(p); vec2 f=fract(p); f=f*f*(3.0-2.0*f);
      return mix(mix(lfH(i),lfH(i+vec2(1,0)),f.x),mix(lfH(i+vec2(0,1)),lfH(i+vec2(1,1)),f.x),f.y);
    }
    float lfFBM(vec2 p){
      float v=0.0,a=0.5;
      v+=a*lfN(p); p*=2.0; a*=0.5;
      v+=a*lfN(p); p*=2.0; a*=0.5;
      v+=a*lfN(p);
      return v;
    }`
  );
  shader.fragmentShader = shader.fragmentShader.replace(
    '#include <color_fragment>',
    `#include <color_fragment>

    float fbm = lfFBM(vCPos.xz * 3.0);
    float micro = lfN(vCPos.xz * 18.0) * 0.5 + 0.5;
    float hueVar = lfN(vCPos.yz * 7.0) * 0.5 + lfN(vCPos.xy * 11.0) * 0.3;
    float vary = (fbm * 0.28 + micro * 0.1 - 0.1);

    diffuseColor.rgb *= (0.95 + vary);
    diffuseColor.rgb = mix(diffuseColor.rgb, diffuseColor.rgb * vec3(1.05, 1.02, 0.92), hueVar * 0.25);
    diffuseColor.rgb = mix(diffuseColor.rgb, diffuseColor.rgb * vec3(0.92, 1.02, 0.95), (1.0 - hueVar) * 0.2);

    float NdotU = vCNorm.y;
    float sunLit = smoothstep(-0.15, 0.5, NdotU) * 0.055;
    float shadow = smoothstep(0.25, -0.25, NdotU) * 0.1;
    float sss = smoothstep(-0.1, -0.5, NdotU) * 0.045;

    diffuseColor.rgb += vec3(sunLit * 0.5, sunLit * 0.8, sunLit * 0.15);
    diffuseColor.rgb -= vec3(shadow * 0.35, shadow * 0.45, shadow * 0.15);
    diffuseColor.rgb += vec3(sss * 0.5, sss * 0.85, sss * 0.12);`
  );
};

function makeBarkMat() {
  const mat = new THREE.MeshStandardMaterial({
    color: SPROUT_WHITE.clone(), roughness: 0.7, metalness: 0.05,
    emissive: SPROUT_WHITE.clone(), emissiveIntensity: 0.05,
  });
  mat.onBeforeCompile = BARK_COMPILE;
  return mat;
}

function makeWhiteMat() {
  return new THREE.MeshStandardMaterial({
    color: SPROUT_WHITE.clone(), roughness: 0.7, metalness: 0.05,
    emissive: SPROUT_WHITE.clone(), emissiveIntensity: 0.05,
  });
}

function makeThinMat(color) {
  return new THREE.MeshStandardMaterial({
    color: color.clone(), roughness: 0.88, metalness: 0.0,
    emissive: color.clone(), emissiveIntensity: 0.02,
  });
}

function branchCurve(origin, angle, reach, rise) {
  const c = Math.cos(angle), s = Math.sin(angle);
  const px = -s, pz = c;
  const w = reach * 0.04;
  return new THREE.CatmullRomCurve3([
    origin.clone(),
    origin.clone().add(v3(reach * 0.25 * c + w * px, rise * 0.22, reach * 0.25 * s + w * pz)),
    origin.clone().add(v3(reach * 0.50 * c - w * px * 0.6, rise * 0.48, reach * 0.50 * s - w * pz * 0.6)),
    origin.clone().add(v3(reach * 0.75 * c + w * px * 0.3, rise * 0.74, reach * 0.75 * s + w * pz * 0.3)),
    origin.clone().add(v3(reach * c, rise, reach * s)),
  ]);
}

export class Sprout {
  constructor() {
    this.group = new THREE.Group();
    this.progress = 0;
    this.maturity = 0;
    this.fullGrowth = 0;
    this.primaryBranches = [];
    this.secondaryBranches = [];
    this.tertiaryBranches = [];
    this.buds = [];
    this.leaves = [];
    this.canopyClusters = [];

    this._buildTrunk();
    this._buildPrimary();
    this._buildSecondary();
    this._buildTertiary();
    this._buildBuds();
    this._buildLeaves();
    this._buildCanopy();
    this.group.visible = false;
  }

  // ── Trunk — taller (6.0 units) ───────────────────────────

  _buildTrunk() {
    const pts = [
      v3(0, -0.08, 0),
      v3(0.015, -0.04, 0.01),
      v3(0.02, 0.15, 0.01),
      v3(0.02, 0.5, 0.01),  v3(-0.03, 1.0, -0.02),
      v3(0.01, 1.5, 0.02), v3(-0.02, 2.0, -0.01), v3(0.02, 2.5, 0.01),
      v3(0.0, 3.0, -0.02), v3(-0.01, 3.5, 0.01),  v3(0.01, 4.0, -0.01),
      v3(-0.01, 4.5, 0.01), v3(0.0, 5.0, -0.01),  v3(0.01, 5.5, 0.0),
      v3(0.0, 6.0, 0.01),
    ];
    this.trunkCurve = new THREE.CatmullRomCurve3(pts);
    const geo = buildTube(this.trunkCurve, 200, 0.095, 0.016, 12);
    const pos = geo.attributes.position;
    const vpr = 13;
    const rings = Math.floor(pos.count / vpr);
    for (let r = 0; r < Math.min(rings, 10); r++) {
      const t = r / 200;
      if (t < 0.05) {
        const flare = 1.0 + (1.0 - t / 0.05) * 0.45;
        const c = this.trunkCurve.getPointAt(Math.min(t, 1));
        for (let v = 0; v < vpr; v++) {
          const i = r * vpr + v;
          const ix = pos.getX(i), iy = pos.getY(i), iz = pos.getZ(i);
          pos.setXYZ(i, c.x + (ix - c.x) * flare, c.y + (iy - c.y) * flare, c.z + (iz - c.z) * flare);
        }
      }
    }
    geo.computeVertexNormals();
    this.trunkTotal = geo.index ? geo.index.count : geo.attributes.position.count;
    geo.setDrawRange(0, 0);
    this.trunkMat = makeBarkMat();
    this.trunkMesh = new THREE.Mesh(geo, this.trunkMat);
    this.group.add(this.trunkMesh);

    this._buildRoots();
  }

  _buildRoots() {
    const rootCurves = [];
    const rnd = (s) => (Math.abs(Math.sin(s * 12.9898) * 43758.5453) % 1);
    for (let i = 0; i < 6; i++) {
      const angle = (i / 6) * Math.PI * 2 + rnd(i * 3.7) * 0.4;
      const ca = Math.cos(angle), sa = Math.sin(angle);
      const reach = 0.22 + rnd(i * 5.7) * 0.12;
      const drop = -0.1 - rnd(i * 7.1) * 0.08;
      const curve = new THREE.CatmullRomCurve3([
        v3(0.04 * ca, -0.02, 0.04 * sa),
        v3(reach * 0.35 * ca, 0.08, reach * 0.35 * sa),
        v3(reach * 0.7 * ca, drop * 0.5, reach * 0.7 * sa),
        v3(reach * ca, drop, reach * sa),
      ]);
      rootCurves.push(curve);
    }
    this.rootMeshes = [];
    rootCurves.forEach((curve, i) => {
      const geo = buildTube(curve, 32, 0.028, 0.01, 8);
      const mat = makeBarkMat();
      const mesh = new THREE.Mesh(geo, mat);
      this.group.add(mesh);
      this.rootMeshes.push({ mesh, mat });
    });
  }

  // ── 12 Primary limbs — short enough to hide under canopy ─

  _buildPrimary() {
    const specs = [
      // Lower tier: spread wide but short
      { t: 0.35, a: 0.00,  d: 0.65, h: -0.06, r: 0.028, tr: 0.007 },
      { t: 0.38, a: 2.27,  d: 0.60, h: -0.04, r: 0.026, tr: 0.007 },
      { t: 0.42, a: 4.28,  d: 0.58, h: -0.02, r: 0.024, tr: 0.006 },
      // Mid tier
      { t: 0.48, a: 0.96,  d: 0.52, h: 0.15,  r: 0.022, tr: 0.006 },
      { t: 0.52, a: 3.23,  d: 0.50, h: 0.18,  r: 0.021, tr: 0.006 },
      { t: 0.56, a: 5.41,  d: 0.48, h: 0.14,  r: 0.020, tr: 0.005 },
      // Upper tier
      { t: 0.62, a: 0.35,  d: 0.40, h: 0.35,  r: 0.018, tr: 0.005 },
      { t: 0.67, a: 2.71,  d: 0.38, h: 0.38,  r: 0.017, tr: 0.005 },
      { t: 0.72, a: 4.80,  d: 0.35, h: 0.33,  r: 0.016, tr: 0.004 },
      // Crown tier
      { t: 0.78, a: 1.66,  d: 0.28, h: 0.45,  r: 0.014, tr: 0.004 },
      { t: 0.84, a: 3.67,  d: 0.25, h: 0.48,  r: 0.013, tr: 0.003 },
      { t: 0.90, a: 5.93,  d: 0.22, h: 0.44,  r: 0.012, tr: 0.003 },
    ];

    specs.forEach((sp) => {
      const origin = this.trunkCurve.getPointAt(sp.t);
      const curve = branchCurve(origin, sp.a, sp.d, sp.h);
      const geo = buildTube(curve, 80, sp.r, sp.tr);
      const total = geo.index ? geo.index.count : geo.attributes.position.count;
      geo.setDrawRange(0, 0);
      const mat = makeBarkMat();
      const mesh = new THREE.Mesh(geo, mat);
      this.group.add(mesh);
      this.primaryBranches.push({ mesh, geo, total, trunkT: sp.t, curve, mat, angle: sp.a, bp: 0 });
    });
  }

  // ── 30 Secondary — grow during sprout phase, start white ─

  _buildSecondary() {
    this.primaryBranches.forEach((parent, pIdx) => {
      const forks = pIdx < 6 ? [0.40, 0.65, 0.85] : [0.50, 0.80];
      forks.forEach((ft, si) => {
        const origin = parent.curve.getPointAt(ft);
        const forkAngle = parent.angle + (si % 2 === 0 ? 1.05 : -1.05) + (si === 2 ? 0.5 : 0);
        const reach = (0.20 + (pIdx < 4 ? 0.05 : 0)) * (1.1 - ft * 0.2);
        const rise = 0.12 + ft * 0.10;
        const ca = Math.cos(forkAngle), sa = Math.sin(forkAngle);
        const w = reach * 0.03;
        const curve = new THREE.CatmullRomCurve3([
          origin.clone(),
          origin.clone().add(v3(reach * 0.33 * ca + w, rise * 0.33, reach * 0.33 * sa - w)),
          origin.clone().add(v3(reach * 0.67 * ca - w * 0.5, rise * 0.67, reach * 0.67 * sa + w * 0.5)),
          origin.clone().add(v3(reach * ca, rise, reach * sa)),
        ]);
        const geo = buildTube(curve, 40, 0.007, 0.0025);
        const total = geo.index ? geo.index.count : geo.attributes.position.count;
        geo.setDrawRange(0, 0);
        const mat = makeWhiteMat();
        const mesh = new THREE.Mesh(geo, mat);
        mesh.visible = false;
        this.group.add(mesh);
        this.secondaryBranches.push({ mesh, geo, total, parentIdx: pIdx, curve, mat, angle: forkAngle });
      });
    });
  }

  // ── 30 Tertiary twigs — grow during full growth phase ────

  _buildTertiary() {
    this.secondaryBranches.forEach((parent, idx) => {
      const origin = parent.curve.getPointAt(0.65);
      const forkAngle = parent.angle + (idx % 2 === 0 ? 0.8 : -0.8);
      const seed = Math.sin(idx * 7.3 + 2.1) * 0.5 + 0.5;
      const reach = 0.10 + seed * 0.05;
      const rise = 0.08 + seed * 0.05;
      const ca = Math.cos(forkAngle), sa = Math.sin(forkAngle);
      const curve = new THREE.CatmullRomCurve3([
        origin.clone(),
        origin.clone().add(v3(reach * 0.5 * ca, rise * 0.5, reach * 0.5 * sa)),
        origin.clone().add(v3(reach * ca, rise, reach * sa)),
      ]);
      const geo = buildTube(curve, 20, 0.003, 0.001);
      const total = geo.index ? geo.index.count : geo.attributes.position.count;
      geo.setDrawRange(0, 0);
      const mat = makeThinMat(BRANCH_BROWN);
      const mesh = new THREE.Mesh(geo, mat);
      mesh.visible = false;
      this.group.add(mesh);
      this.tertiaryBranches.push({ mesh, geo, total, parentIdx: idx, curve, mat, angle: forkAngle });
    });
  }

  // ── Buds ─────────────────────────────────────────────────

  _buildBuds() {
    const positions = [
      { parent: 'trunk', t: 0.95 },
      { parent: 'trunk', t: 1.0 },
      ...this.primaryBranches.map((_, i) => ({ parent: i, t: 0.95 })),
    ];
    positions.forEach(def => {
      const g = new THREE.Group();
      const geo = new THREE.SphereGeometry(0.012, 8, 6);
      const p = geo.attributes.position;
      for (let i = 0; i < p.count; i++) {
        const y = p.getY(i);
        if (y > 0) {
          p.setY(i, y * 2.2);
          const s = 1.0 - y / 0.012 * 0.4;
          p.setX(i, p.getX(i) * s);
          p.setZ(i, p.getZ(i) * s);
        }
      }
      geo.computeVertexNormals();
      const mat = new THREE.MeshStandardMaterial({
        color: 0xF0ECE6, roughness: 0.5, emissive: 0xF0ECE6, emissiveIntensity: 0.08,
      });
      g.add(new THREE.Mesh(geo, mat));
      g.scale.set(0, 0, 0);
      this.buds.push({ mesh: g, ...def });
      this.group.add(g);
    });
  }

  // ── Individual leaves (maturation, fade during full growth) ──

  _buildLeaves() {
    const defs = [];
    this.primaryBranches.forEach((_, i) => {
      defs.push({ parent: i, t: 0.4, side: 1, rotZ: 0.7 + i * 0.05 });
      defs.push({ parent: i, t: 0.65, side: -1, rotZ: -0.6 - i * 0.04 });
      if (i < 8) defs.push({ parent: i, t: 0.85, side: 1, rotZ: 0.5 + i * 0.06 });
    });
    defs.push({ parent: 'trunk', t: 0.88, side: 1, rotZ: 0.8 });
    defs.push({ parent: 'trunk', t: 0.94, side: -1, rotZ: -0.7 });

    defs.forEach((def, idx) => {
      const lg = new THREE.Group();

      // Oak-lobed leaf shape
      const shape = new THREE.Shape();
      const h = 0.10 + Math.sin(idx * 1.3) * 0.015;
      const w = 0.028;
      shape.moveTo(0, 0);
      const lobes = 4;
      for (let l = 0; l < lobes; l++) {
        const t0 = l / lobes, t1 = (l + 0.5) / lobes, t2 = (l + 1) / lobes;
        const wb = w * (0.6 + 0.4 * Math.sin((t1) * Math.PI));
        shape.bezierCurveTo(wb * 0.7, h * (t0 + 0.08), wb, h * t1, wb * 0.5, h * t2);
      }
      shape.lineTo(0, h);
      for (let l = lobes - 1; l >= 0; l--) {
        const t0 = l / lobes, t1 = (l + 0.5) / lobes, t2 = (l + 1) / lobes;
        const wb = w * (0.6 + 0.4 * Math.sin((t1) * Math.PI));
        shape.bezierCurveTo(-wb * 0.5, h * t2, -wb, h * t1, -wb * 0.7, h * t0 + h * 0.08);
      }
      shape.lineTo(0, 0);
      const geo = new THREE.ShapeGeometry(shape, 8);

      const leafColor = LEAF_GREEN.clone().lerp(LEAF_LIGHT, Math.sin(idx * 2.7) * 0.3 + 0.3);
      const mat = new THREE.MeshStandardMaterial({
        color: leafColor, roughness: 0.55,
        emissive: LEAF_GREEN.clone(), emissiveIntensity: 0.05,
        side: THREE.DoubleSide,
      });

      const leaf = new THREE.Mesh(geo, mat);
      leaf.rotation.z = def.rotZ;
      leaf.rotation.y = Math.sin(idx * 1.9) * 0.3;
      leaf.position.x = def.side * 0.015;
      lg.add(leaf);
      lg.scale.set(0, 0, 0);
      this.leaves.push({ mesh: lg, mat, ...def });
      this.group.add(lg);
    });
  }

  // ── Canopy — few large clusters, circular and wide ─────

  _buildCanopy() {
    const defs = [];

    const rnd = (seed) => (Math.abs(Math.sin(seed * 12.9898) * 43758.5453) % 1);
    const rnd2 = (s1, s2) => rnd(s1 * 31 + s2 * 7.7);

    const rings = [
      { y: 2.7, rad: 1.12, n: 8 },
      { y: 3.3, rad: 1.1,  n: 8 },
      { y: 3.9, rad: 1.05, n: 8 },
      { y: 4.5, rad: 1.0,  n: 8 },
      { y: 5.2, rad: 0.78, n: 6 },
    ];
    rings.forEach((ring, ri) => {
      for (let i = 0; i < ring.n; i++) {
        const a = (i / ring.n) * Math.PI * 2 + rnd2(ri * 7, i) * 0.8 - 0.4;
        const rad = ring.rad * (0.85 + rnd2(ri * 11, i * 3) * 0.3);
        const yOff = (rnd2(ri * 13, i * 5) - 0.5) * 0.25;
        defs.push({ src: 'pos', pos: v3(Math.cos(a) * rad, ring.y + yOff, Math.sin(a) * rad), r: 0.32 + rnd2(ri * 17, i * 7) * 0.12 });
      }
    });

    const topPt = this.trunkCurve.getPointAt(0.96);
    for (let i = 0; i < 5; i++) {
      const x = (rnd2(20, i) - 0.5) * 0.28;
      const y = 0.12 + rnd2(21, i) * 0.14;
      const z = (rnd2(22, i) - 0.5) * 0.28;
      defs.push({ src: 'pos', pos: topPt.clone().add(v3(x, y, z)), r: 0.30 + rnd2(23, i) * 0.1 });
    }

    defs.forEach((def, i) => {
      const geo = makeCanopyGeo(def.r, i * 3.17);
      let pos;
      if (def.src === 'pos') {
        pos = def.pos;
      } else {
        let curve;
        if (def.src === 'trunk') curve = this.trunkCurve;
        else if (def.src === 'primary') curve = this.primaryBranches[def.idx].curve;
        else if (def.src === 'secondary') curve = this.secondaryBranches[def.idx].curve;
        else curve = this.tertiaryBranches[def.idx].curve;
        pos = curve.getPointAt(Math.min(def.t, 1));
      }

      const heightFactor = THREE.MathUtils.clamp(pos.y / TRUNK_HEIGHT, 0, 1);
      const variation = Math.sin(i * 5.7 + 1.3) * 0.5 + 0.5;
      const shade = THREE.MathUtils.clamp(heightFactor * 0.55 + variation * 0.45, 0, 1);
      const palette = [CANOPY_DEEP, CANOPY_DARK, CANOPY_MID, CANOPY_LIGHT, CANOPY_BRIGHT, CANOPY_WARM, CANOPY_SUN];
      const pIdx = shade * (palette.length - 1);
      const lo = Math.floor(pIdx), hi = Math.min(lo + 1, palette.length - 1);
      const color = palette[lo].clone().lerp(palette[hi], pIdx - lo);

      const roughVar = 0.90 + Math.sin(i * 2.9) * 0.05;
      const mat = new THREE.MeshStandardMaterial({
        color, roughness: roughVar, metalness: 0.0,
        emissive: new THREE.Color(0x1A2815), emissiveIntensity: 0.02,
      });
      mat.onBeforeCompile = CANOPY_COMPILE;

      const mesh = new THREE.Mesh(geo, mat);
      mesh.visible = false;
      mesh.scale.set(0, 0, 0);
      mesh.position.copy(pos);
      mesh.renderOrder = Math.floor((pos.z + 1.5) * 3 + pos.y * 2);
      const rx = rnd(i * 4.1) * 0.6 - 0.3;
      const ry = rnd(i * 5.3) * Math.PI * 2;
      const rz = rnd(i * 6.7) * 0.5 - 0.25;
      mesh.rotation.set(rx, ry, rz);
      this.group.add(mesh);
      this.canopyClusters.push({ mesh, mat, ...def });
    });
  }

  // ── Phase 2: sprout — trunk + primaries + secondaries ────

  setProgress(p) {
    this.progress = THREE.MathUtils.clamp(p, 0, 1);
    if (this.progress <= 0) { this.group.visible = false; return; }
    this.group.visible = true;

    const tp = THREE.MathUtils.clamp(p / 0.35, 0, 1);
    this.trunkMesh.geometry.setDrawRange(0, Math.floor(this.trunkTotal * tp));

    this.primaryBranches.forEach(b => {
      if (tp >= b.trunkT) {
        const start = 0.35 * b.trunkT + 0.08;
        b.bp = THREE.MathUtils.clamp((p - start) / 0.28, 0, 1);
        b.geo.setDrawRange(0, Math.floor(b.total * b.bp));
      } else {
        b.bp = 0;
        b.geo.setDrawRange(0, 0);
      }
    });

    // Secondaries fork off primaries once parent is ~45% grown
    this.secondaryBranches.forEach(sb => {
      const parentBP = this.primaryBranches[sb.parentIdx].bp;
      if (parentBP > 0.45) {
        sb.mesh.visible = true;
        const sbp = THREE.MathUtils.clamp((parentBP - 0.45) / 0.55, 0, 1);
        sb.geo.setDrawRange(0, Math.floor(sb.total * sbp));
      } else {
        sb.mesh.visible = false;
        sb.geo.setDrawRange(0, 0);
      }
    });

    this.buds.forEach(bud => {
      let pp = 0;
      if (bud.parent === 'trunk') pp = tp;
      else {
        const b = this.primaryBranches[bud.parent];
        pp = b.bp;
      }
      if (pp >= bud.t * 0.9) {
        const e = THREE.MathUtils.clamp((pp - bud.t * 0.9) / 0.1, 0, 1);
        const s = e * e * (3 - 2 * e) * THREE.MathUtils.lerp(1, 0, this.maturity);
        bud.mesh.scale.setScalar(s);
        const curve = bud.parent === 'trunk' ? this.trunkCurve : this.primaryBranches[bud.parent].curve;
        bud.mesh.position.copy(curve.getPointAt(Math.min(bud.t, 1)));
      } else {
        bud.mesh.scale.setScalar(0);
      }
    });
  }

  // ── Phase 3: maturation — white→brown, leaves ────────────

  setMaturity(m) {
    this.maturity = THREE.MathUtils.clamp(m, 0, 1);
    const rootReveal = THREE.MathUtils.smoothstep(m, 0.25, 0.6);
    const trunkThick = 1.0 + this.fullGrowth * 2.5;
    this.rootMeshes.forEach((r) => {
      r.mesh.visible = rootReveal > 0.01;
      r.mesh.scale.set(trunkThick * rootReveal, rootReveal, trunkThick * rootReveal);
    });
    this._updateColors();
    this._updateScale();
    this._updateLeaves();
  }

  // ── Phase 4: full growth — tertiaries, canopy, thickening ─

  setFullGrowth(fg) {
    this.fullGrowth = THREE.MathUtils.clamp(fg, 0, 1);
    this._updateScale();

    const trunkThick = 1.0 + fg * 2.5;
    this.trunkMesh.scale.set(trunkThick, 1, trunkThick);
    const rootReveal = THREE.MathUtils.smoothstep(this.maturity, 0.25, 0.6);
    this.rootMeshes.forEach((r) => r.mesh.scale.set(trunkThick * rootReveal, rootReveal, trunkThick * rootReveal));

    this.primaryBranches.forEach(b => {
      const bt = 1.0 + fg * 1.2;
      b.mesh.scale.set(bt, 1, bt);
    });

    this.secondaryBranches.forEach(b => {
      const bt = 1.0 + fg * 0.5;
      b.mesh.scale.set(bt, 1, bt);
    });

    this.tertiaryBranches.forEach((b, i) => {
      if (fg > 0.08) {
        b.mesh.visible = true;
        const stagger = (i / this.tertiaryBranches.length) * 0.25;
        const bp = THREE.MathUtils.clamp((fg - 0.08 - stagger) / 0.4, 0, 1);
        b.geo.setDrawRange(0, Math.floor(b.total * bp));
      } else {
        b.mesh.visible = false;
      }
    });

    this.canopyClusters.forEach((c, i) => {
      const stagger = (i / this.canopyClusters.length) * 0.2;
      const cp = THREE.MathUtils.clamp((fg - 0.04 - stagger) / 0.4, 0, 1);
      const ease = cp * cp * (3 - 2 * cp);
      const scaleVar = 0.96 + Math.sin(i * 4.7 + 1.2) * 0.06;
      if (ease > 0.001) {
        c.mesh.visible = true;
        c.mesh.scale.setScalar(ease * 1.35 * scaleVar);
        c.mat.emissiveIntensity = 0.02 + fg * 0.02;
      } else {
        c.mesh.visible = false;
        c.mesh.scale.setScalar(0);
      }
    });

    this._updateLeaves();
  }

  _updateColors() {
    const m = this.maturity;

    this.trunkMat.color.copy(SPROUT_WHITE).lerp(BARK_DARK, m);
    this.trunkMat.emissive.copy(SPROUT_WHITE).lerp(BARK_DARK, m);
    this.rootMeshes.forEach((r) => {
      r.mat.color.copy(SPROUT_WHITE).lerp(BARK_DARK, m);
      r.mat.emissive.copy(SPROUT_WHITE).lerp(BARK_DARK, m);
    });
    this.trunkMat.roughness = THREE.MathUtils.lerp(0.7, 0.94, m);
    this.trunkMat.emissiveIntensity = THREE.MathUtils.lerp(0.05, 0.02, m);

    this.primaryBranches.forEach(b => {
      b.mat.color.copy(SPROUT_WHITE).lerp(BARK_MID, m);
      b.mat.emissive.copy(SPROUT_WHITE).lerp(BARK_MID, m);
      b.mat.roughness = THREE.MathUtils.lerp(0.7, 0.92, m);
      b.mat.emissiveIntensity = THREE.MathUtils.lerp(0.05, 0.02, m);
    });

    this.secondaryBranches.forEach(b => {
      b.mat.color.copy(SPROUT_WHITE).lerp(BARK_LIGHT, m);
      b.mat.emissive.copy(SPROUT_WHITE).lerp(BARK_LIGHT, m);
      b.mat.roughness = THREE.MathUtils.lerp(0.7, 0.88, m);
      b.mat.emissiveIntensity = THREE.MathUtils.lerp(0.05, 0.02, m);
    });
  }

  _updateScale() {
    const m = this.maturity;
    const fg = this.fullGrowth;
    const thicken = 1.0 + m * 0.8 + fg * 1.2;
    this.group.scale.set(thicken, 1.0 + m * 0.3 + fg * 0.4, thicken);
  }

  _updateLeaves() {
    const m = this.maturity;
    const fg = this.fullGrowth;
    const leafFade = fg > 0.20 ? 1.0 - THREE.MathUtils.clamp((fg - 0.20) / 0.30, 0, 1) : 1.0;

    this.leaves.forEach(leaf => {
      const parentBP = leaf.parent === 'trunk'
        ? THREE.MathUtils.clamp(this.progress / 0.35, 0, 1)
        : (this.primaryBranches[leaf.parent].bp || 0);
      if (parentBP >= leaf.t * 0.8 && m > 0.1 && leafFade > 0.01) {
        const grow = THREE.MathUtils.clamp((m - 0.1) / 0.6, 0, 1);
        const s = grow * grow * (3 - 2 * grow);
        leaf.mesh.scale.setScalar(s * 1.5 * leafFade);
        const cb = THREE.MathUtils.clamp(m / 0.8, 0, 1);
        leaf.mat.color.copy(LEAF_GREEN).lerp(LEAF_LIGHT, cb * 0.5);
        leaf.mat.emissiveIntensity = 0.05 + cb * 0.1;
        const curve = leaf.parent === 'trunk' ? this.trunkCurve : this.primaryBranches[leaf.parent].curve;
        leaf.mesh.position.copy(curve.getPointAt(Math.min(leaf.t, 1)));
      } else {
        leaf.mesh.scale.setScalar(0);
      }
    });
  }

  getHeight() { return this.progress * TRUNK_HEIGHT; }

  triggerRustle() {
    this._rustleTime = 1;
  }

  update(time) {
    if (this.progress <= 0.1) return;

    if (this._rustleTime > 0) {
      this._rustleTime -= 0.03;
      const burst = this._rustleTime * Math.sin(time * 25) * 0.04;
      this.group.rotation.z += burst;
      this.group.rotation.x += burst * 0.7;
    }

    const windBase = Math.sin(time * 0.9) * 0.5 + Math.sin(time * 0.4) * 0.3;
    const windGust = Math.max(0, Math.sin(time * 0.15) * 2 - 1.2) * 0.6;
    const windStr = 1.0 + windGust;

    const sway = this.progress * 0.008 * windStr;
    this.group.rotation.z = (Math.sin(time * 0.7) * 0.7 + Math.sin(time * 0.3) * 0.3) * sway;
    this.group.rotation.x = (Math.cos(time * 0.5) * 0.6 + Math.cos(time * 0.2) * 0.2) * sway;

    if (this.maturity > 0.2 && this.fullGrowth < 0.5) {
      const leafWind = 0.18 * windStr;
      this.leaves.forEach((leaf, i) => {
        if (leaf.mesh.scale.x > 0.01) {
          leaf.mesh.rotation.y = Math.sin(time * 2.5 + i * 1.3) * leafWind;
          leaf.mesh.rotation.x = Math.cos(time * 1.8 + i * 0.9) * leafWind * 0.5;
        }
      });
    }

    if (this.fullGrowth > 0.2) {
      const crownWind = 0.035 * windStr * this.fullGrowth;
      this.canopyClusters.forEach((c, i) => {
        if (c.mesh.visible) {
          const phase = i * 0.6 + time * 0.4;
          c.mesh.rotation.y = (Math.sin(phase) * 0.6 + Math.sin(phase * 2.1) * 0.4) * crownWind;
          c.mesh.rotation.x = (Math.cos(phase * 1.3) * 0.5 + Math.cos(phase * 0.7) * 0.3) * crownWind;
        }
      });

      const branchWind = 0.012 * windStr * this.fullGrowth;
      this.primaryBranches.forEach((b, i) => {
        b.mesh.rotation.z = (Math.sin(time * 0.6 + i * 1.5) * 0.7 + Math.sin(time * 0.25 + i) * 0.3) * branchWind;
      });

      this.secondaryBranches.forEach((b, i) => {
        if (b.mesh.visible) {
          const sw = (Math.sin(time * 0.8 + i * 2.1) * 0.5 + Math.sin(time * 0.35) * 0.3) * branchWind * 1.5;
          b.mesh.rotation.z = sw;
        }
      });
    }
  }

  dispose() {
    this.group.traverse(ch => {
      if (ch.geometry) ch.geometry.dispose();
      if (ch.material) ch.material.dispose();
    });
  }
}
