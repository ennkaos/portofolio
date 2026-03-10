import * as THREE from 'three';
import { FontLoader } from 'three/addons/loaders/FontLoader.js';
import { TextGeometry } from 'three/addons/geometries/TextGeometry.js';

import seedVertexShader from '../shaders/seedVertex.glsl?raw';
import seedFragmentShader from '../shaders/seedFragment.glsl?raw';

const SHELL_DARK = new THREE.Color(0x6B3418);
const SHELL_MID = new THREE.Color(0x9B5A28);
const SHELL_LIGHT = new THREE.Color(0xBB7A3C);
const CAP_COLOR = new THREE.Color(0xC8B89A);
const GLOW_COLOR = new THREE.Color(0x5DB075);

export class Seed {
  constructor() {
    this.group = new THREE.Group();
    this.uniforms = {
      uTime: { value: 0 },
      uPulse: { value: 1.0 },
      uColorDark: { value: SHELL_DARK },
      uColorMid: { value: SHELL_MID },
      uColorLight: { value: SHELL_LIGHT },
      uCapColor: { value: CAP_COLOR },
      uGlowColor: { value: GLOW_COLOR },
    };
    this.textMesh = null;
    this._buildChestnut();
    this._buildStem();
    this._buildText();
    this.group.scale.setScalar(0.7);
  }

  _buildChestnut() {
    const segs = 96;
    const geometry = new THREE.SphereGeometry(0.55, segs, segs);
    const pos = geometry.attributes.position;

    const yStretch = 1.25;
    const tipY = 0.55 * yStretch;

    for (let i = 0; i < pos.count; i++) {
      let x = pos.getX(i);
      let y = pos.getY(i);
      let z = pos.getZ(i);

      const r = Math.sqrt(x * x + y * y + z * z);

      if (r < 0.001) {
        pos.setXYZ(i, 0, tipY, 0);
        continue;
      }

      const theta = Math.acos(THREE.MathUtils.clamp(y / r, -1, 1));
      const phi = Math.atan2(z, x);
      const t = theta / Math.PI;

      // Body profile scale (only used for t >= 0.15)
      let rScale = 1.0;
      if (t < 0.25) {
        const lt = t / 0.25;
        rScale = THREE.MathUtils.lerp(0.6, 1.05, Math.pow(lt, 0.5));
      } else if (t < 0.4) {
        const lt = (t - 0.25) / 0.15;
        rScale = 1.05 + Math.sin(lt * Math.PI * 0.5) * 0.08;
      } else if (t < 0.6) {
        const lt = (t - 0.4) / 0.2;
        rScale = 1.13 + Math.sin(lt * Math.PI) * 0.03;
      } else if (t < 0.8) {
        const lt = (t - 0.6) / 0.2;
        rScale = THREE.MathUtils.lerp(1.13, 0.95, lt * lt);
      } else {
        const lt = (t - 0.8) / 0.2;
        rScale = THREE.MathUtils.lerp(0.95, 0.55, Math.pow(lt, 0.8));
      }

      // Flat face on +Z side
      let zDeformed = z;
      if (z > 0) {
        const flatStrength = 0.35;
        const edgeSoftness = 1.0 - Math.pow(Math.abs(x) / (r + 0.001), 2) * 0.4;
        zDeformed = z * (1.0 - flatStrength * edgeSoftness);
      }

      const asymX = 1.0 + Math.sin(phi * 2.0) * 0.02 + Math.sin(phi * 5.0 + 1.0) * 0.008;
      const asymZ = 1.0 + Math.cos(phi * 3.0 + 0.5) * 0.015;

      const ridgeCount = 6.0;
      const ridgeDepth = 0.012;
      const ridge = Math.sin(phi * ridgeCount) * ridgeDepth * (1.0 - Math.pow(Math.abs(t - 0.5) * 2.0, 3.0));

      // Compute the full body position
      let bx = x * rScale * asymX + (x / r) * ridge;
      let by = y * rScale * yStretch;
      let bz = zDeformed * rScale * asymZ + (z / r) * ridge;

      // For vertices near the top, lerp toward the tip point to close the shape
      if (t < 0.15) {
        const blend = t / 0.15;
        const s = blend * blend;
        bx = bx * s;
        by = THREE.MathUtils.lerp(tipY, by, s);
        bz = bz * s;
      }

      pos.setXYZ(i, bx, by, bz);
    }

    geometry.computeVertexNormals();
    geometry.computeBoundingBox();

    const material = new THREE.ShaderMaterial({
      name: 'Seed',
      vertexShader: seedVertexShader,
      fragmentShader: seedFragmentShader,
      uniforms: this.uniforms,
      side: THREE.FrontSide,
      depthWrite: true,
      depthTest: true,
    });

    this.mesh = new THREE.Mesh(geometry, material);
    this.group.add(this.mesh);
  }

  _buildStem() {
    const stemMat = new THREE.MeshStandardMaterial({
      color: 0x3D2B1A,
      roughness: 0.92,
      metalness: 0.0,
    });

    // tipY = 0.55 * 1.25 = 0.6875
    const tipY = 0.6875;

    // Connection bulge — sits right at the tip, covers the seam
    const baseMat = new THREE.MeshStandardMaterial({
      color: 0x4A3520,
      roughness: 0.88,
      metalness: 0.0,
    });
    const baseGeo = new THREE.SphereGeometry(0.045, 12, 10);
    const base = new THREE.Mesh(baseGeo, baseMat);
    base.position.y = tipY;
    base.scale.set(1, 0.5, 1);
    this.group.add(base);

    // Main stem — bottom edge flush with the bulge
    const stemGeo = new THREE.CylinderGeometry(0.014, 0.026, 0.1, 10);
    const stem = new THREE.Mesh(stemGeo, stemMat);
    stem.position.y = tipY + 0.05;
    stem.rotation.z = 0.1;
    this.group.add(stem);
  }

  _buildText() {
    const loader = new FontLoader();
    loader.load(
      'https://threejs.org/examples/fonts/optimer_regular.typeface.json',
      (font) => {
        const textGeo = new TextGeometry('idea', {
          font,
          size: 0.1,
          depth: 0.008,
          curveSegments: 12,
          bevelEnabled: true,
          bevelThickness: 0.002,
          bevelSize: 0.003,
          bevelSegments: 3,
        });

        textGeo.computeBoundingBox();
        const center = new THREE.Vector3();
        textGeo.boundingBox.getCenter(center);
        textGeo.translate(-center.x, -center.y, -center.z);

        const textMat = new THREE.MeshStandardMaterial({
          color: 0xC8E6C9,
          emissive: 0x5DB075,
          emissiveIntensity: 0.6,
          roughness: 0.2,
          metalness: 0.3,
        });

        this.textMesh = new THREE.Mesh(textGeo, textMat);
        this.textMesh.position.z = -0.54;
        this.textMesh.position.y = -0.05;
        this.textMesh.rotation.y = Math.PI;
        this.group.add(this.textMesh);
      }
    );
  }

  update(time) {
    this.uniforms.uTime.value = time;

    if (this.textMesh) {
      this.textMesh.material.emissiveIntensity = 0.4 + Math.sin(time * 2) * 0.2;
    }
  }

  dispose() {
    this.group.traverse((child) => {
      if (child.geometry) child.geometry.dispose();
      if (child.material) {
        if (Array.isArray(child.material)) {
          child.material.forEach((m) => m.dispose());
        } else {
          child.material.dispose();
        }
      }
    });
  }
}
