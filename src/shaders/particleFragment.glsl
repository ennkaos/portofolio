varying float vAlpha;
varying float vColorMix;
varying float vType;
varying vec2 vSeed;

uniform vec3 uColorDark;
uniform vec3 uColorMid;
uniform vec3 uColorLight;
uniform vec3 uClay;
uniform vec3 uPebble;
uniform float uOpacity;

float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
float noise(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  f = f * f * (3.0 - 2.0 * f);
  return mix(mix(hash(i), hash(i + vec2(1,0)), f.x), mix(hash(i + vec2(0,1)), hash(i + vec2(1,1)), f.x), f.y);
}

void main() {
  vec2 uv = gl_PointCoord - vec2(0.5);
  float d = length(uv);
  float angle = atan(uv.y, uv.x);
  float lobes = 4.0 + floor(vType * 3.0);
  float r = 0.42 + 0.12 * sin(angle * lobes) + 0.04 * noise(uv * 6.0 + vSeed);
  if (d > r) discard;

  vec3 col = mix(uColorDark, mix(uColorMid, uColorLight, vColorMix), vColorMix * 0.5 + 0.5);
  if (vType > 0.88) col = mix(col, uPebble, 0.7);
  else if (vType > 0.72) col = mix(col, uClay, 0.5);
  col += (noise(uv * 14.0 + vSeed) - 0.5) * 0.06;

  float alpha = smoothstep(r, r * 0.35, d) * vAlpha * uOpacity;

  gl_FragColor = vec4(col, alpha);
}
