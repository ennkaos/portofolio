varying vec2 vUv;
varying vec3 vNormal;
varying vec3 vPosition;
varying vec3 vLocalPos;
varying float vYNorm;

uniform float uTime;
uniform float uPulse;

void main() {
  vUv = uv;
  vNormal = normalize(normalMatrix * normal);
  vLocalPos = position;

  float breathe = sin(uTime * 1.5) * 0.005 * uPulse;
  vec3 pos = position + normal * breathe;

  vec4 worldPos = modelMatrix * vec4(pos, 1.0);
  vPosition = worldPos.xyz;

  vYNorm = (position.y + 0.7) / 1.5;

  gl_Position = projectionMatrix * viewMatrix * worldPos;
}
