import { useEffect, useRef } from 'react'
import * as THREE from 'three'
import { waterFragmentShader, waterVertexShader } from '../graphics/waterShaders'

export type WaterStatus = 'loading' | 'ready' | 'unavailable'

export function WaterBackdrop({ paused, onStatus }: {
  paused: boolean
  onStatus: (status: WaterStatus) => void
}) {
  const host = useRef<HTMLDivElement>(null)
  const setPlaying = useRef<(playing: boolean) => void>(() => {})

  useEffect(() => {
    const container = host.current
    if (!container) return
    let renderer: THREE.WebGLRenderer
    try {
      renderer = new THREE.WebGLRenderer({ antialias: false, alpha: false, powerPreference: 'low-power' })
    } catch {
      onStatus('unavailable')
      return
    }

    const scene = new THREE.Scene()
    const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1)
    const geometry = new THREE.PlaneGeometry(2, 2)
    const ripples = Array.from({ length: 8 }, () => new THREE.Vector4(0, 0, -10, 0))
    const material = new THREE.ShaderMaterial({
      vertexShader: waterVertexShader,
      fragmentShader: waterFragmentShader,
      uniforms: {
        uTime: { value: 0 },
        uResolution: { value: new THREE.Vector2() },
        uRipples: { value: ripples },
      },
      depthWrite: false,
      depthTest: false,
    })
    scene.add(new THREE.Mesh(geometry, material))
    container.appendChild(renderer.domElement)
    renderer.domElement.setAttribute('aria-hidden', 'true')

    let frame = 0
    let time = 0
    let lastFrame = 0
    let playing = false
    let lost = false
    let nextRipple = 0
    let lastPointerTime = 0
    let lastPointerX = -1000
    let lastPointerY = -1000
    const draw = () => {
      material.uniforms.uTime.value = time
      renderer.render(scene, camera)
    }
    const tick = (now: number) => {
      if (!playing || document.hidden || lost) return
      frame = requestAnimationFrame(tick)
      if (now - lastFrame < 1000 / 30) return
      time += Math.min((now - lastFrame) / 1000, 0.06)
      lastFrame = now
      draw()
    }
    const sync = () => {
      cancelAnimationFrame(frame)
      container.dataset.active = String(playing && !document.hidden && !lost)
      if (playing && !document.hidden && !lost) {
        lastFrame = performance.now()
        frame = requestAnimationFrame(tick)
      }
    }
    setPlaying.current = value => { playing = value; sync() }
    const resize = () => {
      const { innerWidth: width, innerHeight: height } = window
      renderer.setPixelRatio(Math.min(devicePixelRatio, 1.25, 1500 / width))
      renderer.setSize(width, height)
      material.uniforms.uResolution.value.set(width, height)
      if (!lost) draw()
    }
    const addRipple = (event: PointerEvent) => {
      if (!playing || document.hidden || lost) return
      if (event.type === 'pointermove' && event.pointerType === 'touch') return
      const now = performance.now()
      const distance = Math.hypot(event.clientX - lastPointerX, event.clientY - lastPointerY)
      if (event.type !== 'pointerdown' && (now - lastPointerTime < 135 || distance < 22)) return
      ripples[nextRipple].set(
        event.clientX / innerWidth,
        1 - event.clientY / innerHeight,
        time,
        event.type === 'pointerdown' ? 0.95 : 0.65,
      )
      nextRipple = (nextRipple + 1) % ripples.length
      lastPointerX = event.clientX
      lastPointerY = event.clientY
      lastPointerTime = now
    }
    const contextLost = (event: Event) => {
      event.preventDefault()
      lost = true
      sync()
      onStatus('unavailable')
    }
    const contextRestored = () => {
      lost = false
      resize()
      sync()
      onStatus('ready')
    }
    renderer.domElement.addEventListener('webglcontextlost', contextLost)
    renderer.domElement.addEventListener('webglcontextrestored', contextRestored)
    window.addEventListener('resize', resize)
    window.addEventListener('pointermove', addRipple, { passive: true })
    window.addEventListener('pointerdown', addRipple, { passive: true })
    document.addEventListener('visibilitychange', sync)
    resize()
    onStatus('ready')

    return () => {
      setPlaying.current = () => {}
      cancelAnimationFrame(frame)
      window.removeEventListener('resize', resize)
      window.removeEventListener('pointermove', addRipple)
      window.removeEventListener('pointerdown', addRipple)
      document.removeEventListener('visibilitychange', sync)
      renderer.domElement.removeEventListener('webglcontextlost', contextLost)
      renderer.domElement.removeEventListener('webglcontextrestored', contextRestored)
      geometry.dispose()
      material.dispose()
      renderer.dispose()
      renderer.forceContextLoss()
      renderer.domElement.remove()
    }
  }, [onStatus])

  useEffect(() => { setPlaying.current(!paused) }, [paused])

  return <div ref={host} className="water-backdrop" data-motion={paused ? 'paused' : 'running'} aria-hidden="true" />
}
