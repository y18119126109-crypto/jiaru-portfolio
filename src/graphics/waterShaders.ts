export const waterVertexShader = /* glsl */ `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = vec4(position.xy, 0.0, 1.0);
  }
`

// A shallow, analytical water surface. Its normals refract only the atmosphere:
// every heading and paragraph stays in the accessible DOM above this canvas.
export const waterFragmentShader = /* glsl */ `
  precision highp float;
  varying vec2 vUv;
  uniform float uTime;
  uniform vec2 uResolution;
  uniform vec4 uRipples[8];

  float surface(vec2 p) {
    float t = uTime * 0.16;
    p += vec2(sin(p.y * 3.1 + t), cos(p.x * 2.8 - t)) * 0.14;
    float wave = sin(p.x * 10.0 + p.y * 6.0 + t * 1.1) * 0.45;
    wave += sin(p.x * -5.0 + p.y * 12.0 - t * 0.8) * 0.3;
    wave += sin(p.x * 19.0 - p.y * 11.0 + t * 0.6) * 0.13;
    return wave;
  }

  void main() {
    float aspect = uResolution.x / uResolution.y;
    vec2 p = vUv * vec2(aspect, 1.0);
    float h = surface(p);
    vec2 normal = vec2(surface(p + vec2(0.002, 0.0)) - h,
                       surface(p + vec2(0.0, 0.002)) - h) / 0.002;
    normal *= 0.0025;
    float rippleLight = 0.0;
    for (int i = 0; i < 8; i++) {
      float age = uTime - uRipples[i].z;
      if (age >= 0.0 && age < 3.0) {
        vec2 delta = p - uRipples[i].xy * vec2(aspect, 1.0);
        float d = length(delta);
        float radius = age * 0.078;
        float envelope = exp(-pow((d - radius) * 35.0, 2.0)) * exp(-age * 1.5);
        float wave = cos(d * 125.0 - age * 9.0);
        float strength = envelope * uRipples[i].w;
        normal += normalize(delta + 0.0001) * wave * strength * 0.032;
        rippleLight += wave * strength * 0.035;
      }
    }

    vec2 refracted = vUv + normal;
    vec3 color = vec3(0.969, 0.973, 0.951);
    float mint = exp(-length((refracted - vec2(0.9, 0.62)) * vec2(1.5, 1.2)) * 2.5);
    float peach = exp(-length((refracted - vec2(0.73, 0.92)) * vec2(2.0, 1.3)) * 3.0);
    float lowerMint = exp(-length((refracted - vec2(0.03, 0.14)) * vec2(2.0, 1.0)) * 3.4);
    color = mix(color, vec3(0.74, 0.86, 0.80), mint * 0.46 + lowerMint * 0.32);
    color = mix(color, vec3(0.95, 0.81, 0.75), peach * 0.34);

    // Slowly migrating caustic seams, strongest in the open margins.
    float fold = sin(h * 3.6 + p.x * 2.5 + p.y * 2.0);
    float caustic = pow(1.0 - abs(fold), 12.0);
    float light = dot(normal, normalize(vec2(-0.5, 1.0)));
    color += caustic * 0.023 + light * 0.32 + rippleLight;
    color -= pow(abs(fold), 10.0) * 0.009;
    gl_FragColor = vec4(color, 1.0);
  }
`
