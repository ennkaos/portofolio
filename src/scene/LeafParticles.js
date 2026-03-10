import * as THREE from 'three';
import leafVertex from '../shaders/leafParticleVertex.glsl?raw';
import leafFragment from '../shaders/leafParticleFragment.glsl?raw';
import { GROUND_Y } from './Environment.js';

const LEAF_COUNT = 18;
const INNER_R = 4.0;
const OUTER_R = 7.0;
const HEIGHT_MIN = 2.0;
const HEIGHT_MAX = 6.0;
const CANOPY_MID = new THREE.Color(0x405830);
const CANOPY_LIGHT = new THREE.Color(0x4D6B38);
const CANOPY_BRIGHT = new THREE.Color(0x5A7A42);
const CANOPY_WARM = new THREE.Color(0x6B8A4A);

export class LeafParticles {
  constructor() {
    this.uniforms = {
      uTime: { value: 0 },
      uWindStr: { value: 1 },
      uPixelRatio: { value: Math.min(window.devicePixelRatio, 2) },
      uVisible: { value: 0 },
      uColor1: { value: CANOPY_MID },
      uColor2: { value: CANOPY_BRIGHT },
      uColor3: { value: CANOPY_WARM },
    };
    this._build();
  }

  _build() {
    const positions = new Float32Array(LEAF_COUNT * 3);
    const phases = new Float32Array(LEAF_COUNT);
    const sizes = new Float32Array(LEAF_COUNT);
    const fallSpeeds = new Float32Array(LEAF_COUNT);

    for (let i = 0; i < LEAF_COUNT; i++) {
      const r = INNER_R + Math.sqrt(Math.random()) * (OUTER_R - INNER_R);
      const theta = Math.random() * Math.PI * 2;
      positions[i * 3]     = Math.cos(theta) * r + (Math.random() - 0.5) * 0.5;
      positions[i * 3 + 1] = HEIGHT_MIN + Math.random() * (HEIGHT_MAX - HEIGHT_MIN);
      positions[i * 3 + 2] = Math.sin(theta) * r + (Math.random() - 0.5) * 0.5;

      phases[i] = Math.random();
      sizes[i] = 0.85 + Math.random() * 1.1;
      fallSpeeds[i] = 0.08 + Math.random() * 0.06;
    }

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('aPhase', new THREE.BufferAttribute(phases, 1));
    geometry.setAttribute('aSize', new THREE.BufferAttribute(sizes, 1));
    geometry.setAttribute('aFallSpeed', new THREE.BufferAttribute(fallSpeeds, 1));

    const material = new THREE.ShaderMaterial({
      name: 'LeafParticles',
      vertexShader: leafVertex,
      fragmentShader: leafFragment,
      uniforms: this.uniforms,
      transparent: true,
      depthWrite: false,
      depthTest: true,
      blending: THREE.NormalBlending,
    });

    this.points = new THREE.Points(geometry, material);
    this.points.renderOrder = 5;
  }

  update(time, windStr, visible) {
    this.uniforms.uTime.value = time;
    this.uniforms.uWindStr.value = windStr;
    this.uniforms.uVisible.value = visible;
    this.points.visible = visible > 0.01;
  }

  handleResize() {
    this.uniforms.uPixelRatio.value = Math.min(window.devicePixelRatio, 2);
  }

  dispose() {
    this.points.geometry.dispose();
    this.points.material.dispose();
  }
}
