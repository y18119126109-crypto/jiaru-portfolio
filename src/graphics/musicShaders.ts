export const musicVertexShader = /* glsl */ `
  precision highp float;
  attribute vec4 aSeed;
  uniform float uTime;
  uniform float uPixelRatio;
  uniform float uMood;
  uniform vec4 uAudio;
  uniform vec2 uPointer;
  uniform float uPointerStrength;
  varying vec3 vColor;
  varying float vAlpha;
  varying float vAspect;
  varying float vScan;
  #define TAU 6.28318530718

  void main() {
    float t = uTime;
    float angle = aSeed.x * TAU + t * 0.085;
    float cross = aSeed.y * TAU + angle * 1.5;
    float shell = mix(0.45, 1.0, pow(aSeed.z, 0.28));
    float width = 0.23 + 0.09 * sin(angle * 2.0 + t * 0.18);
    float bass = uAudio.x;
    float mid = uAudio.y;
    float high = uAudio.z;
    float level = uAudio.w;
    // A gently twisted toroidal ribbon, expanded by measured low frequencies.
    float radius = 1.42 + cos(cross) * width * shell;
    radius += 0.018 * sin(t * 0.8) + bass * 0.22;
    radius += sin(angle * 6.0 - t * 1.7) * mid * 0.13;
    radius += sin(angle * 13.0 + t * 3.0) * high * 0.06;
    vec3 p = vec3(cos(angle) * radius, sin(angle) * radius, sin(cross) * width * shell);
    p.z += sin(angle * 2.0 + t * 0.19) * (0.31 + mid * 0.24);
    p.z += sin(angle * 9.0 - t * 2.5) * mid * 0.12;
    // Sparse drifting grains surround the continuous ribbon.
    float ambient = step(0.91, aSeed.w);
    p.xy *= 1.0 + ambient * (aSeed.z * 0.3 + 0.04);
    p.z += ambient * sin(aSeed.z * 34.0 + t * 0.22) * 0.2;
    p += vec3(sin(aSeed.x * 77.0 + t), cos(aSeed.y * 53.0 - t), sin(aSeed.z * 91.0 + t))
      * (0.005 + high * 0.04);

    float tilt = 0.53 + sin(t * 0.10) * 0.14;
    p.yz = mat2(cos(tilt), -sin(tilt), sin(tilt), cos(tilt)) * p.yz;
    float lean = -0.34 + sin(t * 0.07) * 0.08;
    p.xy = mat2(cos(lean), -sin(lean), sin(lean), cos(lean)) * p.xy;
    vec2 delta = p.xy - uPointer;
    float proximity = exp(-dot(delta, delta) / 0.22) * uPointerStrength;
    p.xy += delta / max(length(delta), 0.07) * proximity * 0.16;
    p.z += proximity * 0.12;

    float scan = sin(angle * 2.0 + cross * 0.3 - t * 0.8);
    vScan = pow(max(0.0, scan), 20.0) * (0.3 + level * 0.7);
    vec3 mint = vec3(0.29, 0.51, 0.44);
    vec3 peach = vec3(0.70, 0.43, 0.34);
    vec3 lavender = vec3(0.53, 0.48, 0.64);
    vec3 base = mix(peach, mint, smoothstep(0.15, 0.85, aSeed.z));
    base = mix(base, lavender, (1.0 - uMood) * 0.2 + step(0.77, aSeed.y) * 0.22);
    base = mix(base, mint, uMood * 0.3);
    vColor = mix(base, mix(vec3(0.78, 0.58, 0.47), vec3(0.40, 0.69, 0.58), uMood), vScan * 0.8);
    // Palette literals are sRGB; the shared fragment shader expects linear RGB.
    vColor = pow(vColor, vec3(2.2));
    vAlpha = mix(0.4, 0.84, aSeed.y) * (0.92 + 0.08 * sin(t * 0.6 + aSeed.x * 39.0));
    vAlpha *= mix(1.0, 0.32, ambient);
    vAlpha = min(1.0, vAlpha + level * 0.12 + vScan * 0.15);
    vAspect = mix(0.48, 1.0, aSeed.z);
    vec4 mv = modelViewMatrix * vec4(p, 1.0);
    float size = mix(1.3, 3.45, pow(aSeed.y, 2.0));
    size *= (1.0 + vScan * 0.55 + high * 0.25) * mix(1.0, 0.75, ambient);
    gl_PointSize = clamp(size * uPixelRatio * (6.2 / -mv.z), 1.0, 10.0);
    gl_Position = projectionMatrix * mv;
  }
`
