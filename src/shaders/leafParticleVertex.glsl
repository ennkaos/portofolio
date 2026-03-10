attribute float aPhase;
attribute float aSize;
attribute float aFallSpeed;

varying float vAlpha;
varying float vPhase;

uniform float uTime;
uniform float uWindStr;
uniform float uPixelRatio;
uniform float uVisible;
uniform float uGroundY;

void main() {
  vec3 spawnPos = position;

  float fallProgress = fract(uTime * aFallSpeed + aPhase);
  float easedFall = fallProgress * fallProgress * (3.0 - 2.0 * fallProgress);

  float startY = spawnPos.y;
  float endY = uGroundY - 0.3;
  float posY = mix(startY, endY, easedFall);

  float swayT = fallProgress * 6.2832 * 4.0 + aPhase * 6.28;
  float swayAmp = sin(easedFall * 3.14159);
  float swayX = (sin(swayT) * 0.5 + sin(swayT * 2.3 + aPhase * 12.0) * 0.25) * swayAmp;
  float swayZ = (cos(swayT * 1.1 + 0.7) * 0.45 + cos(swayT * 1.9 + aPhase * 8.0) * 0.2) * swayAmp;

  float windDrift = max(0.0, easedFall - 0.3) * uWindStr * 0.6;
  swayX += sin(uTime * 0.8 + aPhase * 5.0) * windDrift;
  swayZ += cos(uTime * 0.6 + aPhase * 7.0) * windDrift * 0.8;

  float wobble = sin(fallProgress * 6.2832 * 6.0 + aPhase * 9.0) * 0.15;
  posY += wobble;

  vec3 pos = vec3(
    spawnPos.x + swayX,
    posY,
    spawnPos.z + swayZ
  );

  vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);

  float size = aSize * uPixelRatio * (320.0 / -mvPosition.z);
  gl_PointSize = clamp(size, 4.0, 120.0) * uVisible;

  vAlpha = uVisible;
  vPhase = aPhase + fallProgress * 6.28 + sin(swayT) * 0.4;

  gl_Position = projectionMatrix * mvPosition;
}
