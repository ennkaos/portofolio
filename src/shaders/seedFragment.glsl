varying vec2 vUv;
varying vec3 vNormal;
varying vec3 vPosition;
varying vec3 vLocalPos;
varying float vYNorm;

uniform float uTime;
uniform float uPulse;
uniform vec3 uColorDark;
uniform vec3 uColorMid;
uniform vec3 uColorLight;
uniform vec3 uCapColor;
uniform vec3 uGlowColor;

// --- Procedural noise ---
vec3 mod289(vec3 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
vec4 mod289(vec4 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
vec4 permute(vec4 x) { return mod289(((x * 34.0) + 10.0) * x); }
vec4 taylorInvSqrt(vec4 r) { return 1.79284291400159 - 0.85373472095314 * r; }

float snoise(vec3 v) {
  const vec2 C = vec2(1.0 / 6.0, 1.0 / 3.0);
  const vec4 D = vec4(0.0, 0.5, 1.0, 2.0);

  vec3 i = floor(v + dot(v, C.yyy));
  vec3 x0 = v - i + dot(i, C.xxx);

  vec3 g = step(x0.yzx, x0.xyz);
  vec3 l = 1.0 - g;
  vec3 i1 = min(g.xyz, l.zxy);
  vec3 i2 = max(g.xyz, l.zxy);

  vec3 x1 = x0 - i1 + C.xxx;
  vec3 x2 = x0 - i2 + C.yyy;
  vec3 x3 = x0 - D.yyy;

  i = mod289(i);
  vec4 p = permute(permute(permute(
    i.z + vec4(0.0, i1.z, i2.z, 1.0))
    + i.y + vec4(0.0, i1.y, i2.y, 1.0))
    + i.x + vec4(0.0, i1.x, i2.x, 1.0));

  float n_ = 0.142857142857;
  vec3 ns = n_ * D.wyz - D.xzx;

  vec4 j = p - 49.0 * floor(p * ns.z * ns.z);

  vec4 x_ = floor(j * ns.z);
  vec4 y_ = floor(j - 7.0 * x_);

  vec4 x = x_ * ns.x + ns.yyyy;
  vec4 y = y_ * ns.x + ns.yyyy;
  vec4 h = 1.0 - abs(x) - abs(y);

  vec4 b0 = vec4(x.xy, y.xy);
  vec4 b1 = vec4(x.zw, y.zw);

  vec4 s0 = floor(b0) * 2.0 + 1.0;
  vec4 s1 = floor(b1) * 2.0 + 1.0;
  vec4 sh = -step(h, vec4(0.0));

  vec4 a0 = b0.xzyw + s0.xzyw * sh.xxyy;
  vec4 a1 = b1.xzyw + s1.xzyw * sh.zzww;

  vec3 p0 = vec3(a0.xy, h.x);
  vec3 p1 = vec3(a0.zw, h.y);
  vec3 p2 = vec3(a1.xy, h.z);
  vec3 p3 = vec3(a1.zw, h.w);

  vec4 norm = taylorInvSqrt(vec4(dot(p0, p0), dot(p1, p1), dot(p2, p2), dot(p3, p3)));
  p0 *= norm.x; p1 *= norm.y; p2 *= norm.z; p3 *= norm.w;

  vec4 m = max(0.5 - vec4(dot(x0, x0), dot(x1, x1), dot(x2, x2), dot(x3, x3)), 0.0);
  m = m * m;
  return 105.0 * dot(m * m, vec4(dot(p0, x0), dot(p1, x1), dot(p2, x2), dot(p3, x3)));
}

float fbm(vec3 p) {
  float v = 0.0;
  float a = 0.5;
  vec3 shift = vec3(100.0);
  for (int i = 0; i < 4; i++) {
    v += a * snoise(p);
    p = p * 2.0 + shift;
    a *= 0.5;
  }
  return v;
}

void main() {
  vec3 N = normalize(vNormal);
  vec3 V = normalize(cameraPosition - vPosition);

  // --- Three-light setup ---
  vec3 L1 = normalize(vec3(0.5, 0.8, 0.6));
  vec3 L2 = normalize(vec3(-0.4, 0.3, -0.5));
  vec3 L3 = normalize(vec3(0.0, -0.3, 0.8));

  float diff1 = max(dot(N, L1), 0.0);
  float diff2 = max(dot(N, L2), 0.0) * 0.25;
  float diff3 = max(dot(N, L3), 0.0) * 0.15;
  float diffuse = diff1 + diff2 + diff3;

  // --- Specular: clearcoat-like glossy shell ---
  vec3 H1 = normalize(L1 + V);
  vec3 H2 = normalize(L2 + V);
  vec3 H3 = normalize(L3 + V);
  float spec1 = pow(max(dot(N, H1), 0.0), 120.0);
  float spec2 = pow(max(dot(N, H2), 0.0), 80.0) * 0.4;
  float spec3 = pow(max(dot(N, H3), 0.0), 60.0) * 0.2;
  float specular = spec1 + spec2 + spec3;

  // Broader secondary specular lobe
  float specBroad = pow(max(dot(N, H1), 0.0), 15.0) * 0.08;

  // Fresnel
  float fresnel = pow(1.0 - max(dot(N, V), 0.0), 4.0);

  // --- Procedural color variation ---
  vec3 noiseCoord = vLocalPos * 6.0;
  float n1 = fbm(noiseCoord);
  float n2 = fbm(noiseCoord * 2.5 + vec3(50.0));
  float n3 = snoise(noiseCoord * 12.0);

  // Vertical gradient: dark tip -> mid body -> slightly lighter belly
  float yBlend = smoothstep(0.0, 0.5, vYNorm);
  float yBelly = smoothstep(0.3, 0.6, vYNorm) * smoothstep(0.9, 0.6, vYNorm);
  vec3 baseColor = mix(uColorDark, uColorMid, yBlend);
  baseColor = mix(baseColor, uColorLight, yBelly * 0.5);

  // Organic surface variation — patches of darker/lighter brown
  baseColor *= 0.9 + n1 * 0.2;
  baseColor += n2 * 0.03;

  // Longitudinal striations from tip to base
  float phi = atan(vLocalPos.z, vLocalPos.x);
  float striations = sin(phi * 40.0 + vYNorm * 4.0) * 0.5 + 0.5;
  striations = pow(striations, 4.0) * 0.04;
  baseColor -= striations;

  // Fine micro-texture
  float microTex = n3 * 0.015;
  baseColor += microTex;

  // Darker near edges (curvature darkening)
  float curveDark = pow(fresnel, 0.5) * 0.1;
  baseColor *= 1.0 - curveDark;

  // Cap area at the top — lighter, rougher, fuzzy texture
  float capMask = smoothstep(0.65, 0.85, vYNorm);
  vec3 capTex = uCapColor * (0.85 + fbm(vLocalPos * 18.0) * 0.2);
  baseColor = mix(baseColor, capTex, capMask * 0.85);

  // --- Final lighting ---
  float ambient = 0.4;
  vec3 lit = baseColor * (ambient + diffuse * 0.7);

  // Specular highlights — reduced on the matte cap area
  float specMask = 1.0 - capMask * 0.8;
  vec3 specColor = vec3(1.0, 0.97, 0.92);
  lit += specColor * specular * 0.65 * specMask;
  lit += specColor * specBroad * 1.2 * specMask;

  // Fresnel rim — warm highlight at grazing angles
  lit += baseColor * fresnel * 0.15;
  lit += specColor * fresnel * 0.06;

  // Green life energy glow
  float pulse = (sin(uTime * 2.0) * 0.5 + 0.5) * uPulse;
  lit += uGlowColor * fresnel * 0.06 * pulse;

  gl_FragColor = vec4(lit, 1.0);
}
