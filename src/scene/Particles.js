import * as THREE from 'three';

import particleVertexShader from '../shaders/particleVertex.glsl?raw';
import particleFragmentShader from '../shaders/particleFragment.glsl?raw';
import moundVertexShader from '../shaders/moundVertex.glsl?raw';
import moundFragmentShader from '../shaders/moundFragment.glsl?raw';

const PARTICLE_COUNT = 380;
// Earthy palette — soil, clay, organic, pebbles
const DIRT_DARK = new THREE.Color(0x2d1c12);
const DIRT_MID = new THREE.Color(0x4a3220);
const DIRT_LIGHT = new THREE.Color(0x6b4532);
const CLAY = new THREE.Color(0x5c4033);
const PEBBLE = new THREE.Color(0x5a5248);

export class Particles {
  constructor() {
    this.uniforms = {
      uTime: { value: 0 },
      uPixelRatio: { value: Math.min(window.devicePixelRatio, 2) },
      uColorDark: { value: DIRT_DARK },
      uColorMid: { value: DIRT_MID },
      uColorLight: { value: DIRT_LIGHT },
      uClay: { value: CLAY },
      uPebble: { value: PEBBLE },
      uOpacity: { value: 1 },
    };
    this._build();
  }

  _build() {
    const positions = new Float32Array(PARTICLE_COUNT * 3);
    const sizes = new Float32Array(PARTICLE_COUNT);
    const phases = new Float32Array(PARTICLE_COUNT);
    const colorMix = new Float32Array(PARTICLE_COUNT);
    const particleType = new Float32Array(PARTICLE_COUNT);

    const rnd = (s) => (Math.abs(Math.sin(s * 12.9898) * 43758.5453) % 1);

    for (let i = 0; i < PARTICLE_COUNT; i++) {
      const i3 = i * 3;
      const angle = rnd(i * 2.1) * Math.PI * 2;
      const radius = 0.3 + rnd(i * 3.7) * 12;
      const r = radius * (0.9 + rnd(i * 5.3) * 0.2);

      positions[i3] = Math.cos(angle) * r;
      positions[i3 + 1] = -0.35 + rnd(i * 7.1) * 0.3;
      positions[i3 + 2] = Math.sin(angle) * r;

      sizes[i] = 0.12 + rnd(i * 11.3) * 0.4;
      phases[i] = rnd(i * 13.7);
      colorMix[i] = rnd(i * 17.9);
      particleType[i] = rnd(i * 19.1);
    }

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('aSize', new THREE.BufferAttribute(sizes, 1));
    geometry.setAttribute('aPhase', new THREE.BufferAttribute(phases, 1));
    geometry.setAttribute('aColorMix', new THREE.BufferAttribute(colorMix, 1));
    geometry.setAttribute('aType', new THREE.BufferAttribute(particleType, 1));

    const material = new THREE.ShaderMaterial({
      name: 'Particles',
      vertexShader: particleVertexShader,
      fragmentShader: particleFragmentShader,
      uniforms: this.uniforms,
      transparent: true,
      depthWrite: false,
      depthTest: true,
      blending: THREE.NormalBlending,
    });

    this.points = new THREE.Points(geometry, material);

    // Dirt mound — textured earth extending to bottom of screen
    this.moundUniforms = { uTime: { value: 0 }, uOpacity: { value: 0.85 } };
    const moundGeo = new THREE.RingGeometry(0.35, 28, 64);
    const moundMat = new THREE.ShaderMaterial({
      vertexShader: moundVertexShader,
      fragmentShader: moundFragmentShader,
      uniforms: this.moundUniforms,
      transparent: true,
      depthWrite: false,
      side: THREE.DoubleSide,
    });
    this.mound = new THREE.Mesh(moundGeo, moundMat);
    this.mound.rotation.x = -Math.PI / 2;
    this.mound.position.y = -0.35;
    this.mound.renderOrder = 0;
    this.points.add(this.mound);
  }

  update(time) {
    this.uniforms.uTime.value = time;
    if (this.moundUniforms) this.moundUniforms.uTime.value = time;
  }

  setOpacity(v) {
    this.uniforms.uOpacity.value = v;
    if (this.moundUniforms) this.moundUniforms.uOpacity.value = 0.85 * v;
  }

  handleResize() {
    this.uniforms.uPixelRatio.value = Math.min(window.devicePixelRatio, 2);
  }

  dispose() {
    this.points.geometry.dispose();
    this.points.material.dispose();
    if (this.mound) {
      this.mound.geometry.dispose();
      this.mound.material.dispose();
    }
  }
}
