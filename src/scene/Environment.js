import * as THREE from 'three';

export const GROUND_Y = -0.5;

const GITHUB_USER = 'ennkaos';
const PROJECT_POOLS = [
  { repo: 'PicsavePicsave', size: 0.9 },
  { repo: 'Lorem-Ipsom-Generator', size: 0.75 },
  { repo: 'Restaurant-dinamyc-menu', size: 1.0 },
  { repo: 'Licenta', size: 0.85 },
];

// Irregular hill boundary — layered sine noise for organic shape (extends to horizon)
function getHillRadius(angle) {
  const n1 = Math.sin(angle * 2.3) * 0.12 + Math.sin(angle * 5.1 + 1.2) * 0.08;
  const n2 = Math.sin(angle * 8.7 - 0.5) * 0.05 + Math.sin(angle * 12.3 + 2.1) * 0.03;
  return 30 * (1 + n1 + n2);
}

const GRASS_VERT = `
uniform float uTime;
uniform float uGrow;
uniform vec3 uMousePos;
uniform float uMouseRadius;
attribute vec3 offset;
attribute float bladeSeed;
attribute float bladeHeight;
attribute float bladeWidth;
attribute float bladeBend;
varying float vH;
varying float vSeed;

void main() {
  vH = position.y;
  vSeed = bladeSeed;

  float angle = bladeSeed * 6.2832;
  float cosA = cos(angle);
  float sinA = sin(angle);

  float grow = smoothstep(0.0, 0.6, uGrow - bladeSeed * 0.4);
  float h = position.y * bladeHeight * grow;

  float bend = bladeBend * vH * vH * 0.12;
  float bendX = cosA * bend;
  float bendZ = sinA * bend;
  float leanX = sin(bladeSeed * 12.56) * 0.06 * vH;
  float leanZ = cos(bladeSeed * 12.56) * 0.06 * vH;

  float windStr = vH * vH * 0.22;
  float wind = sin(uTime * 1.8 + offset.x * 2.2 + offset.z * 1.6 + bladeSeed * 6.28) * windStr;
  float gust = sin(uTime * 0.6 + offset.x * 0.5) * cos(uTime * 0.4 + offset.z * 0.7) * vH * 0.12;
  float w = bladeWidth * bladeHeight;
  float scaledX = position.x * w;
  float scaledZ = position.z * w;
  vec3 rotPos = vec3(
    scaledX * cosA - scaledZ * sinA + bendX + leanX,
    h,
    scaledX * sinA + scaledZ * cosA + bendZ + leanZ
  );

  rotPos.x += wind * bladeHeight + gust * bladeHeight;
  rotPos.z += wind * bladeHeight * 0.5;

  float mouseDist = length(offset.xz - uMousePos.xz);
  float mouseInfluence = smoothstep(uMouseRadius, uMouseRadius * 0.3, mouseDist) * vH * vH;
  vec2 away = normalize(offset.xz - uMousePos.xz + 0.001);
  rotPos.xz += away * mouseInfluence * 0.35 * bladeHeight;

  vec3 worldPos = rotPos + offset;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(worldPos, 1.0);
}`;

const GRASS_FRAG = `
uniform float uSunProgress;
varying float vH;
varying float vSeed;

float hash(float n) { return fract(sin(n) * 43758.5453); }

void main() {
  vec3 baseDark   = vec3(0.22, 0.32, 0.16);
  vec3 baseMid    = vec3(0.28, 0.40, 0.20);
  vec3 baseLight  = vec3(0.34, 0.50, 0.24);
  vec3 tipGreen   = vec3(0.48, 0.60, 0.30);
  vec3 tipWarm    = vec3(0.52, 0.62, 0.32);

  float v1 = hash(vSeed * 127.1);
  float v2 = hash(vSeed * 311.7);
  vec3 base = mix(baseDark, mix(baseMid, baseLight, v1), v2);
  vec3 tip  = mix(tipGreen, tipWarm, v1 * 0.5);
  vec3 col  = mix(base, tip, vH * (0.88 + v2 * 0.2));

  float stripe = hash(vSeed * 91.3 + vH * 30.0);
  col *= 0.88 + stripe * 0.22;

  float warmTip = hash(vSeed * 47.3) * vH * vH;
  col = mix(col, col * vec3(1.08, 0.98, 0.85), warmTip * 0.28);

  float yellowBlade = hash(vSeed * 73.1);
  col = mix(col, col * vec3(1.05, 1.02, 0.92), yellowBlade * 0.15 * vH);

  float sunBoost = uSunProgress * 0.06 * (0.5 + vH * 0.5);
  col += vec3(sunBoost * 0.35, sunBoost * 0.55, sunBoost * 0.08);

  float ao = 0.88 + 0.12 * vH;
  col *= ao;

  float alpha = smoothstep(0.0, 0.12, 1.0 - vH) * 0.95;
  gl_FragColor = vec4(col, alpha);
}`;

const SKY_VERT = `
varying vec3 vDir;
void main() {
  vDir = normalize(position);
  gl_Position = projectionMatrix * viewMatrix * modelMatrix * vec4(position, 1.0);
}`;

