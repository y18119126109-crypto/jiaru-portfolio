import { useEffect, useRef, useState } from 'react'
import { useReducedMotion } from 'framer-motion'
import * as THREE from 'three'
import { createFlower } from '../graphics/flower'
import type { Playlist } from '../data/playlists'
import { BotanicalMark } from './BotanicalMark'
import { Icon } from './Icon'

export function PlaylistFlower({ theme }: { theme: Playlist['theme'] }) {
  const host = useRef<HTMLButtonElement>(null)
  const reducedMotion = useReducedMotion()
  const [override, setOverride] = useState<boolean | null>(null)
  const running = override ?? !reducedMotion
  const [bloom, setBloom] = useState(true)
  const [status, setStatus] = useState<'loading' | 'ready' | 'unavailable'>('loading')
  const [attempt, setAttempt] = useState(0)
  const controls = useRef<{ running: boolean; bloom: boolean; theme: Playlist['theme']; refresh?: () => void }>({ running, bloom, theme })

  useEffect(() => {
    Object.assign(controls.current, { running, bloom, theme })
    controls.current.refresh?.()
  }, [running, bloom, theme])

  useEffect(() => {
    const container = host.current
    if (!container) return
    setStatus('loading')
    let renderer: THREE.WebGLRenderer
    try { renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true, powerPreference: 'low-power' }) }
    catch { setStatus('unavailable'); return }
    renderer.setPixelRatio(Math.min(devicePixelRatio || 1, 1.65))
    renderer.setClearColor(0, 0)
    renderer.outputColorSpace = THREE.SRGBColorSpace
    renderer.domElement.setAttribute('aria-hidden', 'true')
    container.appendChild(renderer.domElement)
    const scene = new THREE.Scene()
    const camera = new THREE.PerspectiveCamera(39, 1, 0.1, 30)
    const current = controls.current
    const flower = createFlower(current.theme.petal, current.theme.heart, current.running ? 0.18 : Number(current.bloom))
    scene.add(flower.group)
    const pointer = new THREE.Vector2()
    const tilt = new THREE.Vector2()
    const petalTarget = new THREE.Color()
    const heartTarget = new THREE.Color()
    let visible = true
    let lost = false
    let disposed = false
    let frame = 0
    let previous = 0
    let elapsed = 0
    const canDraw = () => visible && !document.hidden && !lost && !disposed
    const canRun = () => canDraw() && controls.current.running
    const draw = () => { if (canDraw()) renderer.render(scene, camera) }
    const updateTargets = () => {
      petalTarget.set(controls.current.theme.petal)
      heartTarget.set(controls.current.theme.heart)
    }
    const animate = (now: number) => {
      frame = 0
      if (!canRun()) return
      // 30 fps keeps a layered transparent flower gentle on laptops and phones.
      if (previous && now - previous < 32) { frame = requestAnimationFrame(animate); return }
      const dt = previous ? Math.min((now - previous) / 1000, 0.07) : 0.033
      previous = now
      elapsed += dt
      const smooth = 1 - Math.exp(-dt * 2.1)
      flower.uniforms.uBloom.value += (Number(controls.current.bloom) - flower.uniforms.uBloom.value) * smooth
      flower.uniforms.uPetal.value.lerp(petalTarget, smooth)
      flower.uniforms.uHeart.value.lerp(heartTarget, smooth)
      tilt.lerp(pointer, 1 - Math.exp(-dt * 2.6))
      flower.group.rotation.set(tilt.y * 0.12, Math.sin(elapsed * 0.16) * 0.17 + tilt.x * 0.3, -tilt.x * 0.04)
      flower.group.position.y = Math.sin(elapsed * 0.7) * 0.025
      flower.update(elapsed)
      draw()
      frame = requestAnimationFrame(animate)
    }
    const refresh = () => {
      cancelAnimationFrame(frame)
      frame = 0
      previous = 0
      updateTargets()
      if (!controls.current.running) {
        flower.uniforms.uBloom.value = Number(controls.current.bloom)
        flower.uniforms.uPetal.value.copy(petalTarget)
        flower.uniforms.uHeart.value.copy(heartTarget)
      }
      draw()
      if (canRun()) frame = requestAnimationFrame(animate)
    }
    controls.current.refresh = refresh
    const resize = () => {
      const { width, height } = container.getBoundingClientRect()
      if (!width || !height) return
      camera.aspect = width / height
      const distance = camera.aspect < 1.1 ? 6.9 / Math.max(0.65, camera.aspect) : 6.3
      camera.position.set(0, distance * 0.44, distance)
      camera.lookAt(0, 0.16, 0)
      camera.updateProjectionMatrix()
      renderer.setSize(width, height, false)
      draw()
    }
    const move = (event: PointerEvent) => {
      if (event.pointerType === 'touch' || !canRun()) return
      const rect = container.getBoundingClientRect()
      pointer.set((event.clientX - rect.left) / rect.width * 2 - 1, (event.clientY - rect.top) / rect.height * 2 - 1)
    }
    const leave = () => pointer.set(0, 0)
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
    const observer = new ResizeObserver(resize)
    observer.observe(container)
    const intersection = new IntersectionObserver(([entry]) => { visible = entry.isIntersecting; refresh() }, { threshold: 0.01 })
    intersection.observe(container)
    resize()
    if (!lost) { setStatus('ready'); refresh() }
    return () => {
      disposed = true
      cancelAnimationFrame(frame)
      controls.current.refresh = undefined
      observer.disconnect()
      intersection.disconnect()
      document.removeEventListener('visibilitychange', refresh)
      container.removeEventListener('pointermove', move)
      container.removeEventListener('pointerleave', leave)
      renderer.domElement.removeEventListener('webglcontextlost', fail)
      renderer.domElement.removeEventListener('webglcontextrestored', restore)
      flower.dispose()
      renderer.dispose()
      renderer.domElement.remove()
    }
  }, [attempt])

  return (
    <div className={`playlist-flower is-${status}`} data-motion={running ? 'running' : 'paused'} data-bloom={bloom ? 'open' : 'closed'}>
      <div className="flower-halo" aria-hidden="true" />
      <div className="flower-topline"><span>BOTANICAL SOUND STUDY</span><span>№ 04</span></div>
      <div className="flower-orbit" aria-hidden="true" />
      <button ref={host} className="flower-canvas" onClick={() => setBloom(value => !value)} aria-label={bloom ? '收拢花朵' : '绽放花朵'} aria-pressed={bloom} aria-describedby="flower-hint" disabled={status === 'unavailable'} />
      {status === 'unavailable' && <div className="flower-fallback"><BotanicalMark /><p>一朵静静开放的花</p><button onClick={() => setAttempt(value => value + 1)}>重新加载花朵动效</button></div>}
      <span className="flower-handwriting" aria-hidden="true">let the music bloom.</span>
      <div className="flower-bottomline">
        <span id="flower-hint"><Icon name="cursor" size={12} />{status === 'unavailable' ? '歌单仍可完整浏览' : '轻点花朵，感受一次绽放'}</span>
        {status === 'ready' && <button className="flower-pause glass" aria-label={running ? '暂停花朵动效' : '播放花朵动效'} aria-pressed={!running} onClick={() => setOverride(!running)}><Icon name={running ? 'pause' : 'play'} size={11} /></button>}
      </div>
    </div>
  )
}
