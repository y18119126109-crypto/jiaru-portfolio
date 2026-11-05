import * as THREE from 'three'

// Shared optical density: the same ring gaps are visible and cast shadows.
const ringDensity = `
float radialNoise(float r) {
  float i=floor(r), f=fract(r); f=f*f*(3.0-2.0*f);
  return mix(fract(sin(i*127.1)*43758.5453),fract(sin((i+1.0)*127.1)*43758.5453),f);
}
float ringDensity(float r) {
  float edge = smoothstep(0.86, 0.91, r) * (1.0 - smoothstep(1.31, 1.39, r));
  float grain = 0.63 + 0.14*radialNoise(r*142.0) + 0.09*radialNoise(r*830.0) - 0.12*radialNoise(r*44.0);
  float division = 1.0 - 0.91 * (smoothstep(1.125, 1.137, r) - smoothstep(1.158, 1.17, r));
  division *= 1.0 - 0.45*(smoothstep(1.283,1.287,r)-smoothstep(1.293,1.297,r));
  float inner = mix(0.32, 1.0, smoothstep(0.92, 1.03, r));
  return clamp(grain * division * inner * edge, 0.0, 1.0);
}`

const noise = `
float hash(vec3 p) {
  p = fract(p * 0.3183099 + vec3(0.11, 0.37, 0.73));
  p *= 17.0;
  return fract(p.x*p.y*p.z*(p.x+p.y+p.z));
}
float noise3(vec3 p) {
  vec3 i = floor(p), f = fract(p); f = f*f*(3.0-2.0*f);
  return mix(
    mix(mix(hash(i), hash(i+vec3(1,0,0)), f.x), mix(hash(i+vec3(0,1,0)), hash(i+vec3(1,1,0)), f.x), f.y),
    mix(mix(hash(i+vec3(0,0,1)), hash(i+vec3(1,0,1)), f.x), mix(hash(i+vec3(0,1,1)), hash(i+vec3(1,1,1)), f.x), f.y), f.z);
}
float fbm(vec3 p) {
  float v = 0.0, a = 0.5;
  for (int i=0; i<5; i++) { v += a*noise3(p); p=p*2.07+vec3(13.1,7.3,5.8); a*=0.5; }
  return v;
}`

const vertexShader = `
varying vec3 vP;
void main() {
  vP = position;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}`

