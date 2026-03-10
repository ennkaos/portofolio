varying float vAlpha;
varying float vPhase;

uniform vec3 uColor1;
uniform vec3 uColor2;
uniform vec3 uColor3;

void main() {
  vec2 uv = gl_PointCoord - vec2(0.5);

  float angle = vPhase * 6.2832;
  float c = cos(angle);
  float s = sin(angle);
  vec2 ruv = vec2(uv.x * c - uv.y * s, uv.x * s + uv.y * c);

  float t = ruv.y + 0.5;
  float lobe = 0.6 + 0.4 * sin(t * 3.14159);
  float lobes4 = 0.88 + 0.12 * sin(t * 12.56);
  float halfW = 0.21 * lobe * lobes4 * (1.0 - 0.5 * abs(t - 0.5) * 2.0);
  halfW = max(halfW, 0.035);
  float ellipse = (ruv.x / halfW) * (ruv.x / halfW) + (ruv.y / 0.48) * (ruv.y / 0.48);
  float leaf = 1.0 - smoothstep(0.88, 1.04, ellipse);

  float vein = smoothstep(0.05, 0.012, abs(ruv.x)) * (0.5 + 0.5 * ruv.y);
  vec3 col = mix(uColor1, uColor2, vPhase * 0.4 + 0.5);
  col = mix(col, uColor3, vPhase * 0.15);
  col = mix(col, col * 0.8, vein * 0.5);
  col = mix(col, col * 1.06, smoothstep(-0.2, 0.3, ruv.y));

  float alpha = leaf * vAlpha * 0.92;

  gl_FragColor = vec4(col, alpha);
}
