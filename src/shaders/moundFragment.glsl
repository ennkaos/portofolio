varying vec2 vUv;
varying vec2 vWorldXZ;
varying float vRadius;

uniform float uTime;
uniform float uOpacity;

float hash(vec2 p) {
  return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
}

float noise(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  f = f * f * (3.0 - 2.0 * f);
  float a = hash(i);
  float b = hash(i + vec2(1.0, 0.0));
  float c = hash(i + vec2(0.0, 1.0));
  float d = hash(i + vec2(1.0, 1.0));
  return mix(mix(a, b, f.x), mix(c, d, f.x), f.y);
}

float fbm(vec2 p) {
  float v = 0.0;
  float a = 0.5;
  v += a * noise(p);
  p *= 2.0;
  a *= 0.5;
  v += a * noise(p);
  p *= 2.0;
  a *= 0.5;
  v += a * noise(p);
  p *= 2.0;
  a *= 0.25;
  v += a * noise(p);
  return v;
}

void main() {
  vec2 p = vWorldXZ * 12.0;
  float n = fbm(p);
  float n2 = fbm(p * 2.3 + 1.7);
  float n3 = noise(p * 8.0);

  vec3 soilDark = vec3(0.22, 0.14, 0.08);
  vec3 soilMid = vec3(0.32, 0.22, 0.12);
  vec3 soilLight = vec3(0.42, 0.28, 0.16);
  vec3 clay = vec3(0.38, 0.26, 0.18);
  vec3 organic = vec3(0.18, 0.22, 0.12);

  vec3 col = mix(soilDark, soilMid, n);
  col = mix(col, soilLight, n2 * 0.6);
  col = mix(col, clay, smoothstep(0.3, 0.6, n3) * 0.4);
  col = mix(col, organic, smoothstep(0.5, 0.7, n) * 0.15);

  float grit = noise(p * 24.0);
  col += (grit - 0.5) * 0.08;

  float edge = smoothstep(0.2, 0.5, vRadius) * (1.0 - smoothstep(25.0, 29.0, vRadius));
  float irregular = 0.92 + 0.08 * sin(vRadius * 4.0) * cos(atan(vWorldXZ.y, vWorldXZ.x) * 5.0);
  edge *= irregular;

  float alpha = edge * uOpacity * (0.88 + n * 0.12);
  if (alpha < 0.01) discard;

  gl_FragColor = vec4(col, alpha);
}
