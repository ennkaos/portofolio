varying vec2 vUv;
varying vec2 vWorldXZ;
varying float vRadius;

float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
float noise(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  f = f * f * (3.0 - 2.0 * f);
  return mix(mix(hash(i), hash(i + vec2(1,0)), f.x), mix(hash(i + vec2(0,1)), hash(i + vec2(1,1)), f.x), f.y);
}

void main() {
  vUv = uv;
  vWorldXZ = position.xy;
  vRadius = length(position.xy);

  float bump = noise(position.xy * 8.0) * 0.04 + noise(position.xy * 18.0) * 0.02;
  vec3 pos = position + vec3(0.0, 0.0, bump);

  vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
  gl_Position = projectionMatrix * mvPosition;
}
