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

const SPROUT_START_Y = 0.6875 * 0.7;

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
    this.aboutSection = document.getElementById('about-section');
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
    this.mouseOverCanvas = false;
    this.groundPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), -GROUND_Y);
    this.raycaster = new THREE.Raycaster();

    this.cameraBase = { z: 3.2, y: 0.15 };
    this.cameraTarget = new THREE.Vector3(0, 0, 0);
    this._smoothLookY = 0;
    this._lastTime = performance.now() * 0.001;

    this._init();
  }

  _init() {
    this._createRenderer();
    this._createScene();
    this._createCamera();
    this._createObjects();
    this._createPostProcessing();
    this._addEventListeners();
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
    this.camera = new THREE.PerspectiveCamera(45, aspect, 0.1, 100);
    this.camera.position.set(0, 0.15, 3.2);
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
    this.sprout.group.position.y = SPROUT_START_Y;
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
      this.rotationVelocity.x = dy * 0.005;
      this.rotationVelocity.y = dx * 0.005;
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
      this.rotationVelocity.x = dy * 0.005;
      this.rotationVelocity.y = dx * 0.005;
      this.previousMouse.set(e.touches[0].clientX, e.touches[0].clientY);
    }, { passive: true });

    window.addEventListener('touchend', () => { this.isDragging = false; }, { passive: true });

    document.addEventListener('visibilitychange', () => {
      if (document.hidden) this.clock.stop();
      else this.clock.start();
    });

    this.container.addEventListener('click', (e) => this._onClick(e));
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

    const scrollLerp = 1.0 - Math.exp(-5.0 * dt);
    this.smoothScroll += (this.scrollProgress - this.smoothScroll) * scrollLerp;
    const s = this.smoothScroll;

    // ── Phase progress values (linear, easing applied where needed) ──
    const zoomProgress       = clamp01(s / 0.08);
    const sproutProgress     = clamp01((s - 0.06) / 0.29);
    const maturityProgress   = clamp01((s - 0.35) / 0.20);
    const fullGrowthProgress = clamp01((s - 0.55) / 0.45);
    const sunProgress        = clamp01((s - 0.35) / 0.35);
    const underTreeProgress  = clamp01((s - 0.92) / 0.08);

    // ── UI fades ──
    if (this.heroText) {
      const f = 1 - smooth(s / 0.06);
      this.heroText.style.opacity = f;
      this.heroText.style.transform = `translateY(${(1 - f) * -20}px)`;
    }
    if (this.scrollHint) {
      this.scrollHint.style.opacity = 1 - smooth(s / 0.03);
    }

    // Reset seed rotation
    if (s > 0.03) {
      const r = 1.0 - Math.exp(-3.0 * dt);
      this.seed.group.rotation.x *= (1 - r);
      this.seed.group.rotation.z *= (1 - r);
      this.seed.group.rotation.y += (0 - this.seed.group.rotation.y) * r;
      this.container.style.cursor = 'default';
    }

    // ── Phase 2: white sprout grows ──
    this.sprout.setProgress(sproutProgress);

    // Particles fade out
    const pFade = 1 - smooth(sproutProgress / 0.5);
    this.particles.points.material.opacity = pFade;
    this.particles.points.visible = pFade > 0.01;

    // ── Phase 3: maturation — browning, seed sinks, initial leaves ──
    this.sprout.setMaturity(maturityProgress);
    this.environment.setSunProgress(sunProgress, fullGrowthProgress, underTreeProgress);
    this.flowers.setSunProgress(sunProgress);
    this.renderer.toneMappingExposure = lerp(0.52, 0.68, smooth(sunProgress));

    // Seed sinks into the ground
    if (maturityProgress > 0) {
      const sink = smooth(clamp01(maturityProgress / 0.4));
      this.seed.group.position.y = lerp(0, GROUND_Y - 0.8, sink);
      this.seed.group.scale.setScalar(lerp(0.7, 0.2, sink));
      this.seed.group.visible = sink < 0.95;
    } else {
      this.seed.group.position.y = 0;
      this.seed.group.visible = true;
    }

    // Sprout settles to ground level
    if (maturityProgress > 0) {
      const settle = smooth(clamp01(maturityProgress / 0.5));
      this.sprout.group.position.y = lerp(SPROUT_START_Y, GROUND_Y, settle);
    } else {
      this.sprout.group.position.y = SPROUT_START_Y;
    }

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

    // Blend weights — each phase smoothly takes over from previous
    const wSprout = smooth(clamp01(sproutProgress / 0.12));
    const wMat    = smooth(clamp01(maturityProgress / 0.12));
    const wFG     = smooth(clamp01(fullGrowthProgress / 0.12));
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

    this.cameraBase.z = cz;
    this.cameraBase.y = cy;
    this.cameraTarget.y = cty;

    // ── Metaphors — top band, one at a time, never overlaps CV at bottom ──
    const ty = (op) => `${-50 + (1 - op) * 8}%`;
    if (this.plantedText) {
      const ptIn  = smooth(clamp01((sproutProgress - 0.15) / 0.15));
      const ptOut = 1.0 - smooth(clamp01((sproutProgress - 0.55) / 0.12));
      const ptOp  = ptIn * ptOut;
      this.plantedText.style.opacity = ptOp;
      this.plantedText.style.transform = `translate(-50%, ${ty(ptOp)})`;
      this.plantedText.style.visibility = ptOp > 0.01 ? 'visible' : 'hidden';
    }
    if (this.educationText) {
      const eduIn  = smooth(clamp01((sproutProgress - 0.45) / 0.15));
      const eduOut = 1.0 - smooth(clamp01((sproutProgress - 0.92) / 0.08));
      const eduOp  = eduIn * eduOut;
      this.educationText.style.opacity = eduOp;
      this.educationText.style.transform = `translate(-50%, ${ty(eduOp)})`;
      this.educationText.style.visibility = eduOp > 0.01 ? 'visible' : 'hidden';
    }
    if (this.maturityText) {
      const matIn  = smooth(clamp01((maturityProgress - 0.25) / 0.2));
      const matOut = 1.0 - smooth(clamp01((maturityProgress - 0.88) / 0.12));
      const matOp  = matIn * matOut;
      this.maturityText.style.opacity = matOp;
      this.maturityText.style.transform = `translate(-50%, ${ty(matOp)})`;
      this.maturityText.style.visibility = matOp > 0.01 ? 'visible' : 'hidden';
    }
    if (this.grownText) {
      const gtIn = smooth(clamp01((fullGrowthProgress - 0.55) / 0.12));
      const gtOut = 1 - smooth(clamp01((fullGrowthProgress - 0.78) / 0.12));
      const gtOp = gtIn * gtOut;
      this.grownText.style.opacity = gtOp;
      this.grownText.style.transform = `translate(-50%, ${ty(gtOp)})`;
      this.grownText.style.visibility = gtOp > 0.01 ? 'visible' : 'hidden';
    }
    if (this.aboutSection) {
      const aboutOp = smooth(clamp01((fullGrowthProgress - 0.82) / 0.12));
      this.aboutSection.style.opacity = aboutOp;
      this.aboutSection.style.pointerEvents = aboutOp > 0.3 ? 'auto' : 'none';
      this.aboutSection.style.visibility = aboutOp > 0.01 ? 'visible' : 'hidden';
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
    const dt = Math.min(now - this._lastTime, 0.05);
    this._lastTime = now;

    this._updateScroll(dt);

    if (this.smoothScroll < 0.05) {
      this.seed.group.rotation.x += this.rotationVelocity.x;
      this.seed.group.rotation.y += this.rotationVelocity.y;
      if (!this.isDragging) {
        const damp = Math.exp(-3.0 * dt);
        this.rotationVelocity.x *= damp;
        this.rotationVelocity.y *= damp;
      }
    }

    const camLerp = 1.0 - Math.exp(-3.5 * dt);
    this.camera.position.z += (this.cameraBase.z - this.camera.position.z) * camLerp;
    this.camera.position.y += (this.cameraBase.y - this.camera.position.y) * camLerp;

    this._smoothLookY += (this.cameraTarget.y - this._smoothLookY) * camLerp;
    this.camera.lookAt(0, this._smoothLookY, 0);

    this.raycaster.setFromCamera(this.mouseNDC, this.camera);
    const hit = this.raycaster.ray.intersectPlane(this.groundPlane, this.mouseWorld);
    const mouseRadius = this.mouseOverCanvas && hit && this.smoothScroll > 0.2 ? 1.8 : 0;
    this.environment.setMousePosition(this.mouseWorld.x, this.mouseWorld.y, this.mouseWorld.z, mouseRadius);

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

    this.camera.layers.disable(1);
    this.composer.render();
    this.camera.layers.enable(1);

    const oldAutoClear = this.renderer.autoClear;
    this.renderer.autoClear = false;
    this.camera.layers.set(1);
    this.renderer.render(this.scene, this.camera);
    this.camera.layers.set(0);
    this.camera.layers.enable(1);
    this.renderer.autoClear = oldAutoClear;
  }
}

new App();