const SKY_FRAG = `
uniform float uProgress;
uniform vec3 uSunDir;
uniform float uTime;
varying vec3 vDir;

float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }

void main() {
  float y = vDir.y;

  vec3 nightZenith = vec3(0.02, 0.03, 0.08);
  vec3 nightHorizon = vec3(0.04, 0.05, 0.12);
  vec3 nightBelow = vec3(0.015, 0.02, 0.04);
  vec3 nightColor = mix(nightBelow, mix(nightHorizon, nightZenith, smoothstep(-0.3, 0.6, y)), smoothstep(-0.5, 0.0, y));

  float sunDot = dot(normalize(vDir), uSunDir);
  vec3 zenith  = vec3(0.25, 0.45, 0.72);
  vec3 skyMid  = vec3(0.42, 0.58, 0.78);
  vec3 horizon = vec3(0.68, 0.72, 0.65);
  vec3 below   = vec3(0.22, 0.32, 0.20);

  vec3 dayColor;
  if (y > 0.25) {
    dayColor = mix(skyMid, zenith, smoothstep(0.25, 0.9, y));
  } else if (y > -0.08) {
    dayColor = mix(horizon, skyMid, smoothstep(-0.08, 0.25, y));
  } else {
    dayColor = mix(below, horizon, smoothstep(-0.5, -0.08, y));
  }

  float horizonBand = exp(-pow(y * 6.0, 2.0)) * (0.4 + 0.3 * smoothstep(-0.1, 0.15, y));
  vec3 warm = vec3(0.92, 0.68, 0.42);
  float peak = uProgress * (1.0 - uProgress) * 4.0;
  dayColor += warm * horizonBand * peak * 0.28;

  float sunGlow = pow(max(sunDot, 0.0), 8.0) * uProgress * 0.15;
  dayColor += vec3(1.0, 0.95, 0.85) * sunGlow;

  vec3 col = mix(nightColor, dayColor, uProgress);

  float starMask = (1.0 - smoothstep(0.0, 0.22, uProgress)) * smoothstep(-0.2, 0.55, y);
  vec2 starUV = vec2(atan(vDir.z, vDir.x) / 6.28318 + 0.5, asin(vDir.y) / 3.14159 + 0.5);
  starUV *= 720.0;
  vec2 starId = floor(starUV);
  vec2 starPos = fract(starUV);
  float dist = length(starPos - 0.5);
  float star = hash(starId) * hash(starId + 1.0);
  float bright = smoothstep(0.93, 0.995, star) * (1.05 + hash(starId * 2.0) * 0.4);
  float dim = smoothstep(0.45, 0.88, star) * (1.0 - smoothstep(0.93, 0.998, star)) * 0.78;
  star = bright + dim;
  float starRadius = 0.09 + hash(starId * 3.0) * 0.06;
  float starShape = 1.0 - smoothstep(starRadius * 0.2, starRadius, dist);
  star *= starShape;
  float glow = 1.0 - smoothstep(starRadius, starRadius * 2.8, dist);
  star += glow * 0.25 * (bright + dim * 0.6);
  float twinkle = 0.92 + 0.08 * sin(uTime * 2.3 + starId.x * 7.1 + starId.y * 5.3);
  col += vec3(star, star * 0.98, star * 1.08) * starMask * twinkle * 1.5;

  gl_FragColor = vec4(col, 1.0);
}`;

const CLOUD_VERT = `
varying vec3 vNormal;
varying vec3 vWorldPos;
void main() {
  vNormal = normalize(normalMatrix * normal);
  vec4 worldPos = modelMatrix * vec4(position, 1.0);
  vWorldPos = worldPos.xyz;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}`;

const CLOUD_FRAG = `
uniform vec3 uSunDir;
uniform vec3 uColor;
uniform float uOpacity;
varying vec3 vNormal;
varying vec3 vWorldPos;

void main() {
  float NdotL = max(dot(vNormal, uSunDir), 0.0);
  float lit = 0.5 + 0.5 * NdotL;
  vec3 col = uColor * lit;
  float dist = length(vWorldPos);
  float fade = 1.0 - smoothstep(45.0, 50.0, dist);
  gl_FragColor = vec4(col, uOpacity * fade);
}`;

export class Environment {
  constructor(scene) {
    this.scene = scene;
    this._buildSky();
    this._buildLights();
    this._buildClouds();
    this._buildSunEffects();
    this._buildDustMotes();
    this._buildFireflies();
    this._buildBirds();
    this._buildBees();
    this._buildDandelions();
    this._buildGround();
    this._buildBackgroundTrees();
    this._buildProjectPools();
    this._buildGrass();
    this._buildTreeShadow();
    this._buildFog();
  }

  _buildSky() {
    const geo = new THREE.SphereGeometry(50, 32, 24);
    this.skyUniforms = {
      uProgress: { value: 0 },
      uSunDir: { value: new THREE.Vector3(0, 1, 0) },
      uTime: { value: 0 },
    };
    const mat = new THREE.ShaderMaterial({
      name: 'Sky',
      vertexShader: SKY_VERT,
      fragmentShader: SKY_FRAG,
      uniforms: this.skyUniforms,
      side: THREE.BackSide,
      depthWrite: false,
      depthTest: false,
      fog: false,
    });
    this.sky = new THREE.Mesh(geo, mat);
    this.sky.renderOrder = -100;
    this.sky.frustumCulled = false;
    this.scene.add(this.sky);
  }

  _buildLights() {
    this.keyLight = new THREE.DirectionalLight(0xfff4e0, 2.5);
    this.keyLight.position.set(3, 5, 3);
    this.scene.add(this.keyLight);

    this.fillLight = new THREE.DirectionalLight(0x88b892, 0.8);
    this.fillLight.position.set(-3, 2, -1);
    this.scene.add(this.fillLight);

    this.rimLight = new THREE.PointLight(0x5DB075, 1.2, 10);
    this.rimLight.position.set(0, 0.5, -2.5);
    this.scene.add(this.rimLight);

    this.frontFill = new THREE.PointLight(0xffe0c0, 1.2, 8);
    this.frontFill.position.set(0, 0, 3);
    this.scene.add(this.frontFill);

    this.ambient = new THREE.AmbientLight(0x3a4a3a, 1.2);
    this.scene.add(this.ambient);

    this.sunLight = new THREE.DirectionalLight(0xFFF8E7, 0);
    this.sunLight.position.set(2, 8, 1);
    this.scene.add(this.sunLight);

    const groundGlow = new THREE.SpotLight(0x3d7a4a, 0.4, 6, Math.PI / 4, 0.8);
    groundGlow.position.set(0, -2, 0);
    groundGlow.target.position.set(0, 0, 0);
    this.scene.add(groundGlow);
    this.scene.add(groundGlow.target);

    this.underTreeLight = new THREE.PointLight(0xFFF4E0, 0, 12, 1.8);
    this.underTreeLight.position.set(0, 5, 0);
    this.scene.add(this.underTreeLight);
  }

