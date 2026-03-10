import * as THREE from 'three';

import particleVertexShader from '../shaders/particleVertex.glsl?raw';
import particleFragmentShader from '../shaders/particleFragment.glsl?raw';

const PARTICLE_COUNT = 300;
const NATURE_GREEN = new THREE.Color(0x7ECB82);

export class Particles {
  constructor() {
    this.uniforms = {
      uTime: { value: 0 },
      uPixelRatio: { value: Math.min(window.devicePixelRatio, 2) },
      uColor: { value: NATURE_GREEN },
    };
    this._build();
  }

  _build() {
    const positions = new Float32Array(PARTICLE_COUNT * 3);
    const sizes = new Float32Array(PARTICLE_COUNT);
    const phases = new Float32Array(PARTICLE_COUNT);

    for (let i = 0; i < PARTICLE_COUNT; i++) {
      const i3 = i * 3;
      const radius = 1.2 + Math.random() * 1.8;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);

      positions[i3] = radius * Math.sin(phi) * Math.cos(theta);
      positions[i3 + 1] = radius * Math.sin(phi) * Math.sin(theta) * 0.6 - 0.2;
      positions[i3 + 2] = radius * Math.cos(phi);

      sizes[i] = 0.3 + Math.random() * 0.7;
      phases[i] = Math.random();
    }

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('aSize', new THREE.BufferAttribute(sizes, 1));
    geometry.setAttribute('aPhase', new THREE.BufferAttribute(phases, 1));

    const material = new THREE.ShaderMaterial({
      name: 'Particles',
      vertexShader: particleVertexShader,
      fragmentShader: particleFragmentShader,
      uniforms: this.uniforms,
      transparent: true,
      depthWrite: false,
      depthTest: true,
      blending: THREE.AdditiveBlending,
    });

    this.points = new THREE.Points(geometry, material);
  }

  update(time) {
    this.uniforms.uTime.value = time;
  }

  handleResize() {
    this.uniforms.uPixelRatio.value = Math.min(window.devicePixelRatio, 2);
  }

  dispose() {
    this.points.geometry.dispose();
    this.points.material.dispose();
  }
}
