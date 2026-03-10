attribute float aSize;
attribute float aPhase;

varying float vAlpha;

uniform float uTime;
uniform float uPixelRatio;

void main() {
  vec3 pos = position;

  float t = uTime * 0.3 + aPhase;
  pos.x += sin(t * 1.2 + aPhase * 6.28) * 0.15;
  pos.y += cos(t * 0.8 + aPhase * 3.14) * 0.1 + sin(uTime * 0.5) * 0.05;
  pos.z += cos(t * 1.0 + aPhase * 4.71) * 0.15;

  // Hide particles that drift too close to the seed center
  float dist = length(pos);
  float seedMask = smoothstep(0.8, 1.3, dist);

  vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);

  float size = aSize * uPixelRatio * (200.0 / -mvPosition.z);
  gl_PointSize = clamp(size, 1.0, 64.0) * seedMask;

  float distXZ = length(pos.xz);
  vAlpha = smoothstep(3.0, 0.8, distXZ) * (0.4 + 0.6 * sin(uTime + aPhase * 6.28) * 0.5 + 0.5) * seedMask;

  gl_Position = projectionMatrix * mvPosition;
}