  _buildClouds() {
    this.cloudGroups = [];
    this.cloudUniforms = {
      uSunDir: { value: new THREE.Vector3(0, 1, 0) },
      uColor: { value: new THREE.Color(0x9A9EA2) },
      uOpacity: { value: 0 },
    };
    const skyRadius = 48;
    const rnd = (s) => (Math.abs(Math.sin(s * 12.9898) * 43758.5453) % 1);

    const makeCloud = (x, y, z, scale, opacityMult) => {
      const group = new THREE.Group();
      const mat = new THREE.ShaderMaterial({
        name: 'Cloud',
        uniforms: {
          uSunDir: this.cloudUniforms.uSunDir,
          uColor: this.cloudUniforms.uColor,
          uOpacity: { value: 0 },
        },
        vertexShader: CLOUD_VERT,
        fragmentShader: CLOUD_FRAG,
        transparent: true,
        depthWrite: false,
        fog: false,
        side: THREE.DoubleSide,
      });
      const puffCount = 7 + Math.floor(rnd(scale * 17) * 3);
      const baseOffsets = [
        [0, 0, 0], [0.55, 0.25, 0.35], [-0.45, 0.2, -0.25], [0.35, -0.12, 0.5],
        [-0.3, 0.15, -0.4], [0.5, 0.4, -0.05], [-0.2, -0.25, 0.3], [0.4, 0.05, -0.4],
      ];
      for (let i = 0; i < puffCount; i++) {
        const sizeVar = 0.75 + rnd(i * 4.3) * 0.5;
        const size = (i < 2 ? 1.0 : 0.5 + rnd(i * 7.1) * 0.5) * sizeVar * scale;
        const ox = (baseOffsets[i % 8]?.[0] ?? rnd(i * 2.1) - 0.5) * scale;
        const oy = (baseOffsets[i % 8]?.[1] ?? rnd(i * 3.2) - 0.5) * scale;
        const oz = (baseOffsets[i % 8]?.[2] ?? rnd(i * 5.4) - 0.5) * scale;
        const geo = new THREE.SphereGeometry(size, 14, 10);
        const mesh = new THREE.Mesh(geo, mat);
        mesh.position.set(ox, oy, oz);
        group.add(mesh);
      }
      group.position.set(x, y, z);
      group.lookAt(0, 0, 0);
      group.renderOrder = -50;
      this.scene.add(group);
      this.cloudGroups.push({ group, mat, opacityMult });
    };

    for (let i = 0; i < 24; i++) {
      const phi = Math.acos(0.15 + rnd(i * 7.3) * 0.65);
      const theta = rnd(i * 5.1) * Math.PI * 2;
      const r = skyRadius * (0.92 + rnd(i * 3.7) * 0.08);
      const x = r * Math.sin(phi) * Math.cos(theta);
      const y = r * Math.cos(phi);
      const z = r * Math.sin(phi) * Math.sin(theta);
      const scale = 1.2 + rnd(i * 11.2) * 1.3;
      const opacityMult = 0.85 + rnd(i * 7.7) * 0.3;
      makeCloud(x, y, z, scale, opacityMult);
    }
  }

  _buildSunEffects() {
    this.sunWorldPos = new THREE.Vector3(2, 8, 1).normalize().multiplyScalar(28);

    const sunDiscGeo = new THREE.SphereGeometry(2.2, 32, 24);
    this.sunDiscMat = new THREE.MeshBasicMaterial({
      color: 0xFFE8B8,
      transparent: true,
      opacity: 0,
      depthWrite: false,
      fog: false,
    });
    this.sunDisc = new THREE.Mesh(sunDiscGeo, this.sunDiscMat);
    this.sunDisc.position.copy(this.sunWorldPos);
    this.sunDisc.renderOrder = 5;
    this.scene.add(this.sunDisc);

    const sunGlowGeo = new THREE.SphereGeometry(6.0, 24, 16);
    this.sunGlowMat = new THREE.MeshBasicMaterial({
      color: 0xFFD890,
      transparent: true,
      opacity: 0,
      depthWrite: false,
      fog: false,
    });
    this.sunGlow = new THREE.Mesh(sunGlowGeo, this.sunGlowMat);
    this.sunGlow.position.copy(this.sunWorldPos);
    this.sunGlow.renderOrder = 3;
    this.scene.add(this.sunGlow);

    const rayGradient = (() => {
      const c = document.createElement('canvas');
      c.width = 1;
      c.height = 64;
      const ctx = c.getContext('2d');
      const g = ctx.createLinearGradient(0, 64, 0, 0);
      g.addColorStop(0, 'rgba(255, 248, 230, 0.85)');
      g.addColorStop(0.25, 'rgba(255, 245, 215, 0.35)');
      g.addColorStop(0.6, 'rgba(255, 240, 200, 0.06)');
      g.addColorStop(1, 'rgba(255, 240, 200, 0)');
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, 1, 64);
      const tex = new THREE.CanvasTexture(c);
      tex.needsUpdate = true;
      return tex;
    })();

    this.sunRayGroup = new THREE.Group();
    this.sunRayGroup.position.copy(this.sunWorldPos);
    this.scene.add(this.sunRayGroup);

    const rayCount = 12;
    this.sunRays = [];
    const rayWidth = 2;
    const rayLength = 35;
    for (let i = 0; i < rayCount; i++) {
      const angle = (i / rayCount) * Math.PI * 2 + 0.2;
      const geo = new THREE.PlaneGeometry(rayWidth, rayLength);
      geo.translate(0, rayLength / 2, 0);
      const mat = new THREE.MeshBasicMaterial({
        color: 0xFFFFFF,
        map: rayGradient,
        transparent: true,
        opacity: 0,
        side: THREE.DoubleSide,
        depthWrite: false,
        fog: false,
      });
      const ray = new THREE.Mesh(geo, mat);
      ray.rotation.z = -angle;
      ray.lookAt(0, 0, 0);
      ray.renderOrder = 4;
      this.sunRayGroup.add(ray);
      this.sunRays.push({ mesh: ray, mat });
    }

