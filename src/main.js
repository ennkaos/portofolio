import * as THREE from 'three';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { gsap } from 'gsap';
import { Seed } from './scene/Seed.js';
import { Particles } from './scene/Particles.js';
import { LeafParticles } from './scene/LeafParticles.js';
import { Flowers } from './scene/Flowers.js';
import { Environment, GROUND_Y } from './scene/Environment.js';
import { Sprout } from './scene/Sprout.js';
import { getLang, setLang, applyTranslations } from './i18n.js';

const TRUNK_BASE_OFFSET = 0.08;

class App {
  constructor() {
    this.container = document.getElementById('canvas-container');
    this.loadingScreen = document.getElementById('loading-screen');
    this.overlay = document.getElementById('overlay');
    this.heroText = document.querySelector('.hero-text');
    this.scrollHint = document.querySelector('.scroll-hint');
    this.plantedText = document.querySelector('.planted-text');
    this.educationText = document.querySelector('.education-text');
    this.maturityText = document.querySelector('.maturity-text');
    this.grownText = document.querySelector('.grown-text');
    this.treeText = document.querySelector('.tree-text');
    this.aboutSection = document.getElementById('contact');
    this.poolHints = document.getElementById('pool-hints');
    this.clock = new THREE.Clock();
    this.prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    this.scrollProgress = 0;
    this.smoothScroll = 0;

    this.isDragging = false;
    this.previousMouse = new THREE.Vector2();
    this.rotationVelocity = new THREE.Vector2();

    this.mouseNDC = new THREE.Vector2(-2, -2);
    this.mouseWorld = new THREE.Vector3(0, GROUND_Y, 0);
    this._smoothMouseWorld = new THREE.Vector3(0, GROUND_Y, 0);
    this.mouseOverCanvas = false;
    this.groundPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), -GROUND_Y);
    this.raycaster = new THREE.Raycaster();

    this.cameraBase = { z: 3.2, y: 0.15 };
    this.cameraTarget = new THREE.Vector3(0, 0, 0);
    this._smoothLookY = 0;
    this._smoothCamZ = 3.2;
    this._smoothCamY = 0.15;
    this._seedOpacitySmooth = 1;
    this._lastTime = performance.now() * 0.001;
    this.isMobile = window.innerWidth < 768 || 'ontouchstart' in window;
    this.mobileZoomFactor = 1.35;

    this._init();
  }

  _init() {
    this._createRenderer();
    this._createScene();
    this._createCamera();
    this._createObjects();
    this._createPostProcessing();
    this._addEventListeners();
    const currentLang = getLang();
    applyTranslations(currentLang);
    document.querySelectorAll('.lang-btn').forEach((b) => {
      b.classList.toggle('active', b.dataset.lang === currentLang);
      b.setAttribute('aria-pressed', b.dataset.lang === currentLang);
    });
    this._hideLoading();
    this._animate();
  }

  _createRenderer() {
    this.renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: false,
      powerPreference: 'high-performance',
    });
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    const pr = this._getPixelRatio();
    this.renderer.setPixelRatio(pr);
    this.renderer.setClearColor(0x0a1208, 1);
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 0.52;
    this.container.appendChild(this.renderer.domElement);
    this.renderer.debug.onShaderError = (gl, program, vShader, fShader) => {
      const vLog = gl.getShaderInfoLog(vShader);
      const fLog = gl.getShaderInfoLog(fShader);
      console.error('Vertex shader log:', vLog);
      console.error('Fragment shader log:', fLog);
    };
  }

  _createPostProcessing() {
    this.composer = new EffectComposer(this.renderer);
    this.composer.addPass(new RenderPass(this.scene, this.camera));
    this.bloomPass = new UnrealBloomPass(
      new THREE.Vector2(window.innerWidth, window.innerHeight),
      0.08, 0.25, 0.96
    );
    this.composer.addPass(this.bloomPass);
  }

  _createScene() {
    this.scene = new THREE.Scene();
  }

  _createCamera() {
    const aspect = window.innerWidth / window.innerHeight;
    const fov = this.isMobile ? 55 : 45;
    this.camera = new THREE.PerspectiveCamera(fov, aspect, 0.1, 100);
    const zInit = this.isMobile ? 3.2 * this.mobileZoomFactor : 3.2;
    this.camera.position.set(0, 0.15, zInit);
    this.camera.lookAt(0, 0, 0);
  }

  _createObjects() {
    this.seed = new Seed();
    this.seed.group.renderOrder = 0;
    this.scene.add(this.seed.group);

    this.particles = new Particles();
    this.particles.points.renderOrder = 1;
    this.scene.add(this.particles.points);

    this.leafParticles = new LeafParticles();
    this.scene.add(this.leafParticles.points);

    this.environment = new Environment(this.scene);
    this.flowers = new Flowers(this.scene);

    this.sprout = new Sprout();
    this.sprout.group.renderOrder = 0;
    this.scene.add(this.sprout.group);
  }

  _addEventListeners() {
    window.addEventListener('resize', this._onResize.bind(this), { passive: true });

    window.addEventListener('scroll', () => {
      const scrollTop = window.scrollY;
      const maxScroll = document.getElementById('scroll-spacer').offsetHeight - window.innerHeight;
      this.scrollProgress = THREE.MathUtils.clamp(scrollTop / Math.max(maxScroll, 1), 0, 1);
    }, { passive: true });

    this.container.addEventListener('mousemove', (e) => {
      const rect = this.container.getBoundingClientRect();
      this.mouseNDC.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      this.mouseNDC.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
    });
    this.container.addEventListener('mouseenter', () => { this.mouseOverCanvas = true; });
    this.container.addEventListener('mouseleave', () => { this.mouseOverCanvas = false; });

    this.container.addEventListener('mousedown', (e) => {
      if (this.smoothScroll > 0.05) return;
      this.isDragging = true;
      this.previousMouse.set(e.clientX, e.clientY);
      this.container.style.cursor = 'grabbing';
    });

    window.addEventListener('mousemove', (e) => {
      if (!this.isDragging) return;
      const dx = e.clientX - this.previousMouse.x;
      const dy = e.clientY - this.previousMouse.y;
      this.rotationVelocity.x = dy * 0.0035;
      this.rotationVelocity.y = dx * 0.0035;
      this.previousMouse.set(e.clientX, e.clientY);
    });

    window.addEventListener('mouseup', () => {
      this.isDragging = false;
      if (this.smoothScroll < 0.05) this.container.style.cursor = 'grab';
    });

    this.container.addEventListener('touchstart', (e) => {
      if (this.smoothScroll > 0.05 || e.touches.length !== 1) return;
      this.isDragging = true;
      this.previousMouse.set(e.touches[0].clientX, e.touches[0].clientY);
    }, { passive: true });

    window.addEventListener('touchmove', (e) => {
      if (!this.isDragging || e.touches.length !== 1) return;
      const dx = e.touches[0].clientX - this.previousMouse.x;
      const dy = e.touches[0].clientY - this.previousMouse.y;
      this.rotationVelocity.x = dy * 0.0035;
      this.rotationVelocity.y = dx * 0.0035;
      this.previousMouse.set(e.touches[0].clientX, e.touches[0].clientY);
    }, { passive: true });

    window.addEventListener('touchend', () => { this.isDragging = false; }, { passive: true });

    document.addEventListener('visibilitychange', () => {
      if (document.hidden) this.clock.stop();
      else this.clock.start();
    });

    this.container.addEventListener('click', (e) => this._onClick(e));

    document.querySelectorAll('.lang-btn').forEach((btn) => {
      btn.addEventListener('click', () => {
        const lang = btn.dataset.lang;
        setLang(lang);
        document.querySelectorAll('.lang-btn').forEach((b) => {
          b.classList.toggle('active', b.dataset.lang === lang);
          b.setAttribute('aria-pressed', b.dataset.lang === lang);
        });
      });
    });
  }

  _onClick(e) {
    if (this.smoothScroll < 0.2) return;
    const rect = this.container.getBoundingClientRect();
    this.mouseNDC.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    this.mouseNDC.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
    this.raycaster.setFromCamera(this.mouseNDC, this.camera);

    const projectPools = this.environment.getProjectPoolMeshes();
    const poolHits = this.raycaster.intersectObjects(projectPools);
    if (poolHits.length > 0 && poolHits[0].object.userData.repoUrl) {
      window.open(poolHits[0].object.userData.repoUrl, '_blank', 'noopener,noreferrer');
      return;
    }

    const treeMeshes = [];
    this.sprout.group.traverse((obj) => { if (obj.isMesh) treeMeshes.push(obj); });
    const hits = this.raycaster.intersectObjects(treeMeshes);
    if (hits.length > 0) this.sprout.triggerRustle();
  }

  _getPixelRatio() {
    const isMobile = window.innerWidth < 768 || 'ontouchstart' in window;
    return isMobile ? Math.min(window.devicePixelRatio, 1.5) : Math.min(window.devicePixelRatio, 2);
  }

  _onResize() {
    const w = window.innerWidth;
    const h = window.innerHeight;
    this.isMobile = w < 768 || 'ontouchstart' in window;
    this.camera.fov = this.isMobile ? 55 : 45;
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(w, h);
    const pr = this._getPixelRatio();
    this.renderer.setPixelRatio(pr);
    this.composer.setSize(w, h);
    this.composer.setPixelRatio(pr);
    this.bloomPass.resolution.set(w, h);
    this.particles.handleResize();
    this.leafParticles.handleResize();
  }

  _hideLoading() {
    setTimeout(() => {
      this.loadingScreen.classList.add('hidden');
      this.overlay.classList.add('visible');
      this.container.style.cursor = 'grab';

      gsap.from(this.camera.position, {
        z: 6, y: 0.8, duration: 2.5, ease: 'power3.out',
        onUpdate: () => this.camera.lookAt(0, 0, 0),
      });

      this.seed.group.scale.set(0, 0, 0);
      gsap.to(this.seed.group.scale, {
        x: 0.7, y: 0.7, z: 0.7, duration: 2, ease: 'elastic.out(1, 0.6)', delay: 0.3,
      });
    }, 800);
  }

  _updateScroll(dt) {
    const clamp01 = (t) => Math.max(0, Math.min(1, t));
    const smooth = (t) => { t = clamp01(t); return t * t * (3 - 2 * t); };
    const lerp = THREE.MathUtils.lerp;

    const scrollLerp = 1.0 - Math.exp(-3.2 * dt);
    this.smoothScroll += (this.scrollProgress - this.smoothScroll) * scrollLerp;
    const s = this.smoothScroll;

    // ── Phase progress values (overlapping for smoother transitions) ──
    const plantProgress      = clamp01(s / 0.05);
    const zoomProgress       = clamp01(s / 0.08);
    const sproutProgress     = clamp01((s - 0.06) / 0.32);
    const maturityProgress   = clamp01((s - 0.28) / 0.32);
    const fullGrowthProgress = clamp01((s - 0.48) / 0.52);
    const sunProgress        = clamp01((s - 0.10) / 0.50);
    const underTreeProgress  = clamp01((s - 0.92) / 0.08);

    // ── UI fades (hero, scroll hint) ──
    if (this.heroText) {
      const f = 1 - smooth(s / 0.05);
      this.heroText.style.opacity = f;
      this.heroText.style.visibility = f > 0.01 ? 'visible' : 'hidden';
      this.heroText.style.transform = `translateY(${(1 - f) * -20}px)`;
    }
    if (this.scrollHint) {
      const atBottom = s > 0.96;
      const downOpacity = 1 - smooth(s / 0.03);
      const upOpacity = atBottom ? smooth((s - 0.96) / 0.04) : 0;
      this.scrollHint.classList.toggle('scroll-at-bottom', atBottom);
      this.scrollHint.style.opacity = atBottom ? upOpacity : downOpacity;
    }

    // Reset seed drag rotation (y, z) when scroll starts; keep planting tilt (x)
    if (s > 0.03) {
      const r = 1.0 - Math.exp(-2.5 * dt);
      this.seed.group.rotation.z *= (1 - r);
      this.seed.group.rotation.y += (0 - this.seed.group.rotation.y) * r;
      this.container.style.cursor = 'default';
    }

    // ── Planting: seed sinks into earth as scroll starts ──
    const plantedY = GROUND_Y + 0.12;
    const groundFadeStart = 0.2;
    const groundFadeEnd = -0.5;
    let seedOpacityTarget;
    if (maturityProgress > 0) {
      const sink = smooth(clamp01(maturityProgress / 0.4));
      this.seed.group.position.y = lerp(plantedY, GROUND_Y - 0.8, sink);
      this.seed.group.scale.setScalar(lerp(0.12, 0.08, sink));
      seedOpacityTarget = smooth(clamp01((this.seed.group.position.y - groundFadeEnd) / (groundFadeStart - groundFadeEnd)));
    } else {
      const plantRaw = clamp01(plantProgress);
      const plant = plantRaw * plantRaw * (2.2 - 1.2 * plantRaw);
      const overshoot = plantRaw > 0.75 ? -0.03 * smooth((plantRaw - 0.75) / 0.25) * (1 - smooth((plantRaw - 0.85) / 0.15)) : 0;
      this.seed.group.position.y = lerp(0, plantedY, plant) + overshoot;
      const shrink = smooth(clamp01(sproutProgress / 0.35));
      this.seed.group.scale.setScalar(lerp(0.7, 0.12, shrink));
      const tilt = plant < 0.25 ? 0 : lerp(0, 0.14, smooth((plant - 0.25) / 0.75));
      this.seed.group.rotation.x = tilt;
      seedOpacityTarget = smooth(clamp01((this.seed.group.position.y - groundFadeEnd) / (groundFadeStart - groundFadeEnd)));
    }
    const seedOpacityLerp = 1.0 - Math.exp(-4.0 * dt);
    this._seedOpacitySmooth += (seedOpacityTarget - this._seedOpacitySmooth) * seedOpacityLerp;
    this.seed.setOpacity(this._seedOpacitySmooth);
    this.seed.group.visible = this._seedOpacitySmooth > 0.01;

    // ── Phase 2: white sprout grows ──
    this.sprout.setProgress(sproutProgress);

    // Dirt particles fade out as sprout grows
    const pFade = 1 - smooth(sproutProgress / 0.5);
    this.particles.setOpacity(pFade);
    this.particles.points.visible = pFade > 0.01;

    // ── Phase 3: maturation — browning, seed sinks, initial leaves ──
    this.sprout.setMaturity(maturityProgress);
    this.environment.setSunProgress(sunProgress, fullGrowthProgress, underTreeProgress);
    this.flowers.setSunProgress(sunProgress);
    this.renderer.toneMappingExposure = lerp(0.52, 0.68, smooth(sunProgress));

    // Sprout base aligns with seed — trunk grows from where seed is planted
    // Smooth transition: avoid floating-then-drop by lerping trunk to ground as seed sinks
    const trunkGroundY = GROUND_Y + TRUNK_BASE_OFFSET;
    const trunkFollowSeedY = this.seed.group.position.y + TRUNK_BASE_OFFSET;
    const trunkSettle = smooth(clamp01(maturityProgress * 3.5));
    this.sprout.group.position.y = lerp(trunkFollowSeedY, trunkGroundY, trunkSettle);

    // ── Phase 4: full growth ──
    this.sprout.setFullGrowth(fullGrowthProgress);

    // ── Camera — smoothly blended across all phases ──
    const h = this.sprout.getHeight();
    const treeBase = this.sprout.group.position.y;

    // Seed/zoom phase camera
    const zE = smooth(zoomProgress);
    const seedCam = { z: lerp(3.2, 5.0, zE), y: lerp(0.15, 0.4, zE), ty: 0 };

    // Sprout phase camera
    const sE = smooth(sproutProgress);
    const sproutCam = { z: lerp(5.0, 7.0, sE), y: 0.4 + h * 0.25, ty: h * 0.30 };

    // Maturity phase camera
    const scaleYM = 1.0 + maturityProgress * 0.3;
    const treeMidM = (treeBase + treeBase + h * scaleYM) * 0.5;
    const mE = smooth(maturityProgress);
    const matCam = { z: lerp(7.0, 10.0, mE), y: treeMidM + 0.6, ty: treeMidM - 0.2 };

    // Full growth phase camera
    const scaleYF = 1.0 + maturityProgress * 0.3 + fullGrowthProgress * 0.4;
    const treeMidF = (treeBase + treeBase + h * scaleYF) * 0.5;
    const fE = smooth(fullGrowthProgress);
    const fgCam = { z: lerp(10.0, 26.0, fE), y: treeMidF + 1.2, ty: treeMidF - 0.2 };

    // Under tree phase — camera moves under the tree, looking up at crown
    const crownCenterY = treeBase + 4.5;
    const underTreeCam = {
      z: 2.2,
      y: GROUND_Y + 0.4,
      ty: crownCenterY,
    };

    // Blend weights — wider overlap for smoother phase transitions
    const wSprout = smooth(clamp01(sproutProgress / 0.35));
    const wMat    = smooth(clamp01(maturityProgress / 0.4));
    const wFG     = smooth(clamp01(fullGrowthProgress / 0.4));
    const wUnder  = smooth(underTreeProgress);

    let cz = seedCam.z, cy = seedCam.y, cty = seedCam.ty;
    cz  = lerp(cz,  sproutCam.z,  wSprout);
    cy  = lerp(cy,  sproutCam.y,  wSprout);
    cty = lerp(cty, sproutCam.ty, wSprout);
    cz  = lerp(cz,  matCam.z,  wMat);
    cy  = lerp(cy,  matCam.y,  wMat);
    cty = lerp(cty, matCam.ty, wMat);
    cz  = lerp(cz,  fgCam.z,  wFG);
    cy  = lerp(cy,  fgCam.y,  wFG);
    cty = lerp(cty, fgCam.ty, wFG);
    cz  = lerp(cz,  underTreeCam.z,  wUnder);
    cy  = lerp(cy,  underTreeCam.y,  wUnder);
    cty = lerp(cty, underTreeCam.ty, wUnder);

    const camSmooth = 1.0 - Math.exp(-3.5 * dt);
    this._smoothCamZ += (cz - this._smoothCamZ) * camSmooth;
    this._smoothCamY += (cy - this._smoothCamY) * camSmooth;
    this.cameraBase.z = this._smoothCamZ;
    this.cameraBase.y = this._smoothCamY;
    this.cameraTarget.y = cty;

    // ── Metaphors — evenly spread across scroll, one visible at any time until drawer (s≈0.98) ──
    const ty = (op) => `${-50 + (1 - op) * 8}%`;
    const fade = 0.08;
    if (this.plantedText) {
      const ptIn  = smooth(clamp01((s - 0.00) / fade));
      const ptOut = 1.0 - smooth(clamp01((s - 0.16) / fade));
      const ptOp  = ptIn * ptOut;
      this.plantedText.style.opacity = ptOp;
      this.plantedText.style.transform = `translate(-50%, ${ty(ptOp)})`;
      this.plantedText.style.visibility = ptOp > 0.01 ? 'visible' : 'hidden';
    }
    if (this.educationText) {
      const eduIn  = smooth(clamp01((s - 0.16) / fade));
      const eduOut = 1.0 - smooth(clamp01((s - 0.32) / fade));
      const eduOp  = eduIn * eduOut;
      this.educationText.style.opacity = eduOp;
      this.educationText.style.transform = `translate(-50%, ${ty(eduOp)})`;
      this.educationText.style.visibility = eduOp > 0.01 ? 'visible' : 'hidden';
    }
    if (this.maturityText) {
      const matIn  = smooth(clamp01((s - 0.32) / fade));
      const matOut = 1.0 - smooth(clamp01((s - 0.48) / fade));
      const matOp  = matIn * matOut;
      this.maturityText.style.opacity = matOp;
      this.maturityText.style.transform = `translate(-50%, ${ty(matOp)})`;
      this.maturityText.style.visibility = matOp > 0.01 ? 'visible' : 'hidden';
    }
    if (this.grownText) {
      const gtIn  = smooth(clamp01((s - 0.48) / fade));
      const gtOut = 1.0 - smooth(clamp01((s - 0.64) / fade));
      const gtOp  = gtIn * gtOut;
      this.grownText.style.opacity = gtOp;
      this.grownText.style.transform = `translate(-50%, ${ty(gtOp)})`;
      this.grownText.style.visibility = gtOp > 0.01 ? 'visible' : 'hidden';
    }
    if (this.treeText) {
      const treeIn  = smooth(clamp01((s - 0.64) / fade));
      const treeOut = 1.0 - smooth(clamp01((s - 0.90) / fade));
      const treeOp  = treeIn * treeOut;
      this.treeText.style.opacity = treeOp;
      this.treeText.style.transform = `translate(-50%, ${ty(treeOp)})`;
      this.treeText.style.visibility = treeOp > 0.01 ? 'visible' : 'hidden';
    }
    if (this.poolHints) {
      const hintOp = THREE.MathUtils.smoothstep(sunProgress, 0.35, 0.55) * (1 - THREE.MathUtils.smoothstep(fullGrowthProgress, 0.85, 0.95));
      this.poolHints.style.opacity = hintOp;
      this.poolHints.style.visibility = hintOp > 0.01 ? 'visible' : 'hidden';
    }

    this._fullGrowthProgress = fullGrowthProgress;
  }

  _animate() {
    requestAnimationFrame(this._animate.bind(this));
    let time = this.clock.getElapsedTime();
    if (this.prefersReducedMotion) time *= 0.02;

    const now = performance.now() * 0.001;
    const dt = Math.min(now - this._lastTime, 0.08);
    this._lastTime = now;

    this._updateScroll(dt);

    if (this.smoothScroll < 0.05) {
      this.seed.group.rotation.x += this.rotationVelocity.x;
      this.seed.group.rotation.y += this.rotationVelocity.y;
      if (!this.isDragging) {
        const damp = Math.exp(-2.5 * dt);
        this.rotationVelocity.x *= damp;
        this.rotationVelocity.y *= damp;
      }
    }

    const camLerp = 1.0 - Math.exp(-2.5 * dt);
    const zTarget = this.cameraBase.z * (this.isMobile ? this.mobileZoomFactor : 1);
    this.camera.position.z += (zTarget - this.camera.position.z) * camLerp;
    this.camera.position.y += (this.cameraBase.y - this.camera.position.y) * camLerp;

    this._smoothLookY += (this.cameraTarget.y - this._smoothLookY) * camLerp;
    this.camera.lookAt(0, this._smoothLookY, 0);

    this.raycaster.setFromCamera(this.mouseNDC, this.camera);
    const hit = this.raycaster.ray.intersectPlane(this.groundPlane, this.mouseWorld);
    const mouseRadius = this.mouseOverCanvas && hit && this.smoothScroll > 0.2 ? 1.8 : 0;
    if (hit) {
      const mouseLerp = 1.0 - Math.exp(-4.0 * dt);
      this._smoothMouseWorld.lerpVectors(this._smoothMouseWorld, this.mouseWorld, mouseLerp);
    }
    this.environment.setMousePosition(this._smoothMouseWorld.x, this._smoothMouseWorld.y, this._smoothMouseWorld.z, mouseRadius);

    this.seed.update(time);
    this.particles.update(time);
    this.sprout.update(time);
    this.environment.update(time);

    const windGust = Math.max(0, Math.sin(time * 0.15) * 2 - 1.2) * 0.6;
    const windStr = 1.0 + windGust;
    const leafVisible = this._fullGrowthProgress !== undefined
      ? THREE.MathUtils.smoothstep(this._fullGrowthProgress, 0.08, 0.45)
      : 0;
    this.leafParticles.update(time, windStr, leafVisible);

    this.composer.render();

  }
}

new App();