export function createDreamPlanet(compact: boolean) {
  const group = new THREE.Group()
  const uniforms = {
    uTime: { value: 0 },
    uLight: { value: new THREE.Vector3(-0.65, 0.65, 0.55).normalize() },
    uEye: { value: new THREE.Vector3(0, 5, 7) },
  }
  const sphereGeometry = new THREE.SphereGeometry(0.68, compact ? 64 : 96, compact ? 40 : 64)
  const sphereMaterial = new THREE.ShaderMaterial({
    uniforms, vertexShader,
    fragmentShader: `
      varying vec3 vP;
      uniform vec3 uLight, uEye;
      uniform float uTime;
      ${noise}
      ${ringDensity}
      void main() {
        vec3 n = normalize(vP), eye = normalize(uEye-vP);
        float rotation = uTime*0.018;
        vec3 p = n;
        p.xz = mat2(cos(rotation),-sin(rotation),sin(rotation),cos(rotation))*p.xz;
        float turbulence = fbm(p*vec3(4.0,8.0,4.0));
        float latitude = p.y + (turbulence-0.5)*0.115;
        float broad = sin(latitude*26.0 + fbm(p*3.0)*3.4)*0.5+0.5;
        float fine = fbm(vec3(p.x*13.0,latitude*69.0,p.z*13.0));
        float streak = sin(latitude*108.0+fine*5.0)*0.5+0.5;
        vec3 cream = vec3(0.74,0.64,0.51);
        vec3 rose = vec3(0.49,0.35,0.29);
        vec3 cloud = mix(cream,rose,smoothstep(0.33,0.83,broad)*0.60);
        cloud = mix(cloud,vec3(0.35,0.47,0.47),smoothstep(0.55,0.85,fine)*0.42);
        cloud *= 0.85+fine*0.25+streak*0.09;
        float diffuse = dot(n,uLight);
        float lit = smoothstep(-0.08,0.22,diffuse);
        float shadow = 0.0;
        float t = -vP.y/uLight.y;
        if (t>0.0) {
          float r = length((vP+uLight*t).xz);
          shadow = ringDensity(r)*0.76;
        }
        // Lambert surface, soft atmospheric terminator, dim reflected ring light.
        vec3 col = cloud * (vec3(0.018,0.031,0.043) + (0.10+0.92*max(diffuse,0.0))*lit*(1.0-shadow));
        float limb = pow(1.0-max(dot(n,eye),0.0),3.5);
        col += vec3(0.30,0.62,0.67)*limb*lit*0.16;
        col += vec3(0.33,0.23,0.36)*pow(1.0-abs(diffuse),9.0)*0.033;
        gl_FragColor = vec4(col,1.0);
        #include <colorspace_fragment>
      }`,
  })
  const sphere = new THREE.Mesh(sphereGeometry, sphereMaterial)
  const inverse = new THREE.Matrix4()
  const worldLight = new THREE.Vector3(-6, 2, 1.4).normalize()
  sphere.onBeforeRender = (_renderer, _scene, camera) => {
    inverse.copy(sphere.matrixWorld).invert()
    uniforms.uLight.value.copy(worldLight).transformDirection(inverse)
    camera.getWorldPosition(uniforms.uEye.value).applyMatrix4(inverse)
  }
  group.add(sphere)

  // Rotate geometry, not mesh: surface, ring and atmosphere share object space.
  const ringGeometry = new THREE.RingGeometry(0.86, 1.39, compact ? 192 : 256)
  ringGeometry.rotateX(-Math.PI / 2)
  const ringMaterial = new THREE.ShaderMaterial({
    uniforms, vertexShader, transparent: true, side: THREE.DoubleSide, depthWrite: false,
    fragmentShader: `
      varying vec3 vP; uniform vec3 uLight, uEye;
      ${ringDensity}
      void main() {
        float r = length(vP.xz);
        float density = ringDensity(r);
        float alongRay = dot(vP,uLight);
        float distanceToRay = length(vP-uLight*alongRay);
        float shadow = (1.0-smoothstep(0.65,0.72,distanceToRay))*step(alongRay,0.0);
        vec3 col = mix(vec3(0.42,0.46,0.45),vec3(0.81,0.65,0.53),smoothstep(0.9,1.32,r));
        col *= (0.77+0.11*radialNoise(r*57.0))*(1.0-shadow*0.94);
        float grazing = 1.0-abs(normalize(uEye-vP).y);
        gl_FragColor = vec4(col,clamp(density*(1.13+grazing*0.24),0.0,0.9));
        #include <colorspace_fragment>
      }`,
  })
  const ring = new THREE.Mesh(ringGeometry, ringMaterial)
  ring.renderOrder = 2
  group.add(ring)

  const atmosphereGeometry = new THREE.SphereGeometry(0.701, compact ? 48 : 80, 48)
  const atmosphereMaterial = new THREE.ShaderMaterial({
    uniforms, vertexShader, transparent: true, depthWrite: false, side: THREE.BackSide,
    blending: THREE.AdditiveBlending,
    fragmentShader: `
      varying vec3 vP; uniform vec3 uLight, uEye;
      void main() {
        vec3 n=normalize(vP);
        float rim=pow(1.0-abs(dot(n,normalize(uEye-vP))),5.0);
        float day=smoothstep(-0.25,0.65,dot(n,uLight));
        gl_FragColor=vec4(vec3(0.39,0.64,0.72),rim*day*0.24);
        #include <colorspace_fragment>
      }`,
  })
  const atmosphere = new THREE.Mesh(atmosphereGeometry, atmosphereMaterial)
  atmosphere.renderOrder = 3
  group.add(atmosphere)
  group.position.set(compact ? 1.65 : 2.08, 1.43, 0.42)
  if (compact) group.scale.setScalar(0.9)
  group.rotation.set(0.18, 0, -0.32)
  return {
    group,
    fitToMobile(isMobile: boolean) {
      group.position.x = isMobile ? 1.65 : 2.08
      group.scale.setScalar(isMobile ? 0.9 : 1)
    },
    update(time: number) {
      uniforms.uTime.value = time
      group.position.y = 1.43 + Math.sin(time * 0.17) * 0.025
    },
    dispose() {
      for (const resource of [sphereGeometry, sphereMaterial, ringGeometry, ringMaterial, atmosphereGeometry, atmosphereMaterial]) resource.dispose()
    },
  }
}
