import { useCallback, useEffect, useRef, useState } from 'react'
import { musicTracks } from '../data/music'

const STORAGE_KEY = 'jiaru-music-player-v1'
export type AudioEnergy = { bass: number; mid: number; high: number; level: number }
const silence: AudioEnergy = { bass: 0, mid: 0, high: 0, level: 0 }
type SavedPlayer = { index: number; time: number; volume: number; muted: boolean }

function readSaved(): SavedPlayer {
  const fallback = { index: 0, time: 0, volume: 0.72, muted: false }
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? 'null')
    if (!saved) return fallback
    return {
      index: Number.isInteger(saved.index) && saved.index >= 0 && saved.index < musicTracks.length ? saved.index : 0,
      time: Number.isFinite(saved.time) ? Math.max(0, saved.time) : 0,
      volume: Number.isFinite(saved.volume) ? Math.min(1, Math.max(0, saved.volume)) : fallback.volume,
      muted: saved.muted === true,
    }
  } catch { return fallback }
}

type PlayerActions = {
  toggle: () => void
  select: (index: number, autoplay?: boolean) => void
  skip: (direction: number) => void
  seek: (time: number) => void
  volume: (value: number) => void
  mute: () => void
  sample: () => AudioEnergy
}

export function useMusicPlayer() {
  const [saved] = useState(readSaved)
  const audioRef = useRef<HTMLAudioElement>(null)
  const actions = useRef<PlayerActions | null>(null)
  const [index, setIndex] = useState(saved.index)
  const [time, setTime] = useState(saved.time)
  const [duration, setDuration] = useState<number>(musicTracks[saved.index].duration)
  const [volume, setVolume] = useState(saved.volume)
  const [muted, setMuted] = useState(saved.muted)
  const [playing, setPlaying] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [analysisAvailable, setAnalysisAvailable] = useState(true)

  useEffect(() => {
    const audio = audioRef.current
    if (!audio) return
    let disposed = false
    let currentIndex = saved.index
    let currentVolume = saved.volume
    let lastAudibleVolume = saved.volume > 0 ? saved.volume : 0.72
    let isMuted = saved.muted
    let pendingSeek: number | null = saved.time
    let request = 0
    let wantsPlayback = false
    let lastSaved = 0
    let context: AudioContext | null = null
    let source: MediaElementAudioSourceNode | null = null
    let gain: GainNode | null = null
    let analyser: AnalyserNode | null = null
    let frequency: Uint8Array<ArrayBuffer> | null = null
    let waveform: Float32Array<ArrayBuffer> | null = null
    let graphAttempted = false
    const cachedAudio = new Map<number, string>()
    let seekController: AbortController | null = null
    let seekRequest = 0

    const canSeek = (position: number) => {
      if (position === 0) return true
      for (let i = 0; i < audio.seekable.length; i++) {
        if (position >= audio.seekable.start(i) && position <= audio.seekable.end(i)) return true
      }
      return false
    }
    const cancelSeekLoad = () => {
      ++seekRequest
      seekController?.abort()
      seekController = null
    }
    const loadSeekableAudio = () => {
      if (seekController) return
      const controller = new AbortController()
      seekController = controller
      const id = ++seekRequest
      const targetIndex = currentIndex
      setLoading(wantsPlayback)
      // Some static hosts return 200 to Range requests. A local object URL
      // makes the original MP3 seekable without requiring a media server.
      void fetch(musicTracks[targetIndex].src, { signal: controller.signal })
        .then(response => {
          if (!response.ok) throw new Error('Audio request failed')
          return response.blob()
        })
        .then(blob => {
          if (disposed || id !== seekRequest) return
          if (!blob.size) throw new Error('Empty audio')
          const url = URL.createObjectURL(blob)
          const previous = cachedAudio.get(targetIndex)
          if (previous) URL.revokeObjectURL(previous)
          cachedAudio.set(targetIndex, url)
          audio.pause()
          audio.src = url
          audio.load()
          if (wantsPlayback) play()
          else setLoading(false)
        })
        .catch(() => {
          if (disposed || id !== seekRequest || controller.signal.aborted) return
          wantsPlayback = false
          audio.pause()
          setLoading(false)
          setPlaying(false)
          setError('音频加载未完成，请点击播放重试。')
        })
        .finally(() => { if (id === seekRequest) seekController = null })
    }

    const persist = () => {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify({
          index: currentIndex, time: pendingSeek ?? audio.currentTime,
          volume: currentVolume, muted: isMuted,
        }))
      } catch { /* Playback also works when storage is unavailable. */ }
    }
    const applyVolume = () => {
      const value = isMuted ? 0 : currentVolume
      if (gain && context) {
        audio.volume = 1
        gain.gain.setTargetAtTime(value, context.currentTime, 0.025)
      } else audio.volume = value
    }
    const connectGraph = () => {
      if (graphAttempted) return
      graphAttempted = true
      try {
        const Context = window.AudioContext ?? (window as typeof window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
        if (!Context) throw new Error('Web Audio unavailable')
        context = new Context()
        source = context.createMediaElementSource(audio)
        gain = context.createGain()
        analyser = context.createAnalyser()
        analyser.fftSize = 2048
        analyser.smoothingTimeConstant = 0.68
        source.connect(gain)
        gain.connect(analyser)
        analyser.connect(context.destination)
        frequency = new Uint8Array(analyser.frequencyBinCount)
        waveform = new Float32Array(analyser.fftSize)
        applyVolume()
      } catch {
        // A captured media element must retain a path to the speakers even
        // when analysis setup fails part-way through.
        source?.disconnect()
        gain?.disconnect()
        analyser?.disconnect()
        if (source && context) source.connect(context.destination)
        gain = null
        analyser = null
        setAnalysisAvailable(false)
        applyVolume()
      }
    }
    const play = () => {
      const id = ++request
      wantsPlayback = true
      setError('')
      setLoading(true)
      if (audio.error) {
        pendingSeek = audio.currentTime
        audio.load()
      }
      if (audio.ended) audio.currentTime = 0
      connectGraph()
      // Both calls occur inside the click gesture, including on mobile Safari.
      const resumed = context?.state === 'suspended' ? context.resume() : Promise.resolve()
      if (pendingSeek !== null && pendingSeek > 0 && audio.readyState >= 1 && !canSeek(pendingSeek)) {
        void resumed.catch(() => {})
        loadSeekableAudio()
        return
      }
      void Promise.all([resumed, audio.play()]).catch(() => {
        if (disposed || id !== request) return
        wantsPlayback = false
        audio.pause()
        setLoading(false)
        setPlaying(false)
        setError('暂时无法播放，请点击播放重试。')
      })
    }
    const pause = () => {
      ++request
      wantsPlayback = false
      audio.pause()
      setLoading(false)
      setPlaying(false)
      persist()
    }
    const select = (next: number, autoplay = true) => {
      if (!Number.isInteger(next) || next < 0 || next >= musicTracks.length) return
      if (next === currentIndex) {
        if (autoplay) wantsPlayback ? pause() : play()
        return
      }
      pause()
      cancelSeekLoad()
      currentIndex = next
      pendingSeek = 0
      setIndex(next)
      setTime(0)
      setDuration(musicTracks[next].duration)
      setError('')
      audio.src = cachedAudio.get(next) ?? musicTracks[next].src
      audio.load()
      persist()
      if (autoplay) play()
    }
    const onMetadata = () => {
      if (!Number.isFinite(audio.duration)) return
      setDuration(audio.duration)
      if (pendingSeek !== null) {
        const target = Math.min(pendingSeek, Math.max(0, audio.duration - 0.05))
        if (canSeek(target) || audio.src === cachedAudio.get(currentIndex)) {
          audio.currentTime = target
          pendingSeek = null
          setTime(target)
        } else loadSeekableAudio()
      }
    }
    const onTime = () => {
      setTime(pendingSeek ?? audio.currentTime)
      if (performance.now() - lastSaved > 3000) { persist(); lastSaved = performance.now() }
    }
    const onPlaying = () => {
      if (!wantsPlayback) { audio.pause(); return }
      setPlaying(true)
      setLoading(false)
      setError('')
    }
    const onPause = () => { setPlaying(false) }
    const onWaiting = () => { if (wantsPlayback) setLoading(true) }
    const onEnded = () => {
      wantsPlayback = false
      setPlaying(false)
      setLoading(false)
      setTime(audio.duration)
      persist()
    }
    const onError = () => {
      wantsPlayback = false
      setPlaying(false)
      setLoading(false)
      setError('音频加载失败，请点击播放重试。')
    }
    audio.addEventListener('loadedmetadata', onMetadata)
    audio.addEventListener('durationchange', onMetadata)
    audio.addEventListener('timeupdate', onTime)
    audio.addEventListener('playing', onPlaying)
    audio.addEventListener('pause', onPause)
    audio.addEventListener('waiting', onWaiting)
    audio.addEventListener('ended', onEnded)
    audio.addEventListener('error', onError)
    window.addEventListener('pagehide', persist)
    audio.src = musicTracks[currentIndex].src
    audio.load()
    applyVolume()

    const energy: AudioEnergy = { ...silence }
    actions.current = {
      toggle: () => wantsPlayback ? pause() : play(),
      select,
      skip: direction => select((currentIndex + direction + musicTracks.length) % musicTracks.length),
      seek: nextTime => {
        const length = Number.isFinite(audio.duration) ? audio.duration : musicTracks[currentIndex].duration
        const next = Math.min(length, Math.max(0, nextTime))
        pendingSeek = next
        if (!seekController && audio.readyState >= 1) {
          if (canSeek(next) || audio.src === cachedAudio.get(currentIndex)) {
            audio.currentTime = next
            pendingSeek = null
          } else loadSeekableAudio()
        }
        setTime(next)
        persist()
      },
      volume: value => {
        currentVolume = Math.max(0, Math.min(1, value))
        if (currentVolume > 0) lastAudibleVolume = currentVolume
        isMuted = false
        setVolume(currentVolume)
        setMuted(false)
        applyVolume()
        persist()
      },
      mute: () => {
        if (currentVolume === 0) {
          currentVolume = lastAudibleVolume
          isMuted = false
          setVolume(currentVolume)
        } else isMuted = !isMuted
        setMuted(isMuted)
        applyVolume()
        persist()
      },
      sample: () => {
        if (!analyser || !frequency || !waveform || !context || audio.paused || audio.ended) return silence
        analyser.getByteFrequencyData(frequency)
        analyser.getFloatTimeDomainData(waveform)
        const binWidth = context.sampleRate / analyser.fftSize
        const band = (from: number, to: number) => {
          const start = Math.max(1, Math.floor(from / binWidth))
          const end = Math.min(frequency!.length, Math.ceil(to / binWidth))
          let sum = 0
          for (let i = start; i < end; i++) sum += frequency![i] / 255
          return sum / Math.max(1, end - start)
        }
        let square = 0
        for (const sample of waveform) square += sample * sample
        energy.bass = band(35, 220)
        energy.mid = band(220, 2400)
        energy.high = band(2400, 10000)
        energy.level = Math.min(1, Math.sqrt(square / waveform.length) * 3.5)
        return energy
      },
    }
    return () => {
      persist()
      disposed = true
      cancelSeekLoad()
      ++request
      wantsPlayback = false
      actions.current = null
      audio.removeEventListener('loadedmetadata', onMetadata)
      audio.removeEventListener('durationchange', onMetadata)
      audio.removeEventListener('timeupdate', onTime)
      audio.removeEventListener('playing', onPlaying)
      audio.removeEventListener('pause', onPause)
      audio.removeEventListener('waiting', onWaiting)
      audio.removeEventListener('ended', onEnded)
      audio.removeEventListener('error', onError)
      window.removeEventListener('pagehide', persist)
      audio.pause()
      audio.removeAttribute('src')
      audio.load()
      cachedAudio.forEach(url => URL.revokeObjectURL(url))
      source?.disconnect()
      gain?.disconnect()
      analyser?.disconnect()
      if (context && context.state !== 'closed') void context.close().catch(() => {})
    }
  }, [saved])

  return {
    audioRef, index, track: musicTracks[index], time, duration, volume, muted, playing, loading, error, analysisAvailable,
    toggle: useCallback(() => actions.current?.toggle(), []),
    select: useCallback((next: number, autoplay = true) => actions.current?.select(next, autoplay), []),
    skip: useCallback((direction: number) => actions.current?.skip(direction), []),
    seek: useCallback((next: number) => actions.current?.seek(next), []),
    setVolume: useCallback((value: number) => actions.current?.volume(value), []),
    toggleMute: useCallback(() => actions.current?.mute(), []),
    sample: useCallback(() => actions.current?.sample() ?? silence, []),
  }
}

export type MusicPlayer = ReturnType<typeof useMusicPlayer>
