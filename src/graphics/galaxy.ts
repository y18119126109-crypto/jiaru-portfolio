import * as THREE from 'three'
import { createDreamPlanet } from './dreamPlanet'

const vertexShader = `
attribute float aSize;
attribute float aPhase;
attribute vec3 aColor;
uniform float uTime;
uniform float uPixelRatio;
varying vec3 vColor;
varying float vAlpha;
void main() {
  vec3 p = position;
  float r = length(p.xz);
  float angle = uTime * (0.025 + 0.016 / (r + 0.4));
  p.xz = mat2(cos(angle), -sin(angle), sin(angle), cos(angle)) * p.xz;
  p.y += sin(uTime * 0.35 + aPhase) * 0.025;
  vec4 mv = modelViewMatrix * vec4(p, 1.0);
  gl_Position = projectionMatrix * mv;
  gl_PointSize = clamp(aSize * uPixelRatio * 9.0 / -mv.z, 1.0, 5.0);
  vColor = aColor;
  vAlpha = 0.53 + 0.22 * sin(aPhase + uTime * 0.5);
}`

const fragmentShader = `
varying vec3 vColor;
varying float vAlpha;
void main() {
  vec2 p = abs(gl_PointCoord - 0.5);
  float edge = 1.0 - smoothstep(0.30, 0.5, max(p.x, p.y * 1.22));
  gl_FragColor = vec4(vColor, edge * vAlpha);
  #include <colorspace_fragment>
}`

export function createGalaxy(compact: boolean) {
  const group = new THREE.Group()
  const resources: (THREE.BufferGeometry | THREE.Material)[] = []
  let seed = 71207
  const random = () => { seed = (seed * 16807) % 2147483647; return (seed - 1) / 2147483646 }
  const count = compact ? 5200 : 8800
  const positions = new Float32Array(count * 3)
  const colors = new Float32Array(count * 3)
  const sizes = new Float32Array(count)
  const phases = new Float32Array(count)
  const palette = ['#bde8da', '#d1c4ee', '#f4c7b7', '#e8eee1'].map(c => new THREE.Color(c))
  for (let i = 0; i < count; i++) {
    const field = i > count * 0.83
    const r = field ? 2 + random() * 5 : Math.pow(random(), 0.72) * 3.6 + 0.09
    const arm = i % 3 / 3 * Math.PI * 2
    const angle = field ? random() * Math.PI * 2 : arm + r * 1.52 + (random() - 0.5) * (0.65 + 1.1 / (r + 0.5))
    const scatter = (random() - 0.5) * 0.3
    positions.set([Math.cos(angle) * r + scatter, (random() - 0.5) * (field ? 4 : 0.16 + 0.12 * r), Math.sin(angle) * r + scatter], i * 3)
    const color = palette[Math.floor(random() * 3)].clone().lerp(palette[3], Math.max(0, 1 - r / 1.5) * 0.7)
    colors.set([color.r, color.g, color.b], i * 3)
    sizes[i] = field ? 0.5 + random() * 1.4 : 0.5 + Math.pow(random(), 3) * 1.7
    phases[i] = random() * Math.PI * 2
  }
  const geometry = new THREE.BufferGeometry()
  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3))
  geometry.setAttribute('aColor', new THREE.BufferAttribute(colors, 3))
  geometry.setAttribute('aSize', new THREE.BufferAttribute(sizes, 1))
  geometry.setAttribute('aPhase', new THREE.BufferAttribute(phases, 1))
  const uniforms = { uTime: { value: 0 }, uPixelRatio: { value: 1 } }
  const material = new THREE.ShaderMaterial({ uniforms, vertexShader, fragmentShader, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending })
  const stars = new THREE.Points(geometry, material)
  group.add(stars)
  resources.push(geometry, material)

  // A soft, procedural nebula beneath the individual stars; no image textures.
  const mistGeometry = new THREE.PlaneGeometry(9, 9)
  const mistMaterial = new THREE.ShaderMaterial({
    uniforms,
    vertexShader: `varying vec2 vUv; void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);}`,
    fragmentShader: `
      varying vec2 vUv; uniform float uTime;
      float hash(vec2 p) { return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453); }
      float noise(vec2 p) {
        vec2 i=floor(p),f=fract(p); f=f*f*(3.0-2.0*f);
        return mix(mix(hash(i),hash(i+vec2(1,0)),f.x),mix(hash(i+vec2(0,1)),hash(i+vec2(1,1)),f.x),f.y);
      }
      float fbm(vec2 p) {
        float v=0.0, w=0.5;
        for(int i=0;i<5;i++){ v+=noise(p)*w; p=mat2(1.6,-1.2,1.2,1.6)*p+7.3; w*=0.5; }
        return v;
      }
      void main() {
        vec2 p=(vUv-0.5)*8.0;
        float r=length(p); float a=atan(p.y,p.x);
        float cloud=fbm(p*2.2+vec2(uTime*0.009,0.0));
        float arm=pow(0.5+0.5*cos(a*3.0-r*4.56+cloud*3.1+uTime*0.08),3.0);
        float dust=smoothstep(0.27,0.75,cloud);
        float haze=exp(-r*r*0.20)*(arm*0.2+0.11)*dust+exp(-r*r*0.4)*0.018;
        float core=exp(-r*r*5.5)*0.85;
        vec3 col=mix(vec3(0.51,0.80,0.74),vec3(0.80,0.62,0.78),sin(a+r)*0.5+0.5);
        col=mix(col,vec3(1.0,0.90,0.77),core);
        gl_FragColor=vec4(col,haze+core);
        #include <colorspace_fragment>
      }`,
    transparent: true, depthWrite: false, side: THREE.DoubleSide, blending: THREE.AdditiveBlending,
  })
  const mist = new THREE.Mesh(mistGeometry, mistMaterial)
  mist.rotation.x = -Math.PI / 2
  mist.position.y = -0.12
  group.add(mist)
  resources.push(mistGeometry, mistMaterial)

  const planet = createDreamPlanet(compact)
  group.add(planet.group)
  group.rotation.z = -0.15
  return {
    group, uniforms, count,
    fitToMobile: planet.fitToMobile,
    update(time: number) {
      uniforms.uTime.value = time
      planet.update(time)
    },
    dispose() { resources.forEach(resource => resource.dispose()); planet.dispose() },
  }
}