    const underRayGradient = (() => {
      const c = document.createElement('canvas');
      c.width = 1;
      c.height = 64;
      const ctx = c.getContext('2d');
      const g = ctx.createLinearGradient(0, 0, 0, 64);
      g.addColorStop(0, 'rgba(255, 248, 235, 0.18)');
      g.addColorStop(0.4, 'rgba(255, 245, 220, 0.08)');
      g.addColorStop(0.75, 'rgba(255, 242, 210, 0.02)');
      g.addColorStop(1, 'rgba(255, 240, 200, 0)');
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, 1, 64);
      const tex = new THREE.CanvasTexture(c);
      tex.needsUpdate = true;
      return tex;
    })();

    this.underTreeRayGroup = new THREE.Group();
    this.underTreeRayGroup.position.set(0, 5.5, 0);
    this.underTreeRayGroup.visible = false;
    this.scene.add(this.underTreeRayGroup);

    this.underTreeRays = [];
    const underRayCount = 6;
    const underRayWidth = 1.2;
    const underRayLength = 8;
    for (let i = 0; i < underRayCount; i++) {
      const angle = (i / underRayCount) * Math.PI * 2 + 0.15;
      const geo = new THREE.PlaneGeometry(underRayWidth, underRayLength);
      geo.translate(0, -underRayLength / 2, 0);
      const mat = new THREE.MeshBasicMaterial({
        color: 0xFFF8E8,
        map: underRayGradient,
        transparent: true,
        opacity: 0,
        side: THREE.DoubleSide,
        depthWrite: false,
        fog: false,
      });
      const ray = new THREE.Mesh(geo, mat);
      ray.rotation.x = Math.PI * 0.35;
      ray.rotation.z = -angle;
      ray.renderOrder = 6;
      this.underTreeRayGroup.add(ray);
      this.underTreeRays.push({ mesh: ray, mat });
    }

  }

  _buildBirds() {
    this.birds = [];
    const rnd = (s) => (Math.abs(Math.sin(s * 12.9898) * 43758.5453) % 1);
    for (let i = 0; i < 3; i++) {
      const shape = new THREE.Shape();
      shape.moveTo(-0.15, 0);
      shape.quadraticCurveTo(-0.08, 0.06, 0, 0);
      shape.quadraticCurveTo(0.08, -0.06, 0.15, 0);
      const geo = new THREE.ShapeGeometry(shape);
      const mat = new THREE.MeshBasicMaterial({
        color: 0x1a1a1a,
        transparent: true,
        opacity: 0,
        side: THREE.DoubleSide,
        depthWrite: false,
        fog: false,
      });
      const mesh = new THREE.Mesh(geo, mat);
      mesh.position.set((rnd(i * 3) - 0.5) * 40, 8 + rnd(i * 7) * 6, -25 - rnd(i * 5) * 15);
      mesh.scale.setScalar(2 + rnd(i * 11) * 2);
      mesh.renderOrder = -40;
      this.scene.add(mesh);
      this.birds.push({ mesh, mat, phase: rnd(i * 13) * Math.PI * 2 });
    }
  }

  _buildBees() {
    const COUNT = 12;
    const positions = new Float32Array(COUNT * 3);
    const rand = (s) => (Math.abs(Math.sin(s * 12.9898) * 43758.5453) % 1);
    for (let i = 0; i < COUNT; i++) {
      positions[i * 3] = (rand(i * 2.1) - 0.5) * 10;
      positions[i * 3 + 1] = rand(i * 3.4) * 0.5 - 0.35;
      positions[i * 3 + 2] = (rand(i * 5.2) - 0.5) * 8 - 2;
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    const mat = new THREE.PointsMaterial({
      color: 0xFFD700,
      size: 0.04,
      transparent: true,
      opacity: 0,
      sizeAttenuation: true,
      depthWrite: false,
      fog: false,
    });
    this.bees = new THREE.Points(geo, mat);
    this.bees.renderOrder = 12;
    this.scene.add(this.bees);
  }

  _buildDandelions() {
    const COUNT = 35;
    const positions = new Float32Array(COUNT * 3);
    const rand = (s) => (Math.abs(Math.sin(s * 12.9898) * 43758.5453) % 1);
    for (let i = 0; i < COUNT; i++) {
      positions[i * 3] = (rand(i * 2.1) - 0.5) * 16;
      positions[i * 3 + 1] = rand(i * 3.7) * 3 - 0.2;
      positions[i * 3 + 2] = (rand(i * 5.2) - 0.5) * 12;
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    const mat = new THREE.PointsMaterial({
      color: 0xFFF8DC,
      size: 0.025,
      transparent: true,
      opacity: 0,
      sizeAttenuation: true,
      depthWrite: false,
      fog: false,
    });
    this.dandelions = new THREE.Points(geo, mat);
    this.dandelions.renderOrder = 8;
    this.scene.add(this.dandelions);
  }

  _buildGround() {
    const shape = new THREE.Shape();
    const segments = 72;
    for (let i = 0; i <= segments; i++) {
      const angle = (i / segments) * Math.PI * 2;
      const r = getHillRadius(angle);
      const x = Math.cos(angle) * r;
      const z = Math.sin(angle) * r;
      if (i === 0) shape.moveTo(x, z);
      else shape.lineTo(x, z);
    }
    const grassGeo = new THREE.ShapeGeometry(shape, 12);
    this.grassMat = new THREE.MeshStandardMaterial({
      color: 0x2a4a20, roughness: 0.95, metalness: 0.0, transparent: true, opacity: 0,
    });
    this.grass = new THREE.Mesh(grassGeo, this.grassMat);
    this.grass.rotation.x = -Math.PI / 2;
    this.grass.position.y = GROUND_Y;
    this.grass.receiveShadow = true;
    this.scene.add(this.grass);

    const hillOutline = new THREE.Path();
    for (let i = segments; i >= 0; i--) {
      const angle = (i / segments) * Math.PI * 2;
      const r = getHillRadius(angle);
      const x = Math.cos(angle) * r;
      const z = Math.sin(angle) * r;
      if (i === segments) hillOutline.moveTo(x, z);
      else hillOutline.lineTo(x, z);
    }
    const horizonShape = new THREE.Shape();
    horizonShape.absarc(0, 0, 55, 0, Math.PI * 2, false);
    horizonShape.holes.push(hillOutline);
    const horizonGeo = new THREE.ShapeGeometry(horizonShape, 24);
    this.horizonGroundMat = new THREE.MeshStandardMaterial({
      color: 0x24301c, roughness: 0.98, metalness: 0.0, transparent: true, opacity: 0,
    });
    this.horizonGround = new THREE.Mesh(horizonGeo, this.horizonGroundMat);
    this.horizonGround.rotation.x = -Math.PI / 2;
    this.horizonGround.position.y = GROUND_Y - 0.005;
    this.horizonGround.receiveShadow = true;
    this.scene.add(this.horizonGround);

    const soilGeo = new THREE.CircleGeometry(0.45, 32);
    this.soilMat = new THREE.MeshStandardMaterial({
      color: 0x3D2B1A, roughness: 1.0, metalness: 0.0, transparent: true, opacity: 0,
    });
    this.soil = new THREE.Mesh(soilGeo, this.soilMat);
    this.soil.rotation.x = -Math.PI / 2;
    this.soil.position.y = GROUND_Y + 0.01;
    this.scene.add(this.soil);
  }

  _createIrregularPoolShape(baseRadius, seed) {
    const pts = 16;
    const points = [];
    for (let i = 0; i <= pts; i++) {
      const a = (i / pts) * Math.PI * 2;
      const n1 = Math.sin(a * 4.3 + seed * 10) * 0.18;
      const n2 = Math.cos(a * 2.7 + seed * 7) * 0.12;
      const n3 = Math.sin(a * 7.1 - seed * 3) * 0.08;
      const r = baseRadius * (1 + n1 + n2 + n3);
      points.push(new THREE.Vector2(Math.cos(a) * r, Math.sin(a) * r));
    }
    const shape = new THREE.Shape(points);
    return new THREE.ShapeGeometry(shape);
  }

  _createIrregularPoolRing(innerR, outerR, seed) {
    const pts = 16;
    const outer = [];
    const inner = [];
    for (let i = 0; i <= pts; i++) {
      const a = (i / pts) * Math.PI * 2;
      const n1 = Math.sin(a * 4.3 + seed * 10) * 0.18;
      const n2 = Math.cos(a * 2.7 + seed * 7) * 0.12;
      const n3 = Math.sin(a * 7.1 - seed * 3) * 0.08;
      const rOut = outerR * (1 + n1 + n2 + n3);
      const rIn = innerR * (1 + n1 + n2 + n3);
      outer.push(new THREE.Vector2(Math.cos(a) * rOut, Math.sin(a) * rOut));
      inner.push(new THREE.Vector2(Math.cos(a) * rIn, Math.sin(a) * rIn));
    }
    const shape = new THREE.Shape(outer);
    shape.holes.push(new THREE.Path([...inner].reverse()));
    return new THREE.ShapeGeometry(shape);
  }

  _buildProjectPools() {
    this.projectPoolMeshes = [];
    this.projectPoolPositions = [];
    const hash = (a, b) => (Math.abs(Math.sin(a * 12.9898 + b * 78.233) * 43758.5453) % 1);
    const INNER_R = 2.5;
    const MAX_R = 12;
    const placed = [];
    for (let i = 0; i < PROJECT_POOLS.length; i++) {
      const p = PROJECT_POOLS[i];
      const baseRadius = 0.45 + p.size * 0.35;
      const minGap = baseRadius * 2;
      const fallbackAngle = Math.PI / 6 + (i / Math.max(1, PROJECT_POOLS.length - 1)) * (Math.PI * 2 / 3) * 0.8;
      let x = Math.cos(fallbackAngle) * 7, z = Math.sin(fallbackAngle) * 7;
      for (let attempt = 0; attempt < 80; attempt++) {
        const angle = Math.PI / 6 + hash(i * 17.3 + attempt * 31.7, 0) * (Math.PI * 2 / 3);
        const hillR = Math.min(getHillRadius(angle) * 0.85, MAX_R);
        const r = INNER_R + hash(i * 3.1 + attempt * 7.9, 1) * (hillR - INNER_R);
        const jitter = 0.8;
        x = Math.cos(angle) * r + (hash(i * 5.3 + attempt * 11, 2) - 0.5) * jitter;
        z = Math.sin(angle) * r + (hash(i * 2.7 + attempt * 13, 3) - 0.5) * jitter;
        const ptAngle = Math.atan2(z, x);
        const boundaryR = Math.min(getHillRadius(ptAngle) - 0.5, MAX_R);
        if (Math.sqrt(x * x + z * z) > boundaryR) continue;
        const overlaps = placed.some((o) => {
          const dx = x - o.x, dz = z - o.z;
          return dx * dx + dz * dz < (minGap + o.excludeRadius) * (minGap + o.excludeRadius);
        });
        if (!overlaps) break;
      }
      const excludeRadius = baseRadius * 1.35;
      this.projectPoolPositions.push({ x, z, excludeRadius });
      placed.push({ x, z, excludeRadius });

      const shapeSeed = hash(i * 19.1, 4) * 100;
      const fillGeo = this._createIrregularPoolShape(baseRadius, shapeSeed);
      const edgeGeo = this._createIrregularPoolRing(baseRadius, baseRadius * 1.04, shapeSeed);
      const fillMat = new THREE.MeshBasicMaterial({
        color: 0x74CCF4,
        transparent: true,
        opacity: 0,
        side: THREE.DoubleSide,
      });
      const edgeMat = new THREE.MeshBasicMaterial({
        color: 0x5ABCD8,
        transparent: true,
        opacity: 0,
        side: THREE.DoubleSide,
      });
      const fill = new THREE.Mesh(fillGeo, fillMat);
      fill.rotation.x = -Math.PI / 2;
      fill.position.set(x, GROUND_Y + 0.002, z);
      fill.userData.repoUrl = `https://github.com/${GITHUB_USER}/${p.repo}`;
      fill.userData.isProjectPool = true;
      this.scene.add(fill);
      this.projectPoolMeshes.push(fill);
      const edge = new THREE.Mesh(edgeGeo, edgeMat);
      edge.rotation.x = -Math.PI / 2;
      edge.position.set(x, GROUND_Y + 0.001, z);
      edge.userData.repoUrl = `https://github.com/${GITHUB_USER}/${p.repo}`;
      edge.userData.isProjectPool = true;
      this.scene.add(edge);
      this.projectPoolMeshes.push(edge);
    }
  }

  _buildBackgroundTrees() {
    const rand = (s) => (Math.abs(Math.sin(s * 12.9898) * 43758.5453) % 1);
    this.backgroundTrees = [];
    const pineMat = new THREE.MeshBasicMaterial({
      color: 0x1a2518,
      fog: false,
      toneMapped: false,
    });
    const roundMat = new THREE.MeshBasicMaterial({
      color: 0x1e2a1a,
      fog: false,
      toneMapped: false,
    });
    const trunkMat = new THREE.MeshBasicMaterial({
      color: 0x1c1812,
      fog: false,
      toneMapped: false,
    });

    const addTree = (x, z, scale, isRound, i) => {
      const rotY = rand(i * 17) * Math.PI * 2;
      const group = new THREE.Group();
      group.rotation.y = rotY;

      if (isRound) {
        const trunkH = 0.25 * scale;
        const trunk = new THREE.Mesh(
          new THREE.CylinderGeometry(0.02, 0.04, trunkH, 5),
          trunkMat
        );
        trunk.position.y = trunkH * 0.5;
        const r1 = 0.32 * scale;
        const r2 = 0.24 * scale;
        const r3 = 0.14 * scale;
        const s1 = new THREE.Mesh(new THREE.SphereGeometry(r1, 8, 6, 0, Math.PI * 2, 0, Math.PI * 0.6), roundMat);
        s1.position.y = trunkH + r1 * 0.6;
        const s2 = new THREE.Mesh(new THREE.SphereGeometry(r2, 6, 5, 0, Math.PI * 2, 0, Math.PI * 0.65), roundMat);
        s2.position.y = trunkH + r1 * 1.1 + r2 * 0.5;
        const s3 = new THREE.Mesh(new THREE.SphereGeometry(r3, 6, 4, 0, Math.PI * 2, 0, Math.PI * 0.7), roundMat);
        s3.position.y = trunkH + r1 * 1.1 + r2 * 0.9 + r3 * 0.4;
        group.add(trunk);
        group.add(s1);
        group.add(s2);
        group.add(s3);
      } else {
        const baseR = 0.22 * scale;
        const topR = 0.06 * scale;
        const h = 1.2 * scale;
        const cone = new THREE.Mesh(
          new THREE.CylinderGeometry(topR, baseR, h, 8),
          pineMat
        );
        cone.position.y = h * 0.5;
        const tip = new THREE.Mesh(
          new THREE.SphereGeometry(topR * 1.2, 6, 4, 0, Math.PI * 2, 0, Math.PI * 0.5),
          pineMat
        );
        tip.position.y = h;
        group.add(cone);
        group.add(tip);
      }

      group.position.set(x, GROUND_Y, z);
      group.layers.set(0);
      this.scene.add(group);
      this.backgroundTrees.push({ group });
    };

    for (let i = 0; i < 16; i++) {
      const a = (i / 16) * Math.PI * 2 + rand(i * 7) * 0.4;
      const r = 26 + rand(i * 11) * 6;
      const x = Math.cos(a) * r;
      const z = Math.sin(a) * r;
      const scale = 0.6 + rand(i * 13) * 1.0;
      addTree(x, z, scale, i % 3 === 0, i);
    }

    const HILL_EDGE = 32;
    const HORIZON_EDGE = 50;
    for (let i = 16; i < 95; i++) {
      const a = rand(i * 3.7 + 1) * Math.PI * 2;
      const r = HILL_EDGE + rand(i * 5.1) * (HORIZON_EDGE - HILL_EDGE);
      const jitter = 1.2;
      const x = Math.cos(a) * r + (rand(i * 2.3) - 0.5) * jitter;
      const z = Math.sin(a) * r + (rand(i * 4.9) - 0.5) * jitter;
      const distFactor = (r - HILL_EDGE) / (HORIZON_EDGE - HILL_EDGE);
      const scale = 0.12 + distFactor * 0.2 + rand(i * 8.3) * 0.18;
      addTree(x, z, scale, rand(i * 6.1) > 0.6, i);
    }
  }

  _buildGrass() {
    const BLADE_COUNT = 200000;
    const INNER_R = 0.2;

    const hash2 = (a, b) => (Math.abs(Math.sin(a * 12.9898 + b * 78.233) * 43758.5453) % 1);

    const offsets = new Float32Array(BLADE_COUNT * 3);
    const seeds = new Float32Array(BLADE_COUNT);
    const heights = new Float32Array(BLADE_COUNT);
    const widths = new Float32Array(BLADE_COUNT);
    const bends = new Float32Array(BLADE_COUNT);

    for (let i = 0; i < BLADE_COUNT; i++) {
      const seed = Math.random();
      seeds[i] = seed;

      const angle = Math.random() * Math.PI * 2;
      const maxR = getHillRadius(angle);
      const rSq = Math.random();
      const r = INNER_R + Math.sqrt(rSq) * (maxR - INNER_R);
      const jitter = 0.04;
      let x = Math.cos(angle) * r + (Math.random() - 0.5) * jitter * 2;
      let z = Math.sin(angle) * r + (Math.random() - 0.5) * jitter * 2;
      const dist = Math.sqrt(x * x + z * z);
      const ptAngle = Math.atan2(z, x);
      const boundaryR = getHillRadius(ptAngle);
      if (dist > boundaryR - 0.01) {
        const scale = (boundaryR - 0.01) / Math.max(dist, 0.001);
        x *= scale;
        z *= scale;
      }
      offsets[i * 3]     = x;
      offsets[i * 3 + 1] = GROUND_Y;
      offsets[i * 3 + 2] = z;

      const actualR = Math.sqrt(x * x + z * z);
      const distFactor = 1.0 - (actualR - INNER_R) / (Math.max(boundaryR - INNER_R, 0.1));
      const cellX = Math.floor(x / 0.5);
      const cellZ = Math.floor(z / 0.5);
      const densityNoise = hash2(cellX * 1.1, cellZ * 1.3);
      const heightNoise = hash2(cellX * 0.7 + 5, cellZ * 0.9 + 3);

      let h;
      const hRoll = Math.random();
      if (hRoll < 0.12) {
        h = 0.06 + Math.random() * 0.12;
      } else if (hRoll > 0.88) {
        h = 0.42 + Math.random() * 0.28;
      } else {
        h = 0.18 + Math.random() * 0.32;
      }
      h += distFactor * 0.08;

      if (densityNoise < 0.05) {
        h *= 0.12;
      } else if (densityNoise > 0.93) {
        h *= 1.2 + heightNoise * 0.25;
      } else {
        h *= 0.7 + heightNoise * 0.6;
      }

      let inPool = false;
      for (const pool of this.projectPoolPositions) {
        const dx = x - pool.x;
        const dz = z - pool.z;
        if (dx * dx + dz * dz < pool.excludeRadius * pool.excludeRadius) {
          inPool = true;
          break;
        }
      }
      heights[i] = inPool ? 0 : Math.max(0.04, h);
      widths[i] = 0.28 + Math.random() * 0.95 + heightNoise * 0.2;
      bends[i] = (Math.random() - 0.5) * 2.2 + (heightNoise - 0.5) * 0.4;
    }

    const bladeW = 0.009;
    const bladeH = 1.0;
    const bladeGeo = new THREE.BufferGeometry();
    const verts = new Float32Array([
      -bladeW, 0,     0,
       bladeW, 0,     0,
      -bladeW * 0.65, bladeH * 0.30, 0,
       bladeW * 0.65, bladeH * 0.30, 0,
      -bladeW * 0.25, bladeH * 0.62, 0,
       bladeW * 0.25, bladeH * 0.62, 0,
       0,       bladeH, 0,
    ]);
    const indices = [0,1,2, 1,3,2, 2,3,4, 3,5,4, 4,5,6];
    bladeGeo.setAttribute('position', new THREE.BufferAttribute(verts, 3));
    bladeGeo.setIndex(indices);

    const offsetAttr = new THREE.InstancedBufferAttribute(offsets, 3);
    const seedAttr   = new THREE.InstancedBufferAttribute(seeds, 1);
    const heightAttr = new THREE.InstancedBufferAttribute(heights, 1);
    const widthAttr  = new THREE.InstancedBufferAttribute(widths, 1);
    const bendAttr   = new THREE.InstancedBufferAttribute(bends, 1);

    const instancedGeo = new THREE.InstancedBufferGeometry();
    instancedGeo.index = bladeGeo.index;
    instancedGeo.setAttribute('position', bladeGeo.getAttribute('position'));
    instancedGeo.setAttribute('offset', offsetAttr);
    instancedGeo.setAttribute('bladeSeed', seedAttr);
    instancedGeo.setAttribute('bladeHeight', heightAttr);
    instancedGeo.setAttribute('bladeWidth', widthAttr);
    instancedGeo.setAttribute('bladeBend', bendAttr);
    instancedGeo.instanceCount = BLADE_COUNT;

    this.grassUniforms = {
      uTime: { value: 0 },
      uGrow: { value: 0 },
      uSunProgress: { value: 0 },
      uMousePos: { value: new THREE.Vector3(0, 0, 0) },
      uMouseRadius: { value: 0 },
    };

    const grassMat = new THREE.ShaderMaterial({
      name: 'Grass',
      vertexShader: GRASS_VERT,
      fragmentShader: GRASS_FRAG,
      uniforms: this.grassUniforms,
      side: THREE.DoubleSide,
      transparent: true,
      depthWrite: true,
    });

    this.grassMesh = new THREE.Mesh(instancedGeo, grassMat);
    this.grassMesh.frustumCulled = false;
    this.grassMesh.renderOrder = 10;
    this.grassMesh.visible = false;
    this.scene.add(this.grassMesh);
  }

  _buildDustMotes() {
    const COUNT = 140;
    const positions = new Float32Array(COUNT * 3);
    const rand = (s) => (Math.abs(Math.sin(s * 12.9898) * 43758.5453) % 1);
    for (let i = 0; i < COUNT; i++) {
      const x = (rand(i * 2.1) - 0.5) * 14;
      const y = rand(i * 3.4) * 4 - 0.5;
      const z = rand(i * 5.2) * 8 - 2;
      positions[i * 3] = x;
      positions[i * 3 + 1] = y;
      positions[i * 3 + 2] = z;
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    const mat = new THREE.PointsMaterial({
      color: 0xFFF8E0,
      size: 0.08,
      transparent: true,
      opacity: 0,
      sizeAttenuation: true,
      depthWrite: false,
      fog: false,
    });
    this.dustMotes = new THREE.Points(geo, mat);
    this.dustMotes.renderOrder = 2;
    this.scene.add(this.dustMotes);
  }

  _buildFireflies() {
    const COUNT = 50;
    const positions = new Float32Array(COUNT * 3);
    const phases = new Float32Array(COUNT);
    const rand = (s) => (Math.abs(Math.sin(s * 12.9898) * 43758.5453) % 1);
    for (let i = 0; i < COUNT; i++) {
      positions[i * 3] = (rand(i * 2.1) - 0.5) * 14;
      positions[i * 3 + 1] = rand(i * 3.7) * 2.5 - 0.2;
      positions[i * 3 + 2] = (rand(i * 5.3) - 0.5) * 10 - 3;
      phases[i] = rand(i * 11.2) * Math.PI * 2;
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geo.setAttribute('phase', new THREE.BufferAttribute(phases, 1));
    const mat = new THREE.ShaderMaterial({
      name: 'Fireflies',
      uniforms: {
        uTime: { value: 0 },
        uOpacity: { value: 0 },
      },
      vertexShader: `
        uniform float uTime;
        attribute float phase;
        varying float vAlpha;
        void main() {
          vAlpha = 0.5 + 0.5 * sin(uTime * 3.0 + phase);
          vec4 mvPos = modelViewMatrix * vec4(position, 1.0);
          gl_PointSize = 4.0 * (300.0 / -mvPos.z);
          gl_Position = projectionMatrix * mvPos;
        }
      `,
      fragmentShader: `
        uniform float uOpacity;
        varying float vAlpha;
        void main() {
          float d = length(gl_PointCoord - 0.5) * 2.0;
          float a = 1.0 - smoothstep(0.5, 1.0, d);
          gl_FragColor = vec4(0.91, 1.0, 0.5, a * vAlpha * uOpacity);
        }
      `,
      transparent: true,
      depthWrite: false,
      fog: false,
    });
    this.fireflies = new THREE.Points(geo, mat);
    this.fireflies.renderOrder = 11;
    this.scene.add(this.fireflies);
  }

  _buildTreeShadow() {
    const geo = new THREE.CircleGeometry(3.5, 32);
    const canvas = document.createElement('canvas');
    canvas.width = 64;
    canvas.height = 64;
    const ctx = canvas.getContext('2d');
    const g = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
    g.addColorStop(0, 'rgba(0,0,0,0.35)');
    g.addColorStop(0.5, 'rgba(0,0,0,0.12)');
    g.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, 64, 64);
    const tex = new THREE.CanvasTexture(canvas);
    const mat = new THREE.MeshBasicMaterial({
      map: tex,
      transparent: true,
      opacity: 0,
      depthWrite: false,
      side: THREE.DoubleSide,
    });
    this.treeShadow = new THREE.Mesh(geo, mat);
    this.treeShadow.rotation.x = -Math.PI / 2;
    this.treeShadow.position.set(0, GROUND_Y + 0.01, 0);
    this.treeShadow.renderOrder = 9;
    this.scene.add(this.treeShadow);
  }

  _buildFog() {
    this.scene.fog = new THREE.FogExp2(0x0a1208, 0.12);
  }

  setSunProgress(t, treeGrowth = 0, underTreeProgress = 0) {
    t = THREE.MathUtils.clamp(t, 0, 1);

    const sunY = THREE.MathUtils.lerp(2, 10, t);
    this.sunWorldPos.set(2, sunY, 1).normalize().multiplyScalar(28);
    this.skyUniforms.uProgress.value = t;
    this.skyUniforms.uSunDir.value.copy(this.sunWorldPos).normalize();

    this.sunLight.intensity = t * 1.1;
    this.keyLight.intensity = THREE.MathUtils.lerp(0.4, 1.2, t);
    this.sunLight.position.y = sunY;
    this.sunDisc.position.copy(this.sunWorldPos);
    this.sunGlow.position.copy(this.sunWorldPos);
    const sunVisible = t > 0.06;
    this.sunDiscMat.opacity = sunVisible ? THREE.MathUtils.smoothstep(t, 0.08, 0.45) * 0.5 : 0;
    this.sunGlowMat.opacity = sunVisible ? THREE.MathUtils.smoothstep(t, 0.1, 0.5) * 0.12 : 0;

    this.cloudUniforms.uSunDir.value.copy(this.sunWorldPos).normalize();
    const cloudOpacity = THREE.MathUtils.smoothstep(t, 0.25, 0.6) * 0.22;
    this.cloudGroups.forEach((c) => { c.mat.uniforms.uOpacity.value = cloudOpacity * (c.opacityMult ?? 1); });

    this.sunRayGroup.position.copy(this.sunWorldPos);
    const rayOpacity = t > 0.15 ? THREE.MathUtils.smoothstep(t, 0.2, 0.55) * 0.12 : 0;
    this.sunRays.forEach((r, i) => {
      r.mat.opacity = rayOpacity * (0.85 + Math.sin(i * 1.2) * 0.15);
    });

    this.ambient.color.setHex(0x1a2030).lerp(new THREE.Color(0x9aaa8a), t);
    const baseAmbient = THREE.MathUtils.lerp(0.35, 0.8, t);

    this.fillLight.color.setHex(0x6080a0).lerp(new THREE.Color(0xC8E8B0), t);
    this.fillLight.intensity = THREE.MathUtils.lerp(0.15, 0.5, t);

    this.rimLight.intensity = THREE.MathUtils.lerp(0.35, 0.1, t);
    this.frontFill.intensity = THREE.MathUtils.lerp(0.35, 0.2, t);

    const fogNight = new THREE.Color(0x080a14);
    const fogDay = new THREE.Color(0x8AAA78);
    this.scene.fog.color.copy(fogNight).lerp(fogDay, t);
    this.scene.fog.density = THREE.MathUtils.lerp(0.12, 0.03, t);

    this.grassMat.color.copy(new THREE.Color(0x2a4a20)).lerp(new THREE.Color(0x5A8A3A), t);
    this.grassMat.opacity = THREE.MathUtils.smoothstep(t, 0.08, 0.45);

    this.horizonGroundMat.color.copy(new THREE.Color(0x1e2a18)).lerp(new THREE.Color(0x3a5a2e), t);
    this.horizonGroundMat.opacity = THREE.MathUtils.smoothstep(t, 0.08, 0.35);

    this.soilMat.opacity = THREE.MathUtils.smoothstep(t, 0.05, 0.35);

    const grassGrow = THREE.MathUtils.smoothstep(t, 0.04, 0.55);
    this.grassUniforms.uGrow.value = grassGrow;
    this.grassUniforms.uSunProgress.value = t;
    this.grassMesh.visible = grassGrow > 0.001;

    this.dustMotes.material.opacity = THREE.MathUtils.smoothstep(t, 0.15, 0.5) * 0.4;
    const fireflyT = THREE.MathUtils.smoothstep(t, 0.45, 0.7) * (1 - THREE.MathUtils.smoothstep(t, 0.75, 0.95));
    this.fireflies.material.uniforms.uOpacity.value = fireflyT * 0.9;
    const shadowScale = 0.3 + treeGrowth * 0.9;
    this.treeShadow.scale.setScalar(shadowScale);
    this.treeShadow.material.opacity = THREE.MathUtils.smoothstep(t, 0.35, 0.65) * 0.7 * Math.min(1, treeGrowth * 1.5);
    this.birds.forEach((b) => { b.mat.opacity = THREE.MathUtils.smoothstep(t, 0.2, 0.5) * 0.6; });
    this.bees.material.opacity = THREE.MathUtils.smoothstep(t, 0.3, 0.55) * 0.7;
    this.dandelions.material.opacity = THREE.MathUtils.smoothstep(t, 0.25, 0.6) * 0.65;

    const bgTree = THREE.MathUtils.smoothstep(t, 0.02, 0.4);
    this.backgroundTrees.forEach((bt, i) => {
      bt.group.scale.setScalar(bgTree);
      bt.group.visible = bgTree > 0.005;
    });

    const poolOpacity = THREE.MathUtils.smoothstep(t, 0.25, 0.6) * 0.98;
    (this.projectPoolMeshes || []).forEach((m) => { m.material.opacity = poolOpacity; });

    const underRayOp = THREE.MathUtils.smoothstep(underTreeProgress, 0.2, 0.7) * 0.22;
    this.underTreeRayGroup.visible = underRayOp > 0.01;
    this.underTreeRays.forEach((r, i) => {
      r.mat.opacity = underRayOp * (0.7 + Math.sin(i * 1.5) * 0.3);
    });

    const underLightIntensity = THREE.MathUtils.smoothstep(underTreeProgress, 0.2, 0.7) * 0.5;
    this.underTreeLight.intensity = underLightIntensity;
    this.ambient.intensity = baseAmbient + underLightIntensity * 0.35;
  }

  getProjectPoolMeshes() {
    return this.projectPoolMeshes || [];
  }

  setMousePosition(x, y, z, radius) {
    this.grassUniforms.uMousePos.value.set(x, y, z);
    this.grassUniforms.uMouseRadius.value = radius;
  }

  update(time) {
    this.grassUniforms.uTime.value = time;
    if (this.skyUniforms?.uTime) this.skyUniforms.uTime.value = time;
    if (this.fireflies.material.uniforms?.uTime) this.fireflies.material.uniforms.uTime.value = time;
    const pos = this.dustMotes.geometry.attributes.position.array;
    for (let i = 0; i < pos.length; i += 3) {
      pos[i] += Math.sin(time * 0.3 + i * 0.1) * 0.002;
      pos[i + 1] += Math.cos(time * 0.25 + i * 0.07) * 0.003;
    }
    this.dustMotes.geometry.attributes.position.needsUpdate = true;
    const fp = this.fireflies.geometry.attributes.position.array;
    const phases = this.fireflies.geometry.attributes.phase?.array;
    for (let i = 0; i < fp.length; i += 3) {
      const p = phases ? phases[i / 3] : 0;
      fp[i] += Math.sin(time * 2 + p) * 0.008;
      fp[i + 1] += Math.cos(time * 1.7 + p * 1.3) * 0.01;
      fp[i + 2] += Math.sin(time * 1.5 + p * 0.8) * 0.006;
    }
    this.fireflies.geometry.attributes.position.needsUpdate = true;
    this.birds.forEach((b, i) => {
      b.mesh.position.x += Math.sin(time * 0.5 + b.phase) * 0.008;
      b.mesh.position.y += Math.cos(time * 0.3 + b.phase * 1.3) * 0.005;
    });
    const bp = this.bees.geometry.attributes.position.array;
    for (let i = 0; i < bp.length; i += 3) {
      bp[i] += Math.sin(time * 4 + i) * 0.006;
      bp[i + 1] += Math.cos(time * 3.5 + i * 0.7) * 0.008;
      bp[i + 2] += Math.sin(time * 3 + i * 0.5) * 0.004;
    }
    this.bees.geometry.attributes.position.needsUpdate = true;
    const dp = this.dandelions.geometry.attributes.position.array;
    for (let i = 0; i < dp.length; i += 3) {
      dp[i] += Math.sin(time * 0.4 + i * 0.1) * 0.003;
      dp[i + 1] += Math.cos(time * 0.35 + i * 0.08) * 0.004;
      dp[i + 2] += Math.sin(time * 0.3 + i * 0.06) * 0.002;
    }
    this.dandelions.geometry.attributes.position.needsUpdate = true;
  }

  dispose() {}
}
