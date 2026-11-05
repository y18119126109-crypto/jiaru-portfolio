// Particle positions are generated on the GPU from stable seeds. The geometry
// never needs per-frame CPU uploads; the complete sculpture is one draw call.
export const particleVertexShader = /* glsl */ `
  precision highp float;
  attribute vec4 aSeed;
  attribute float aKind;
  uniform float uTime;
  uniform float uPixelRatio;
  uniform vec2 uPointer;
  uniform float uPointerStrength;
  uniform vec3 uMint;
  uniform vec3 uDeep;
  uniform vec3 uPeach;
  uniform vec3 uLavender;
  varying vec3 vColor;
  varying float vAlpha;
  varying float vAspect;
  varying float vScan;

  #define PI 3.14159265359
  #define TAU 6.28318530718

  float bell(float value, float center, float spread) {
    return exp(-pow((value - center) / spread, 2.0));
  }

  // Two violin bouts, a pronounced waist, and rounded end caps.
  float violinWidth(float t) {
    float bouts = 0.29 + 0.49 * bell(t, 0.23, 0.20)
      + 0.34 * bell(t, 0.78, 0.18) - 0.06 * bell(t, 0.51, 0.09);
    return bouts * smoothstep(0.0, 0.075, t)
      * (1.0 - smoothstep(0.92, 1.025, t));
  }

  void main() {
    float time = uTime;
    float theta = aSeed.y * TAU;
    float phase = fract(aSeed.x + time * 0.043);
    float radius = mix(0.45, 1.0, pow(aSeed.z, 0.28));
    vec3 p = vec3(0.0);
    float opacity = 1.0;

    if (aKind < 0.5) {
      // Main body: a vertically advected, flattened volumetric shell.
      p.y = mix(-1.53, 1.04, phase);
      float twist = 0.10 * sin(p.y * 2.5 + time * 0.42);
      p.x = cos(theta + twist) * violinWidth(phase) * radius;
      p.z = sin(theta + twist) * 0.245 * radius;
      p.z *= 0.58 + 0.42 * sin(phase * PI);
      // Delicate f-hole negative spaces in the front of the body.
      float holeX = 0.255 + 0.045 * sin((p.y + 0.2) * 7.5);
      float hole = (1.0 - smoothstep(0.025, 0.055, abs(abs(p.x) - holeX)))
        * smoothstep(-0.67, -0.56, p.y)
        * (1.0 - smoothstep(0.19, 0.3, p.y));
      opacity *= 1.0 - hole * 0.88;
    } else if (aKind < 1.5) {
      // Fingerboard and neck.
      p.y = mix(0.74, 2.30, phase);
      p.x = (aSeed.y - 0.5) * mix(0.14, 0.105, phase);
      p.z = (aSeed.z - 0.5) * 0.12 + 0.045;
    } else if (aKind < 2.5) {
      // Four continuous streams read as strings.
      p.y = mix(-1.19, 2.34, phase);
      p.x = (floor(aSeed.y * 4.0) - 1.5) * 0.032;
      p.z = 0.265;
      opacity = 0.92;
    } else if (aKind < 3.5) {
      // The scroll is a tight spiral, rather than a generic round head.
      float angle = aSeed.x * PI * 4.5;
      float r = 0.035 + aSeed.x * 0.13;
      p.x = cos(angle) * r;
      p.y = 2.43 + sin(angle) * r;
      p.z = (aSeed.z - 0.5) * 0.15;
    } else if (aKind < 4.5) {
      // Tapered tailpiece.
      p.y = mix(-1.42, -0.64, phase);
      p.x = (aSeed.y - 0.5) * mix(0.07, 0.24, phase);
      p.z = 0.265 + aSeed.z * 0.025;
    } else if (aKind < 5.5) {
      // Four tuning pegs.
      float peg = floor(aSeed.x * 4.0);
      float side = mod(peg, 2.0) * 2.0 - 1.0;
      p.x = side * mix(0.045, 0.20, aSeed.y);
      p.y = 1.94 + peg * 0.11 + (aSeed.z - 0.5) * 0.055;
      p.z = 0.035;
    } else if (aKind < 6.5) {
      // Sparse surrounding hourglass flow: wider at the two ends.
      p.y = mix(-1.98, 2.93, phase);
      float spread = 0.45 + 0.60 * pow(abs(phase - 0.5) * 2.0, 1.3);
      p.x = cos(theta + time * 0.10 + p.y * 0.36) * spread * radius;
      p.z = sin(theta + time * 0.10 + p.y * 0.36) * spread * 0.50;
      opacity = 0.20 + 0.13 * aSeed.z;
    } else {
      // Bow: two fine parallel streams, slightly angled from the body.
      p.y = mix(-1.65, 2.03, phase);
      p.x = 1.02 - phase * 0.29 + floor(aSeed.y * 2.0) * 0.055;
      p.z = 0.19 + (aSeed.z - 0.5) * 0.035;
      opacity = 0.72;
    }

    float pulse = 1.0 + 0.025 * sin(time * 1.65) * exp(-p.y * p.y * 0.10);
    p.xz *= pulse;
    vec3 noise = vec3(
      sin(theta * 4.7 + time * 0.6 + p.y * 7.0),
      sin(theta * 3.1 + time * 0.4 + aSeed.z * 11.0),
      cos(theta * 2.7 - time * 0.5 + p.y * 5.0)
    );
    p += noise * (aKind < 0.5 ? 0.012 : 0.005);

    // A slow, bounded rotation preserves the recognisable silhouette.
    float yaw = 0.20 + sin(time * 0.14) * 0.34;
    p.xz = mat2(cos(yaw), -sin(yaw), sin(yaw), cos(yaw)) * p.xz;
    float lean = -0.19 + sin(time * 0.095) * 0.025;
    p.xy = mat2(cos(lean), -sin(lean), sin(lean), cos(lean)) * p.xy;

    vec2 delta = p.xy - uPointer;
    float proximity = exp(-dot(delta, delta) / 0.27);
    p.xy += delta / max(length(delta), 0.08) * proximity * uPointerStrength * 0.25;
    p.z += proximity * uPointerStrength * 0.08;

    // The height offset by azimuth is a rising helical scan front.
    float scanY = mod(time * 0.56 - theta * 0.125, 5.55) - 2.2;
    vScan = exp(-pow((p.y - scanY) / 0.19, 2.0));
    vec3 scanColor = mix(uPeach, uLavender, sin(time * 0.36) * 0.5 + 0.5);
    scanColor = mix(scanColor, uMint, 0.25 + 0.2 * sin(time * 0.18));
    vec3 baseColor = mix(uDeep, uMint, aSeed.z * 0.53 + 0.14);
    baseColor = mix(baseColor, uPeach, smoothstep(0.80, 1.0, aSeed.w) * 0.68);
    if (aKind > 1.5 && aKind < 2.5) baseColor = uDeep;
    if (aKind > 3.5 && aKind < 4.5) baseColor = uDeep;
    vColor = mix(baseColor, scanColor * 1.17, vScan * 0.87);
    float flicker = 0.82 + 0.18 * sin(time * (0.7 + aSeed.w) + aSeed.x * 40.0);
    vAlpha = opacity * flicker * mix(0.52, 0.92, aSeed.w);
    vAlpha = min(1.0, vAlpha + vScan * 0.22 * opacity);
    vAspect = mix(0.5, 1.0, aSeed.z);

    vec4 mvPosition = modelViewMatrix * vec4(p, 1.0);
    float size = mix(1.5, 3.65, pow(aSeed.w, 2.0));
    if (aKind > 1.5 && aKind < 2.5) size *= 0.9;
    if (aKind > 6.5) size *= 0.75;
    gl_PointSize = clamp(size * uPixelRatio * (6.2 / -mvPosition.z) * (1.0 + vScan * 0.72), 1.0, 12.0);
    gl_Position = projectionMatrix * mvPosition;
  }
`

export const particleFragmentShader = /* glsl */ `
  precision highp float;
  varying vec3 vColor;
  varying float vAlpha;
  varying float vAspect;
  varying float vScan;

  void main() {
    vec2 uv = gl_PointCoord - 0.5;
    // Explicit rectangle clipping: no round point sprites or radial falloff.
    if (abs(uv.y) > 0.5 * vAspect) discard;
    float edgeX = 1.0 - smoothstep(0.39, 0.50, abs(uv.x));
    float edgeY = 1.0 - smoothstep(0.5 * vAspect - 0.10, 0.5 * vAspect, abs(uv.y));
    float facet = 0.86 + step(uv.x + uv.y, 0.0) * 0.14;
    vec3 color = vColor * facet;
    gl_FragColor = vec4(color, vAlpha * edgeX * edgeY);
    #include <tonemapping_fragment>
    #include <colorspace_fragment>
  }
`
