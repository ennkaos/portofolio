import * as THREE from 'three';

const FLOWER_COUNT = 280;
const COLORS = [0xFFFACD, 0xFFE4E1, 0xFFF8DC, 0xF0E68C, 0xE6E6FA, 0xFFB6C1, 0x98FB98, 0xDDA0DD, 0xF5DEB3];

export class Flowers {
  constructor(scene) {
    this.scene = scene;
    this.group = new THREE.Group();
    this._build();
    scene.add(this.group);
  }

  _build() {
    const hash = (a, b) => (Math.abs(Math.sin(a * 12.9898 + b * 78.233) * 43758.5453) % 1);
    const getHillR = (angle) => {
      const n1 = Math.sin(angle * 2.3) * 0.12 + Math.sin(angle * 5.1 + 1.2) * 0.08;
      const n2 = Math.sin(angle * 8.7 - 0.5) * 0.05 + Math.sin(angle * 12.3 + 2.1) * 0.03;
      return 28 * (1 + n1 + n2);
    };

    const geo = new THREE.CircleGeometry(0.035, 6);
    const mats = COLORS.map((c) => new THREE.MeshBasicMaterial({
      color: c,
      transparent: true,
      opacity: 0,
      side: THREE.DoubleSide,
    }));

    for (let i = 0; i < FLOWER_COUNT; i++) {
      const angle = hash(i * 7.1, 0) * Math.PI * 2;
      const r = 0.6 + hash(i * 3.2, 1) * getHillR(angle) * 0.85;
      const x = Math.cos(angle) * r + (hash(i * 5.3, 2) - 0.5) * 0.4;
      const z = Math.sin(angle) * r + (hash(i * 2.7, 3) - 0.5) * 0.4;
      if (r < 0.5) continue;

      const mesh = new THREE.Mesh(geo, mats[Math.floor(hash(i * 11, 4) * COLORS.length)]);
      mesh.rotation.x = -Math.PI / 2;
      mesh.position.set(x, -0.48, z);
      mesh.scale.setScalar(0.7 + hash(i * 13, 5) * 1.4);
      this.group.add(mesh);
    }

    for (let i = 0; i < 90; i++) {
      const angle = hash(i * 19.3, 10) * Math.PI * 2;
      const r = 22 + hash(i * 7.7, 11) * 18;
      const x = Math.cos(angle) * r + (hash(i * 4.1, 12) - 0.5) * 1.2;
      const z = Math.sin(angle) * r + (hash(i * 8.9, 13) - 0.5) * 1.2;
      const mat = mats[Math.floor(hash(i * 17, 14) * COLORS.length)];
      const mesh = new THREE.Mesh(geo, mat);
      mesh.rotation.x = -Math.PI / 2;
      mesh.position.set(x, -0.48, z);
      mesh.scale.setScalar(0.4 + hash(i * 23, 15) * 0.5);
      this.group.add(mesh);
    }
    this.flowerMeshes = this.group.children.filter((c) => c.isMesh);
  }

  setSunProgress(t) {
    const opacity = THREE.MathUtils.smoothstep(t, 0.25, 0.6) * 0.92;
    this.flowerMeshes.forEach((m) => { m.material.opacity = opacity; });
  }
}
