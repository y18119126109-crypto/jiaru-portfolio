import { useEffect, useRef, useState } from 'react'
import * as THREE from 'three'
import { createGalaxy } from '../graphics/galaxy'
import { Icon } from './Icon'

export function DreamGalaxy({ running, onToggle }: { running: boolean; onToggle: () => void }) {
  const host = useRef<HTMLDivElement>(null)
  const controls = useRef<{ running: boolean; refresh?: () => void }>({ running })
  const [status, setStatus] = useState<'loading' | 'ready' | 'unavailable'>('loading')
  const [attempt, setAttempt] = useState(0)
  useEffect(() => { controls.current.running = running; controls.current.refresh?.() }, [running])
  useEffect(() => {
    const container = host.current
    if (!container) return
    setStatus('loading')
    let renderer: THREE.WebGLRenderer
    try { renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true, powerPreference: 'low-power' }) }
    catch { setStatus('unavailable'); return }
    const ratio = Math.min(devicePixelRatio || 1, 1.6)
    renderer.setPixelRatio(ratio)
    renderer.setClearColor(0, 0)
    renderer.domElement.setAttribute('aria-hidden', 'true')
    container.appendChild(renderer.domElement)
    const scene = new THREE.Scene()
    const camera = new THREE.PerspectiveCamera(43, 1, 0.1, 40)
    const galaxy = createGalaxy(innerWidth < 768)
    galaxy.uniforms.uPixelRatio.value = ratio
    renderer.domElement.dataset.particleCount = String(galaxy.count)
    scene.add(galaxy.group)
    const pointer = new THREE.Vector2()
    const tilt = new THREE.Vector2()
    let frame = 0
    let previous = 0
    let elapsed = 0
    let visible = true
    let lost = false
    let disposed = false
    const drawable = () => !disposed && !lost && visible && !document.hidden
    const draw = () => { if (drawable()) renderer.render(scene, camera) }
    const animate = (now: number) => {
      frame = 0
      if (!drawable() || !controls.current.running) return
      if (previous && now - previous < 32) { frame = requestAnimationFrame(animate); return }
      const dt = previous ? Math.min((now - previous) / 1000, 0.07) : 0.033
      previous = now
      elapsed += dt
      tilt.lerp(pointer, 1 - Math.exp(-dt * 2))
      galaxy.group.rotation.x = tilt.y * 0.08
      galaxy.group.rotation.y = tilt.x * 0.13
      galaxy.update(elapsed)
      draw()
      frame = requestAnimationFrame(animate)
    }
    const refresh = () => {
      cancelAnimationFrame(frame)
      previous = 0
      draw()
      if (drawable() && controls.current.running) frame = requestAnimationFrame(animate)
    }
    controls.current.refresh = refresh
    const resize = () => {
      const { width, height } = container.getBoundingClientRect()
      if (!width || !height) return
      galaxy.fitToMobile(innerWidth < 768)
      camera.aspect = width / height
      const distance = camera.aspect < 1 ? 8.9 / Math.max(0.7, camera.aspect) : 8.9
      camera.position.set(0, distance * 0.66, distance * 0.75)
      camera.lookAt(0, 0.1, 0)
      camera.updateProjectionMatrix()
      renderer.setSize(width, height, false)
      draw()
    }
    const move = (event: PointerEvent) => {
      if (event.pointerType === 'touch' || !controls.current.running) return
      const rect = container.getBoundingClientRect()
      pointer.set((event.clientX - rect.left) / rect.width * 2 - 1, (event.clientY - rect.top) / rect.height * 2 - 1)
    }
    const leave = () => pointer.set(0, 0)
    const fail = (event?: Event) => { event?.preventDefault(); lost = true; cancelAnimationFrame(frame); setStatus('unavailable') }
    const restore = () => setAttempt(value => value + 1)
    renderer.debug.onShaderError = () => fail()
    renderer.domElement.addEventListener('webglcontextlost', fail)
    renderer.domElement.addEventListener('webglcontextrestored', restore)
    container.addEventListener('pointermove', move)
    container.addEventListener('pointerleave', leave)
    document.addEventListener('visibilitychange', refresh)
    const resizeObserver = new ResizeObserver(resize)
    resizeObserver.observe(container)
    const intersection = new IntersectionObserver(([entry]) => { visible = entry.isIntersecting; refresh() }, { threshold: 0.01 })
    intersection.observe(container)
    resize()
    if (!lost) { setStatus('ready'); refresh() }
    return () => {
      disposed = true
      cancelAnimationFrame(frame)
      controls.current.refresh = undefined
      resizeObserver.disconnect()
      intersection.disconnect()
      container.removeEventListener('pointermove', move)
      container.removeEventListener('pointerleave', leave)
      document.removeEventListener('visibilitychange', refresh)
      renderer.domElement.removeEventListener('webglcontextlost', fail)
      renderer.domElement.removeEventListener('webglcontextrestored', restore)
      galaxy.dispose()
      renderer.dispose()
      renderer.domElement.remove()
    }
  }, [attempt])

  return (
    <div className={`dream-galaxy is-${status}`} data-motion={running ? 'running' : 'paused'}>
      <div className="galaxy-aura" aria-hidden="true" />
      <span className="galaxy-coordinate">IMAGINATION HAS ITS OWN ORBIT</span>
      <div className="galaxy-canvas" ref={host} role="img" aria-label="薄荷青与雾紫星云缓缓旋转，云带行星与细密星环在光影中悬浮" />
      {status === 'loading' && <span className="galaxy-loading">星光正在汇聚</span>}
      {status === 'unavailable' && <div className="galaxy-fallback"><div className="static-galaxy" aria-hidden="true"><i /><i /><i /><b /></div><span>此刻，星河静静停驻。</span><button onClick={() => setAttempt(value => value + 1)}>重新加载银河动效</button></div>}
      <span className="galaxy-handwriting" aria-hidden="true">somewhere, a dream takes shape.</span>
      <div className="galaxy-caption"><span><i /> 光标轻移 · 星河随行</span><button onClick={onToggle} aria-pressed={!running} aria-label={running ? '暂停梦境动效' : '播放梦境动效'}><Icon name={running ? 'pause' : 'play'} size={12} /><span>{running ? '让时间停一会' : '让星河继续'}</span></button></div>
    </div>
  )
}
