import { useEffect, useRef, useState } from 'react'
import { useReducedMotion } from 'framer-motion'
import * as THREE from 'three'
import type { AudioEnergy } from '../hooks/useMusicPlayer'
import { musicVertexShader } from '../graphics/musicShaders'
import { particleFragmentShader } from '../graphics/particleShaders'
import { Icon } from './Icon'

export function MusicParticles({ sample, tone, playing, analysisAvailable }: {
  sample: () => AudioEnergy; tone: string; playing: boolean; analysisAvailable: boolean
}) {
  const host = useRef<HTMLDivElement>(null)
  const reducedMotion = useReducedMotion()
  const [override, setOverride] = useState<boolean | null>(null)
  const running = override ?? !reducedMotion
  const controls = useRef<{ running: boolean; tone: string; refresh?: () => void }>({ running, tone })
  const [status, setStatus] = useState<'loading' | 'ready' | 'unavailable'>('loading')
  const [attempt, setAttempt] = useState(0)

  useEffect(() => {
    controls.current.running = running
    controls.current.tone = tone
    controls.current.refresh?.()
  }, [running, tone])

  useEffect(() => {
    const container = host.current
    if (!container) return
    setStatus('loading')
    let renderer: THREE.WebGLRenderer
    try { renderer = new THREE.WebGLRenderer({ alpha: true, antialias: false, powerPreference: 'low-power' }) }
    catch { setStatus('unavailable'); return }
    const count = matchMedia('(max-width: 640px)').matches ? 4000 : 6000
    renderer.setPixelRatio(Math.min(devicePixelRatio || 1, count === 4000 ? 1.5 : 1.75))
    renderer.setClearColor(0, 0)
    renderer.outputColorSpace = THREE.SRGBColorSpace
    renderer.domElement.setAttribute('aria-hidden', 'true')
    renderer.domElement.dataset.particleCount = String(count)
    container.appendChild(renderer.domElement)
    const scene = new THREE.Scene()
    const camera = new THREE.PerspectiveCamera(40, 1, 0.1, 30)
    camera.position.z = 6.4
    const geometry = new THREE.BufferGeometry()
    const seeds = new Float32Array(count * 4)
    let seed = 6178
    for (let i = 0; i < seeds.length; i++) {
      seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0
      seeds[i] = seed / 4294967296
    }
    geometry.setAttribute('position', new THREE.BufferAttribute(new Float32Array(count * 3), 3))
    geometry.setAttribute('aSeed', new THREE.BufferAttribute(seeds, 4))
    const uniforms = {
      uTime: { value: 4 },
      uPixelRatio: { value: renderer.getPixelRatio() },
      uAudio: { value: new THREE.Vector4(0, 0, 0, 0) },
      uMood: { value: tone === 'mint' ? 1 : 0 },
      uPointer: { value: new THREE.Vector2(10, 10) },
      uPointerStrength: { value: 0 },
    }
    const material = new THREE.ShaderMaterial({
      uniforms, vertexShader: musicVertexShader, fragmentShader: particleFragmentShader,
      transparent: true, depthWrite: false, depthTest: false, blending: THREE.NormalBlending,
    })
    const points = new THREE.Points(geometry, material)
    points.frustumCulled = false
    scene.add(points)
    let frame = 0
    let previous = 0
    let visible = true
    let lost = false
    let disposed = false
    let pointerStrength = 0
    const pointer = new THREE.Vector2(10, 10)
    const audioTarget = new THREE.Vector4(0, 0, 0, 0)
    const canRun = () => controls.current.running && visible && !document.hidden && !lost && !disposed
    const draw = () => { if (!lost && !disposed) renderer.render(scene, camera) }
    const animate = (now: number) => {
      frame = 0
      if (!canRun()) return
      const dt = previous ? Math.min((now - previous) / 1000, 0.05) : 0.016
      previous = now
      uniforms.uTime.value += dt
      const energy = sample()
      audioTarget.set(energy.bass, energy.mid, energy.high, energy.level)
      uniforms.uAudio.value.lerp(audioTarget, 1 - Math.exp(-dt * (energy.level > uniforms.uAudio.value.w ? 14 : 5)))
      uniforms.uMood.value += ((controls.current.tone === 'mint' ? 1 : 0) - uniforms.uMood.value) * (1 - Math.exp(-dt * 2))
      uniforms.uPointer.value.lerp(pointer, 1 - Math.exp(-dt * 8))
      uniforms.uPointerStrength.value += (pointerStrength - uniforms.uPointerStrength.value) * (1 - Math.exp(-dt * 8))
      draw()
      frame = requestAnimationFrame(animate)
    }
    const refresh = () => {
      cancelAnimationFrame(frame)
      previous = 0
      frame = 0
      if (!controls.current.running) uniforms.uMood.value = controls.current.tone === 'mint' ? 1 : 0
      draw()
      if (canRun()) frame = requestAnimationFrame(animate)
    }
    controls.current.refresh = refresh
    const resize = () => {
      const { width, height } = container.getBoundingClientRect()
      if (!width || !height) return
      camera.aspect = width / height
      camera.position.z = camera.aspect < 1 ? 6.5 / camera.aspect : 6.4
      camera.updateProjectionMatrix()
      renderer.setSize(width, height, false)
      draw()
    }
    const raycaster = new THREE.Raycaster()
    const ndc = new THREE.Vector2()
    const hit = new THREE.Vector3()
    const plane = new THREE.Plane(new THREE.Vector3(0, 0, 1), 0)
    const move = (event: PointerEvent) => {
      if (event.pointerType === 'touch' || !canRun()) return
      const rect = container.getBoundingClientRect()
      ndc.set((event.clientX - rect.left) / rect.width * 2 - 1, -(event.clientY - rect.top) / rect.height * 2 + 1)
      raycaster.setFromCamera(ndc, camera)
      if (raycaster.ray.intersectPlane(plane, hit)) {
        if (!pointerStrength) uniforms.uPointer.value.set(hit.x, hit.y)
        pointer.set(hit.x, hit.y)
        pointerStrength = 1
      }
    }
    const leave = () => { pointerStrength = 0 }
    const fail = (event?: Event) => {
      event?.preventDefault()
      lost = true
      cancelAnimationFrame(frame)
      setStatus('unavailable')
    }
    const restore = () => setAttempt(value => value + 1)
    renderer.debug.onShaderError = () => fail()
    renderer.domElement.addEventListener('webglcontextlost', fail)
    renderer.domElement.addEventListener('webglcontextrestored', restore)
    container.addEventListener('pointermove', move)
    container.addEventListener('pointerleave', leave)
    document.addEventListener('visibilitychange', refresh)
    const resizeObserver = new ResizeObserver(resize)
    resizeObserver.observe(container)
    const intersection = new IntersectionObserver(([entry]) => { visible = entry.isIntersecting; refresh() }, { threshold: 0.05 })
    intersection.observe(container)
    resize()
    if (!lost) { setStatus('ready'); refresh() }
    return () => {
      disposed = true
      cancelAnimationFrame(frame)
      controls.current.refresh = undefined
      resizeObserver.disconnect()
      intersection.disconnect()
      document.removeEventListener('visibilitychange', refresh)
      container.removeEventListener('pointermove', move)
      container.removeEventListener('pointerleave', leave)
      renderer.domElement.removeEventListener('webglcontextlost', fail)
      renderer.domElement.removeEventListener('webglcontextrestored', restore)
      geometry.dispose()
      material.dispose()
      renderer.dispose()
      renderer.domElement.remove()
    }
  }, [sample, attempt]) // Tone changes interpolate uniforms without rebuilding GPU resources.

  return (
    <div className={`music-sculpture is-${status} sculpture-${tone}`} data-motion={running ? 'running' : 'paused'}>
      <div className="music-sculpture-halo" aria-hidden="true" />
      <div className="music-art-label"><span>THE SHAPE OF SOUND</span><span>∞</span></div>
      <div className="music-particle-host" ref={host} role="img" aria-label="由细小矩形粒子汇成的悬浮声环，随音乐频谱起伏" />
      <div className="music-ring-center" aria-hidden="true"><span>in resonance</span><i>声 音 的 形 状</i></div>
      {status === 'unavailable' && <div className="music-particle-fallback">
        <svg viewBox="0 0 300 220" aria-hidden="true"><g fill="none" stroke="currentColor" transform="rotate(-22 150 110)">{[0, 1, 2, 3, 4].map(i => <ellipse key={i} cx="150" cy="110" rx={100 + i * 5} ry={62 + i * 4} strokeDasharray="2 5" />)}</g></svg>
        <p>静态声环 · 音乐依然可以播放</p><button onClick={() => setAttempt(value => value + 1)}>重新加载动效</button>
      </div>}
      <div className="music-art-bottom">
        <span className="music-live-label"><i className={`status-dot ${playing && running ? 'is-live' : ''}`} />{!analysisAvailable ? '静静流动，陪你聆听' : !running ? '让声音流动，让画面停留' : playing ? '随此刻的旋律，轻轻起伏' : '等待一首歌，唤醒涟漪'}</span>
        {status === 'ready' && <button className="motion-toggle" aria-label={running ? '暂停粒子动效' : '播放粒子动效'} aria-pressed={!running} onClick={() => setOverride(!running)}><Icon name={running ? 'pause' : 'play'} size={12} /></button>}
      </div>
    </div>
  )
}
