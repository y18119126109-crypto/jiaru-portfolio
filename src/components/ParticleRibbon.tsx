import { useEffect, useRef, useState } from 'react'
import * as THREE from 'three'
import { particleFragmentShader, particleVertexShader } from '../graphics/particleShaders'
import { Icon } from './Icon'

type Controls = { running: boolean; refresh?: () => void }

function useReducedMotionPreference() {
  const [reducedMotion, setReducedMotion] = useState(() => window.matchMedia('(prefers-reduced-motion: reduce)').matches)
  useEffect(() => {
    const media = window.matchMedia('(prefers-reduced-motion: reduce)')
    const update = () => setReducedMotion(media.matches)
    media.addEventListener('change', update)
    return () => media.removeEventListener('change', update)
  }, [])
  return reducedMotion
}

function makeGeometry(count: number) {
  const geometry = new THREE.BufferGeometry()
  const seeds = new Float32Array(count * 4)
  const kinds = new Float32Array(count)
  let seed = 9527
  const random = () => {
    seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0
    return seed / 4294967296
  }
  for (let i = 0; i < count; i++) {
    for (let j = 0; j < 4; j++) seeds[i * 4 + j] = random()
    const ratio = i / count
    kinds[i] = ratio < 0.67 ? 0 : ratio < 0.76 ? 1 : ratio < 0.82 ? 2
      : ratio < 0.85 ? 3 : ratio < 0.88 ? 4 : ratio < 0.90 ? 5
        : ratio < 0.96 ? 6 : 7
  }
  geometry.setAttribute('position', new THREE.BufferAttribute(new Float32Array(count * 3), 3))
  geometry.setAttribute('aSeed', new THREE.BufferAttribute(seeds, 4))
  geometry.setAttribute('aKind', new THREE.BufferAttribute(kinds, 1))
  geometry.boundingSphere = new THREE.Sphere(new THREE.Vector3(0, 0.4, 0), 4)
  return geometry
}

