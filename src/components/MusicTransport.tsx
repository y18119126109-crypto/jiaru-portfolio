import { useId, useRef } from 'react'
import { Icon } from './Icon'
import { formatTime } from '../data/music'
import waveforms from '../data/music-waveforms.json'
import type { MusicPlayer } from '../hooks/useMusicPlayer'

export function MusicTransport({ player }: { player: MusicPlayer }) {
  const clip = useId().replace(/:/g, '')
  const volumePanel = useRef<HTMLDetailsElement>(null)
  const { track, playing, loading, time, duration, muted, volume } = player
  const peaks = waveforms[track.id]
  const progress = duration ? Math.min(1, time / duration) : 0
  return (
    <section className={`music-transport glass transport-${track.tone}`} aria-label="音乐播放器">
      <div className="transport-track">
        <div className={`music-thumbnail thumbnail-${track.tone}`} aria-hidden="true"><i /><span>{track.number}</span></div>
        <div><p>{track.title}</p><span>{loading ? '正在载入…' : playing ? '正在播放' : '等待聆听'} <i>·</i> {track.language}</span></div>
      </div>
      <div className="transport-buttons">
        <button className="transport-skip" onClick={() => player.skip(-1)} aria-label="上一首"><Icon name="previous" size={16} /></button>
        <button className="transport-play" onClick={player.toggle} aria-label={loading ? '取消加载' : playing ? '暂停音乐' : '播放音乐'} aria-busy={loading}>
          {loading ? <span className="music-spinner" /> : <Icon name={playing ? 'pause' : 'play'} size={18} />}
        </button>
        <button className="transport-skip" onClick={() => player.skip(1)} aria-label="下一首"><Icon name="next" size={16} /></button>
      </div>
      <div className="transport-timeline">
        <span className="music-time">{formatTime(time)}</span>
        <div className="music-waveform">
          <svg viewBox="0 0 600 40" preserveAspectRatio="none" aria-hidden="true">
            <defs><clipPath id={clip}><rect width={progress * 600} height="40" /></clipPath></defs>
            <g fill="currentColor">{peaks.map((peak, i) => <rect key={i} x={i * 5} y={20 - Math.max(2, peak * 17)} width="2.4" height={Math.max(4, peak * 34)} rx="0.7" />)}</g>
            <g className="waveform-played" clipPath={`url(#${clip})`}>{peaks.map((peak, i) => <rect key={i} x={i * 5} y={20 - Math.max(2, peak * 17)} width="2.4" height={Math.max(4, peak * 34)} rx="0.7" />)}</g>
            <line x1={progress * 598 + 1} x2={progress * 598 + 1} y1="2" y2="38" className="waveform-cursor" />
          </svg>
          <input type="range" aria-label="播放进度" min="0" max={duration} step="0.1" value={Math.min(time, duration)} onChange={event => player.seek(Number(event.target.value))} aria-valuetext={`${formatTime(time)} / ${formatTime(duration)}`} />
        </div>
        <span className="music-time">{formatTime(duration)}</span>
      </div>
      <div className="transport-volume">
        <button onClick={player.toggleMute} aria-label={muted || volume === 0 ? '取消静音' : '静音'} aria-pressed={muted || volume === 0}><Icon name={muted || volume === 0 ? 'mute' : 'volume'} size={17} /></button>
        <input type="range" aria-label="音量" min="0" max="1" step="0.01" value={muted ? 0 : volume} onChange={event => player.setVolume(Number(event.target.value))} aria-valuetext={`${Math.round((muted ? 0 : volume) * 100)}%`} />
      </div>
      <details className="mobile-volume" ref={volumePanel}
        onBlur={event => { if (!event.currentTarget.contains(event.relatedTarget)) event.currentTarget.open = false }}
        onKeyDown={event => { if (event.key === 'Escape') { event.currentTarget.open = false; event.currentTarget.querySelector('summary')?.focus() } }}>
        <summary aria-label="音量设置"><Icon name={muted || volume === 0 ? 'mute' : 'volume'} size={17} /></summary>
        <div className="volume-panel glass">
          <span>聆听音量 <span>{Math.round((muted ? 0 : volume) * 100)}%</span></span>
          <div><button onClick={player.toggleMute} aria-label={muted || volume === 0 ? '取消静音' : '静音'} aria-pressed={muted || volume === 0}><Icon name={muted || volume === 0 ? 'mute' : 'volume'} size={16} /></button>
            <input type="range" aria-label="音量" min="0" max="1" step="0.01" value={muted ? 0 : volume} onChange={event => player.setVolume(Number(event.target.value))} aria-valuetext={`${Math.round((muted ? 0 : volume) * 100)}%`} /></div>
          <button className="volume-panel-close" aria-label="关闭音量设置" onClick={() => { if (volumePanel.current) volumePanel.current.open = false }}><Icon name="close" size={12} /></button>
        </div>
      </details>
      {player.error && <p className="music-player-error" role="alert">{player.error}</p>}
    </section>
  )
}
