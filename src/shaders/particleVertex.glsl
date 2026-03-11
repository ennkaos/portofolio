attribute float aSize;
attribute float aPhase;
attribute float aColorMix;
attribute float aType;

varying float vAlpha;
varying float vColorMix;
varying float vType;
varying vec2 vSeed;

uniform float uTime;
uniform float uPixelRatio;

void main() {
  vec3 pos = position;

  float t = uTime * 0.12 + aPhase * 6.28;
  pos.x += sin(t) * 0.015;
  pos.y += cos(t * 0.8) * 0.008;
  pos.z += cos(t * 1.0) * 0.015;

  vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);

  float size = aSize * uPixelRatio * (180.0 / -mvPosition.z);
  gl_PointSize = clamp(size, 2.0, 48.0);

  float distXZ = length(pos.xz);
  vAlpha = (1.0 - smoothstep(0.3, 14.0, distXZ)) * (0.72 + 0.18 * sin(uTime * 0.35 + aPhase * 6.28) * 0.5 + 0.5);
  vColorMix = aColorMix;
  vType = aType;
  vSeed = vec2(aPhase * 31.7, aType * 47.3);

  gl_Position = projectionMatrix * mvPosition;
}
