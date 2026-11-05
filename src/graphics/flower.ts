import * as THREE from 'three'

export const flowerVertexShader = /* glsl */`
  attribute vec3 aClosed;
  uniform float uBloom;
  uniform float uTime;
  uniform float uSeed;
  varying vec2 vUv;
  varying vec3 vView;
  void main() {
    vUv = uv;
    vec3 p = mix(aClosed, position, smoothstep(0.0, 1.0, uBloom));
    float breeze = sin(uTime * 0.65 + uSeed + uv.y * 3.0);
    p.y += breeze * 0.024 * pow(uv.y, 2.0) * uBloom;
    p.x += sin(uTime * 0.5 + uSeed * 2.0) * 0.018 * uv.y * uBloom;
    vec4 view = modelViewMatrix * vec4(p, 1.0);
    vView = view.xyz;
    gl_Position = projectionMatrix * view;
  }
`

export const flowerFragmentShader = /* glsl */`
  uniform vec3 uPetal;
  uniform vec3 uHeart;
  uniform float uInner;
  uniform float uOpacity;
  varying vec2 vUv;
  varying vec3 vView;
  void main() {
    vec3 n = normalize(cross(dFdx(vView), dFdy(vView)));
    vec3 viewDir = normalize(-vView);
    float facing = abs(dot(n, viewDir));
    float light = abs(dot(n, normalize(vec3(-0.4, 0.65, 1.0))));
    float rim = pow(1.0 - facing, 2.4);
    float base = pow(1.0 - vUv.y, 1.7);
    float threadCoord = vUv.x * 52.0 + sin(vUv.y * 9.0) * 0.32;
    float thread = 1.0 - smoothstep(0.025, 0.075 + fwidth(threadCoord), abs(fract(threadCoord) - 0.5));
    float veinCoord = vUv.x * 13.0 + sin(vUv.y * 5.0 + vUv.x * 6.0) * 0.3;
    float vein = 1.0 - smoothstep(0.015, 0.065 + fwidth(veinCoord), abs(fract(veinCoord) - 0.5));
    float edge = pow(abs(vUv.x * 2.0 - 1.0), 20.0) + pow(vUv.y, 32.0);
    vec3 color = mix(uPetal, uHeart, clamp(base * 0.78 + uInner * 0.42, 0.0, 0.94));
    color *= 0.62 + light * 0.33;
    color = mix(color, vec3(1.0, 0.98, 0.95), 0.045 + rim * 0.16 + thread * 0.065 + vein * 0.05 + edge * 0.12);
    float alpha = (0.45 + light * 0.14 + rim * 0.18 + edge * 0.12 + vein * 0.04) * uOpacity;
    alpha *= smoothstep(0.0, 0.035, vUv.y);
    gl_FragColor = vec4(color, min(alpha, 0.82));
    #include <tonemapping_fragment>
    #include <colorspace_fragment>
  }
`

// A petal is a cupped, pleated ribbon, with distinct open and closed surfaces.
// Its actual geometry provides depth and a curved silhouette at every angle.
export function petalGeometry(layer: number, segments = 34) {
  const across = 22
  const positions: number[] = []
  const closed: number[] = []
  const uvs: number[] = []
  const indices: number[] = []
  const length = 2.03 - layer * 1.05
  const baseAngle = 0.74 - layer * 0.67
  const curl = 1.07 + layer * 0.2
  for (let y = 0; y <= segments; y++) {
    const t = y / segments
    const shape = Math.pow(Math.max(0, Math.sin(Math.PI * t)), 0.46)
    for (let x = 0; x <= across; x++) {
      const s = x / across * 2 - 1
      const width = (0.86 - layer * 0.44) * shape
      const pleat = (Math.sin(s * 23 + t * 7) * 0.017 + Math.sin(s * 41 - t * 5) * 0.006) * shape
      const radius = length * (Math.cos(baseAngle) - Math.cos(baseAngle + t * curl)) / curl
      const height = length * (Math.sin(baseAngle + t * curl) - Math.sin(baseAngle)) / curl
      const cupping = s * s * shape * (0.24 + 0.14 * t)
      positions.push(s * width, height + cupping + pleat + layer * 0.08, radius + 0.1 - s * s * shape * 0.1)
      closed.push(s * width * 0.72, t * length * 0.91 + cupping * 0.3, 0.09 + Math.sin(t * Math.PI * 0.97) * (0.57 - layer * 0.25) + pleat * 0.3)
      uvs.push(x / across, t)
      if (y < segments && x < across) {
        const a = y * (across + 1) + x
        indices.push(a, a + across + 1, a + 1, a + 1, a + across + 1, a + across + 2)
      }
    }
  }
  const geometry = new THREE.BufferGeometry()
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3))
  geometry.setAttribute('aClosed', new THREE.Float32BufferAttribute(closed, 3))
  geometry.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2))
  geometry.setIndex(indices)
  geometry.computeBoundingSphere()
  // Includes the upright bud for culling and transparent-object sorting.
  geometry.boundingSphere = new THREE.Sphere(new THREE.Vector3(0, 0.6, 0.7), 2.5)
  return geometry
}

