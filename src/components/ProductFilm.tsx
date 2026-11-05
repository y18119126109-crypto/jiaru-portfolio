import { useEffect, useRef, useState } from 'react'
import { Icon } from './Icon'
import type { ProductRecording } from '../data/products'

const playbackEvent = 'jiaru-product-film-play'
const clock = (time: number) => `${Math.floor(time / 60).toString().padStart(2, '0')}:${Math.floor(time % 60).toString().padStart(2, '0')}`
type Actions = { toggle: () => void; seek: (time: number, play?: boolean) => void }

export function ProductFilm({ film }: { film: ProductRecording }) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const stageRef = useRef<HTMLDivElement>(null)
  const actions = useRef<Actions | null>(null)
  const [started, setStarted] = useState(false)
  const [playing, setPlaying] = useState(false)
  const [requested, setRequested] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [time, setTime] = useState(0)
  const [duration, setDuration] = useState(film.duration)

  useEffect(() => {
    const video = videoRef.current
    const stage = stageRef.current
    if (!video || !stage) return
    let disposed = false
    let wantsPlayback = false
    let pendingSeek: number | null = null
    let cachedUrl: string | null = null
    let controller: AbortController | null = null
    let attempt = 0
    video.muted = true

    const pause = () => {
      wantsPlayback = false
      setRequested(false)
      ++attempt
      video.pause()
      setPlaying(false)
      setBusy(false)
    }
    const fail = () => {
      pause()
      setError('视频暂时未能加载，点击播放重试。')
    }
    const invokePlay = () => {
      const id = ++attempt
      setBusy(true)
      void video.play().catch(() => {
        if (!disposed && id === attempt) fail()
      })
    }
    const canSeek = (value: number) => {
      if (value === 0 || cachedUrl) return true
      for (let i = 0; i < video.seekable.length; i++) {
        if (value >= video.seekable.start(i) && value <= video.seekable.end(i)) return true
      }
      return false
    }
    const loadSeekable = () => {
      if (controller || cachedUrl) return
      controller = new AbortController()
      const signal = controller.signal
      setBusy(true)
      // Pages may return a full 200 response to Range requests. Fetch only
      // after an explicit seek; keep at most one object URL per recording.
      void fetch(film.src, { signal })
        .then(response => {
          if (!response.ok) throw new Error('Video request failed')
          return response.blob()
        })
        .then(blob => {
          if (disposed || signal.aborted) return
          if (!blob.size) throw new Error('Empty video')
          cachedUrl = URL.createObjectURL(blob)
          pendingSeek ??= video.currentTime
          ++attempt
          video.pause()
          video.src = cachedUrl
          video.load()
        })
        .catch(() => { if (!disposed && !signal.aborted) fail() })
        .finally(() => { controller = null })
    }
    const metadata = () => {
      if (Number.isFinite(video.duration)) setDuration(video.duration)
      if (pendingSeek === null) return
      const target = Math.min(pendingSeek, Math.max(0, video.duration - 0.05))
      if (!Number.isFinite(target)) return
      if (!canSeek(target)) { loadSeekable(); return }
      video.currentTime = target
      pendingSeek = null
      setTime(target)
      if (wantsPlayback) invokePlay()
      else setBusy(false)
    }
    const beginPlayback = () => {
      wantsPlayback = true
      setRequested(true)
      setError('')
      window.dispatchEvent(new CustomEvent(playbackEvent, { detail: film.id }))
    }
    const prepare = () => {
      setStarted(true)
      setError('')
      if (!video.getAttribute('src') || video.error) {
        video.src = cachedUrl ?? film.src
        video.load()
      }
    }
    const seek = (value: number, play = false) => {
      const length = Number.isFinite(video.duration) ? video.duration : film.duration
      pendingSeek = Math.min(Math.max(0, value), length - 0.05)
      setTime(pendingSeek)
      if (play) beginPlayback()
      prepare()
      setBusy(true)
      if (video.readyState >= 1) metadata()
      else { video.preload = 'metadata'; video.load() }
    }
    const onPlaying = () => {
      if (!wantsPlayback || document.hidden) { pause(); return }
      setPlaying(true)
      setBusy(false)
      setError('')
    }
    const onPause = () => setPlaying(false)
    const onTime = () => { if (pendingSeek === null) setTime(video.currentTime) }
    const onWaiting = () => { if (wantsPlayback) setBusy(true) }
    const onSeeked = () => { if (!wantsPlayback) setBusy(false) }
    const onEnded = () => { pause(); setTime(video.duration) }
    const onOtherPlay = (event: Event) => { if ((event as CustomEvent<string>).detail !== film.id) pause() }
    const onHidden = () => { if (document.hidden) pause() }
    const intersection = new IntersectionObserver(([entry]) => {
      if (!entry.isIntersecting && !document.fullscreenElement) pause()
    }, { threshold: 0 })
    intersection.observe(stage)
    const listeners = { loadedmetadata: metadata, playing: onPlaying, pause: onPause, timeupdate: onTime, waiting: onWaiting, seeked: onSeeked, ended: onEnded, error: fail }
    for (const [event, listener] of Object.entries(listeners)) video.addEventListener(event, listener)
    window.addEventListener(playbackEvent, onOtherPlay)
    window.addEventListener('pagehide', pause)
    document.addEventListener('visibilitychange', onHidden)
    actions.current = {
      seek,
      toggle: () => {
        if (wantsPlayback) { pause(); return }
        beginPlayback()
        prepare()
        if (video.ended) pendingSeek = 0
        if (pendingSeek !== null) {
          if (video.readyState >= 1) metadata()
          else { video.preload = 'metadata'; video.load() }
        } else invokePlay()
      },
    }
    return () => {
      disposed = true
      ++attempt
      actions.current = null
      controller?.abort()
      intersection.disconnect()
      for (const [event, listener] of Object.entries(listeners)) video.removeEventListener(event, listener)
      window.removeEventListener(playbackEvent, onOtherPlay)
      window.removeEventListener('pagehide', pause)
      document.removeEventListener('visibilitychange', onHidden)
      video.pause()
      video.removeAttribute('src')
      video.load()
      if (cachedUrl) URL.revokeObjectURL(cachedUrl)
    }
  }, [film])

  const fullscreen = () => {
    const stage = stageRef.current
    const video = videoRef.current as (HTMLVideoElement & { webkitEnterFullscreen?: () => void }) | null
    if (document.fullscreenElement) void document.exitFullscreen().catch(() => {})
    else if (stage?.requestFullscreen) void stage.requestFullscreen().catch(() => setError('当前浏览器无法进入全屏，可继续在页面观看。'))
    else if (video?.webkitEnterFullscreen) video.webkitEnterFullscreen()
  }
  const chapter = film.chapters.reduce((active, item, index) => time >= item.time ? index : active, -1)
  return (
    <section className="product-film" aria-labelledby={`${film.id}-film-title`} data-film={film.id}>
      <div className="film-heading">
        <div><span className="product-overline">A LITTLE WORLD, IN MOTION</span><h3 id={`${film.id}-film-title`}>{film.title}</h3></div>
        <p>{film.description}</p>
      </div>
      <div className="film-player" ref={stageRef}>
        <div className="film-screen">
          <video ref={videoRef} poster={film.poster} preload="none" playsInline muted aria-label={`${film.name}实际操作录屏`} aria-describedby={`${film.id}-film-note`} />
          {!started && <button className="film-cover" aria-label={`播放${film.name}实录`} onClick={() => actions.current?.toggle()}><span className="film-play-orbit"><Icon name="play" size={24} /></span><span>观看实际操作<span>{clock(film.duration)} · 完整实录</span></span></button>}
          {started && busy && <span className="film-loading" role="status">正在准备画面…</span>}
          <span className="film-badge"><i /> PRODUCT FILM <span>{film.edition}</span></span>
        </div>
        <div className="film-controls">
          <button onClick={() => actions.current?.toggle()} aria-label={`${requested ? '暂停' : '播放'}${film.name}视频`} aria-pressed={playing}><Icon name={requested ? 'pause' : 'play'} size={15} /></button>
          <span className="film-time">{clock(time)} <i>/ {clock(duration)}</i></span>
          <input type="range" min={0} max={duration} step={0.1} value={Math.min(time, duration)} aria-label={`${film.name}视频进度`} aria-valuetext={`${clock(time)}，共 ${clock(duration)}`} onChange={event => actions.current?.seek(Number(event.target.value))} />
          <span className="film-silent"><Icon name="mute" size={12} />无声录屏</span>
          <button onClick={fullscreen} aria-label={`全屏观看${film.name}`}><Icon name="diagonal" size={16} /></button>
        </div>
      </div>
      <div className="film-chapters" role="group" aria-label={`${film.name}视频章节`}>{film.chapters.map((item, index) => <button key={item.time} onClick={() => actions.current?.seek(item.time, true)} aria-current={started && chapter === index ? 'step' : undefined}><span>{clock(item.time)}</span><strong>{item.title}</strong><Icon name="play" size={10} /></button>)}</div>
      <p className="film-note" id={`${film.id}-film-note`}>{film.note}</p>
      {error && <p className="film-error" role="status">{error}</p>}
    </section>
  )
}
