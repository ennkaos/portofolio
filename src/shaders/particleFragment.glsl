varying float vAlpha;

uniform vec3 uColor;

void main() {
  // Soft circular particle
  float d = length(gl_PointCoord - vec2(0.5));
  if (d > 0.5) discard;

  float alpha = smoothstep(0.5, 0.1, d) * vAlpha;

  gl_FragColor = vec4(uColor, alpha);
}
