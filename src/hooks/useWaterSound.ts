import { useCallback, useEffect, useRef, useState } from 'react'

type SoundState = 'off' | 'loading' | 'on' | 'unavailable'

interface WaterAudio {
  context: AudioContext
  source: AudioBufferSourceNode | null
  master: GainNode
  controller: AbortController
  suspendTimer: number
}

const STREAM_URL = '/audio/woodland-stream.mp3'

function createWaterAudio(): WaterAudio {
  const context = new AudioContext()
  try {
    const master = context.createGain()
    master.gain.value = 0
    master.connect(context.destination)
    return { context, source: null, master, controller: new AbortController(), suspendTimer: 0 }
  } catch (error) {
    void context.close().catch(() => {})
    throw error
  }
}

async function loadStream(current: WaterAudio) {
  const response = await fetch(STREAM_URL, { signal: current.controller.signal })
  if (!response.ok) throw new Error('Stream recording could not be loaded')
  const buffer = await current.context.decodeAudioData(await response.arrayBuffer())
  if (current.controller.signal.aborted) return
  const source = current.context.createBufferSource()
  source.buffer = buffer
  source.loop = true
  source.connect(current.master)
  // The file already has a crossfaded loop. Keep its stereo image and original
  // playback rate; pointer motion only gently raises its level.
  source.start()
  current.source = source
}

function flow(current: WaterAudio, level = 0.22) {
  const time = current.context.currentTime
  const gain = current.master.gain
  gain.cancelAndHoldAtTime(time)
  gain.setTargetAtTime(level, time, 0.28)
  gain.setTargetAtTime(0, time + 0.65, 0.55)
}

function disposeAudio(current: WaterAudio) {
  current.controller.abort()
  window.clearTimeout(current.suspendTimer)
  current.source?.stop()
  current.source?.disconnect()
  current.master.disconnect()
  void current.context.close().catch(() => {})
}

export function useWaterSound() {
  const [state, setState] = useState<SoundState>('off')
  const audio = useRef<WaterAudio | null>(null)
  const enabled = useRef(false)
  const toggling = useRef(false)

  const toggle = useCallback(async () => {
    if (toggling.current) return
    toggling.current = true
    let current = audio.current
    try {
      if (enabled.current && current) {
        enabled.current = false
        setState('off')
        const time = current.context.currentTime
        current.master.gain.cancelAndHoldAtTime(time)
        current.master.gain.linearRampToValueAtTime(0, time + 0.2)
        const closing = current
        closing.suspendTimer = window.setTimeout(() => {
          if (!enabled.current && audio.current === closing) void closing.context.suspend().catch(() => {})
        }, 230)
      } else {
        // Resume synchronously from this click, before awaiting the recording,
        // so Safari and other gesture-gated browsers can unlock audio.
        current = current ?? createWaterAudio()
        audio.current = current
        window.clearTimeout(current.suspendTimer)
        const resumed = current.context.resume()
        setState('loading')
        await resumed
        if (audio.current !== current) return
        if (!current.source) await loadStream(current)
        if (audio.current !== current || current.controller.signal.aborted) return
        enabled.current = true
        setState('on')
        // Give the enable gesture a soft preview, then let pointer motion carry
        // the same continuous recording rather than retriggering short clips.
        if (!document.hidden) flow(current)
        else await current.context.suspend()
      }
    } catch {
      if (current && audio.current !== current) return
      enabled.current = false
      if (current) disposeAudio(current)
      audio.current = null
      setState('unavailable')
    } finally {
      toggling.current = false
    }
  }, [])

  useEffect(() => {
    let lastX = -1
    let lastY = -1
    let lastTime = 0
    let lastEnvelope = 0

    const move = (event: PointerEvent) => {
      const current = audio.current
      if (!enabled.current || !current || document.hidden || current.context.state !== 'running') return
      if (event.type === 'pointermove' && event.pointerType === 'touch') return
      const now = performance.now()
      if (event.type === 'pointermove' && now - lastEnvelope < 60) return
      const distance = lastX < 0 ? 0 : Math.hypot(event.clientX - lastX, event.clientY - lastY)
      const speed = Math.min(1, distance / Math.max(16, now - lastTime))
      lastX = event.clientX
      lastY = event.clientY
      lastTime = now
      lastEnvelope = now
      flow(current, 0.20 + speed * 0.035)
    }
    const silence = (immediate = false) => {
      lastX = -1
      const current = audio.current
      if (!current) return
      const time = current.context.currentTime
      current.master.gain.cancelAndHoldAtTime(time)
      if (immediate) current.master.gain.setValueAtTime(0, time)
      else current.master.gain.setTargetAtTime(0, time, 0.18)
    }
    const leave = () => silence()
    const visibility = async () => {
      const current = audio.current
      if (!current) return
      silence(true)
      try {
        if (document.hidden) await current.context.suspend()
        else if (enabled.current) await current.context.resume()
      } catch {
        if (audio.current === current) {
          enabled.current = false
          disposeAudio(current)
          audio.current = null
          setState('unavailable')
        }
      }
    }
    window.addEventListener('pointermove', move, { passive: true })
    window.addEventListener('pointerdown', move, { passive: true })
    window.addEventListener('blur', leave)
    document.documentElement.addEventListener('pointerleave', leave)
    document.addEventListener('visibilitychange', visibility)
    return () => {
      window.removeEventListener('pointermove', move)
      window.removeEventListener('pointerdown', move)
      window.removeEventListener('blur', leave)
      document.documentElement.removeEventListener('pointerleave', leave)
      document.removeEventListener('visibilitychange', visibility)
      enabled.current = false
      const current = audio.current
      audio.current = null
      if (current) disposeAudio(current)
    }
  }, [])

  return { soundState: state, toggleSound: toggle }
}