export default function ParticleRibbon() {
  const host = useRef<HTMLDivElement>(null)
  const reducedMotion = useReducedMotionPreference()
  const [motionOverride, setMotionOverride] = useState<boolean | null>(null)
  const running = motionOverride ?? !reducedMotion
  const controls = useRef<Controls>({ running })
  const [failed, setFailed] = useState(false)
  const [retry, setRetry] = useState(0)
  const [ready, setReady] = useState(false)

  useEffect(() => {
    controls.current.running = running
    controls.current.refresh?.()
  }, [running])

  useEffect(() => {
    const container = host.current
    if (!container) return
    setFailed(false)
    setReady(false)
    const count = window.matchMedia('(max-width: 640px)').matches ? 4000 : 6000
    let renderer: THREE.WebGLRenderer
    try {
      renderer = new THREE.WebGLRenderer({ alpha: true, antialias: false, powerPreference: 'low-power' })
    } catch {
      setFailed(true)
      return
    }
    renderer.setClearColor(0x000000, 0)
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, count === 4000 ? 1.5 : 1.75))
    renderer.outputColorSpace = THREE.SRGBColorSpace
    renderer.domElement.setAttribute('aria-hidden', 'true')
    renderer.domElement.dataset.particleCount = String(count)
    container.appendChild(renderer.domElement)

    const scene = new THREE.Scene()
    const camera = new THREE.PerspectiveCamera(40, 1, 0.1, 30)
    camera.position.set(0, 0.42, 7.05)
    camera.lookAt(0, 0.42, 0)
    const geometry = makeGeometry(count)
    const uniforms = {
      uTime: { value: 2.5 },
      uPixelRatio: { value: renderer.getPixelRatio() },
      uPointer: { value: new THREE.Vector2(10, 10) },
      uPointerStrength: { value: 0 },
      uMint: { value: new THREE.Color('#73b7a6') },
      uDeep: { value: new THREE.Color('#326e65') },
      uPeach: { value: new THREE.Color('#d99c88') },
      uLavender: { value: new THREE.Color('#a8a0c6') },
    }
    const material = new THREE.ShaderMaterial({
      uniforms,
      vertexShader: particleVertexShader,
      fragmentShader: particleFragmentShader,
      transparent: true,
      depthWrite: false,
      depthTest: false,
      blending: THREE.NormalBlending,
    })
    const points = new THREE.Points(geometry, material)
    points.frustumCulled = false
    scene.add(points)

    let frame = 0
    let previousTime = 0
    let inView = true
    let contextLost = false
    let disposed = false
    const pointerTarget = new THREE.Vector2(10, 10)
    const raycaster = new THREE.Raycaster()
    const pointerNdc = new THREE.Vector2()
    const pointerWorld = new THREE.Vector3()
    const plane = new THREE.Plane(new THREE.Vector3(0, 0, 1), 0)
    let pointerActive = 0

    const canAnimate = () => controls.current.running && inView && !document.hidden && !contextLost && !disposed
    const render = () => {
      if (!disposed && !contextLost) renderer.render(scene, camera)
    }
    const animate = (now: number) => {
      frame = 0
      if (!canAnimate()) return
      const delta = previousTime ? Math.min((now - previousTime) / 1000, 0.05) : 0
      previousTime = now
      uniforms.uTime.value += delta
      const smoothing = 1 - Math.exp(-delta * 9)
      uniforms.uPointer.value.lerp(pointerTarget, smoothing)
      uniforms.uPointerStrength.value += (pointerActive - uniforms.uPointerStrength.value) * smoothing
      render()
      frame = window.requestAnimationFrame(animate)
    }
    const refresh = () => {
      if (frame) window.cancelAnimationFrame(frame)
      frame = 0
      previousTime = 0
      render()
      if (canAnimate()) frame = window.requestAnimationFrame(animate)
    }
    controls.current.refresh = refresh

    const resize = () => {
      const { width, height } = container.getBoundingClientRect()
      if (!width || !height) return
      camera.aspect = width / height
      // A little extra breathing room in a narrow canvas.
      camera.position.z = camera.aspect < 0.78 ? 7.8 : 7.05
      camera.updateProjectionMatrix()
      renderer.setSize(width, height)
      render()
    }
    const onPointerMove = (event: PointerEvent) => {
      if (event.pointerType === 'touch' || !controls.current.running) return
      const rect = container.getBoundingClientRect()
      pointerNdc.set((event.clientX - rect.left) / rect.width * 2 - 1, -(event.clientY - rect.top) / rect.height * 2 + 1)
      raycaster.setFromCamera(pointerNdc, camera)
      if (raycaster.ray.intersectPlane(plane, pointerWorld)) {
        // The first entry starts from the cursor instead of traversing the sculpture.
        if (pointerActive === 0) uniforms.uPointer.value.set(pointerWorld.x, pointerWorld.y)
        pointerTarget.set(pointerWorld.x, pointerWorld.y)
        pointerActive = 1
      }
    }
    const onPointerLeave = () => { pointerActive = 0 }
    const onContextLost = (event: Event) => {
      event.preventDefault()
      contextLost = true
      if (frame) window.cancelAnimationFrame(frame)
      frame = 0
      setFailed(true)
      setReady(false)
    }
    const onContextRestored = () => setRetry(value => value + 1)
    renderer.domElement.addEventListener('webglcontextlost', onContextLost)
    renderer.domElement.addEventListener('webglcontextrestored', onContextRestored)
    container.addEventListener('pointermove', onPointerMove)
    container.addEventListener('pointerleave', onPointerLeave)
    document.addEventListener('visibilitychange', refresh)
    const resizeObserver = new ResizeObserver(resize)
    resizeObserver.observe(container)
    const intersectionObserver = new IntersectionObserver(([entry]) => {
      inView = entry.isIntersecting
      refresh()
    }, { threshold: 0.05 })
    intersectionObserver.observe(container)

    renderer.debug.onShaderError = () => {
      contextLost = true
      if (frame) window.cancelAnimationFrame(frame)
      frame = 0
      setFailed(true)
      setReady(false)
    }
    resize()
    if (!contextLost) {
      setReady(true)
      refresh()
    }

    return () => {
      disposed = true
      if (frame) window.cancelAnimationFrame(frame)
      controls.current.refresh = undefined
      resizeObserver.disconnect()
      intersectionObserver.disconnect()
      document.removeEventListener('visibilitychange', refresh)
      container.removeEventListener('pointermove', onPointerMove)
      container.removeEventListener('pointerleave', onPointerLeave)
      renderer.domElement.removeEventListener('webglcontextlost', onContextLost)
      renderer.domElement.removeEventListener('webglcontextrestored', onContextRestored)
      geometry.dispose()
      material.dispose()
      renderer.dispose()
      renderer.domElement.remove()
    }
  }, [retry])

  return (
    <div className={`particle-ribbon ${ready ? 'is-ready' : ''}`} data-motion={running ? 'running' : 'paused'}>
      <div className="particle-canvas" ref={host} role="img" aria-label="由薄荷青与淡杏粉矩形粒子组成的三维小提琴，带有流动、扫描和呼吸效果" style={{ visibility: failed ? 'hidden' : 'visible' }} />
      {failed && (
        <div className="particle-fallback">
          <svg viewBox="0 0 220 360" aria-hidden="true">
            <g fill="none" stroke="currentColor" strokeWidth="1.5" transform="rotate(10 110 180)">
              <path d="M103 135V48q-14-5-8-19 10-15 21-2 7 12-4 19v89c37-10 49 29 22 49-8 8-2 16 10 28 41 45 9 95-36 91-45 4-76-46-36-91 12-12 18-20 10-28-27-20-16-59 21-49Z" />
              <path d="M106 42v223m5-223v223M150 50l29 273M156 50l29 273" />
            </g>
          </svg>
          <p>静态展示 · 当前浏览器未启用 3D</p>
          <button className="text-link" onClick={() => setRetry(value => value + 1)}>重新加载</button>
        </div>
      )}
      {!failed && (
        <div className="particle-controls flex items-center gap-3">
          <span className="particle-hint flex items-center gap-1.5"><Icon name="cursor" size={13} />靠近，感受灵感的流动</span>
          <span className="control-divider" />
          <button type="button" className="motion-toggle" onClick={() => setMotionOverride(!running)} aria-label={running ? '暂停粒子动效' : '播放粒子动效'} aria-pressed={!running}>
            <Icon name={running ? 'pause' : 'play'} size={12} />
          </button>
        </div>
      )}
    </div>
  )
}