export function createFlower(petal: string, heart: string, bloom: number) {
  const group = new THREE.Group()
  const head = new THREE.Group()
  head.rotation.set(0.38, 0, -0.2)
  head.position.y = 0.12
  group.add(head)
  const materials: THREE.ShaderMaterial[] = []
  const geometries: THREE.BufferGeometry[] = []
  const shared = {
    uBloom: { value: bloom },
    uTime: { value: 0 },
    uPetal: { value: new THREE.Color(petal) },
    uHeart: { value: new THREE.Color(heart) },
  }
  const makeMaterial = (inner: number, seed: number, opacity = 1) => {
    const material = new THREE.ShaderMaterial({
      vertexShader: flowerVertexShader,
      fragmentShader: flowerFragmentShader,
      uniforms: { ...shared, uInner: { value: inner }, uSeed: { value: seed }, uOpacity: { value: opacity } },
      side: THREE.DoubleSide, transparent: true, depthWrite: false,
    })
    material.forceSinglePass = true
    materials.push(material)
    return material
  }
  const ringCounts = [12, 11, 9, 7, 5, 3]
  ringCounts.forEach((count, ring) => {
    const layer = ring / (ringCounts.length - 1)
    const geometry = petalGeometry(layer)
    geometries.push(geometry)
    for (let index = 0; index < count; index++) {
      const seed = index * 2.399 + ring * 1.78
      const mesh = new THREE.Mesh(geometry, makeMaterial(layer, seed))
      mesh.rotation.y = index / count * Math.PI * 2 + ring * 2.399
      mesh.scale.setScalar(1 + Math.sin(seed * 4) * 0.04)
      head.add(mesh)
    }
  })

  const stemCurve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(0.07, -1.93, 0.12), new THREE.Vector3(-0.15, -1.27, 0.08),
    new THREE.Vector3(-0.08, -0.52, 0), new THREE.Vector3(0, 0.16, 0),
  ])
  const stemGeometry = new THREE.TubeGeometry(stemCurve, 45, 0.018, 8, false)
  const stemMaterial = new THREE.MeshBasicMaterial({ color: '#8fa798', transparent: true, opacity: 0.58 })
  group.add(new THREE.Mesh(stemGeometry, stemMaterial))
  geometries.push(stemGeometry)
  const leafGeometry = petalGeometry(0.4, 20)
  geometries.push(leafGeometry)
  const leafMaterial = makeMaterial(0, 8, 0.75)
  leafMaterial.uniforms = {
    ...leafMaterial.uniforms, uBloom: { value: 1 },
    uPetal: { value: new THREE.Color('#a5bdaa') }, uHeart: { value: new THREE.Color('#829d8e') },
  }
  for (let index = 0; index < 2; index++) {
    const leaf = new THREE.Mesh(leafGeometry, leafMaterial)
    leaf.scale.set(0.34, 0.28, 0.48)
    leaf.position.set(-0.07, -0.9 + index * 0.33, 0)
    leaf.rotation.set(0.1, index ? -1.25 : 1.8, index ? -0.2 : 0.15)
    group.add(leaf)
  }

  const floating = Array.from({ length: 4 }, (_, index) => {
    const mesh = new THREE.Mesh(leafGeometry, makeMaterial(0.2, index + 32, 0.66))
    // Detached petals stay open when the central bloom closes.
    mesh.material.uniforms = { ...mesh.material.uniforms, uBloom: { value: 1 } }
    mesh.scale.setScalar(0.14 + index * 0.017)
    group.add(mesh)
    return mesh
  })
  const update = (time: number) => {
    shared.uTime.value = time
    floating.forEach((mesh, index) => {
      const phase = time * 0.16 + index * 1.77
      mesh.position.set(Math.sin(phase) * 2.15, Math.cos(phase * 0.7 + index) * 1.5 - 0.1, Math.cos(phase) * 0.8)
      mesh.rotation.set(phase * 0.6, phase, Math.sin(phase) * 0.7)
    })
  }
  update(0)
  return {
    group, head, uniforms: shared, update,
    dispose: () => {
      geometries.forEach(geometry => geometry.dispose())
      materials.forEach(material => material.dispose())
      stemMaterial.dispose()
    },
  }
}
