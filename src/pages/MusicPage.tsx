import { lazy, Suspense, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Icon } from '../components/Icon'
import { MusicTransport } from '../components/MusicTransport'
import { PreparedLink as Link } from '../components/PreparedNavigation'
import { useMusicPlayer } from '../hooks/useMusicPlayer'
import { formatTime, musicPortfolioUrl, musicTracks, type MusicTrack } from '../data/music'
import './music.css'

const MusicParticles = lazy(() => import('../components/MusicParticles').then(module => ({ default: module.MusicParticles })))

function SongStory({ track, active, playing, onPlay }: {
  track: MusicTrack; active: boolean; playing: boolean; onPlay: () => void
}) {
  return (
    <article id={track.id} className={`song-story song-${track.tone}`} aria-labelledby={`${track.id}-title`}>
      <header className="song-story-heading">
        <div className="song-story-title"><span className="song-large-number">{track.number}</span><div><span className="song-overline">{track.genre} <i> / </i> {track.language}</span><h3 id={`${track.id}-title`}>{track.title}</h3><p>{track.subtitle}</p></div></div>
        <div className="song-story-actions">
          <button className="song-listen glass" onClick={onPlay} aria-label={`${active && playing ? '暂停' : '播放'} ${track.title}`}><Icon name={active && playing ? 'pause' : 'play'} size={13} />{active && playing ? '正在聆听' : '聆听这首歌'}</button>
          <a href={track.suno} target="_blank" rel="noreferrer">在 Suno 打开<Icon name="diagonal" size={12} /></a>
        </div>
      </header>
      <div className="song-creation-grid">
        <section className="song-concept" aria-label={`${track.title} 创作理念`}>
          <h4 className="song-part-heading"><span>01 /</span> 创作理念 <i>THE FEELING</i></h4>
          <blockquote><span aria-hidden="true">“</span>{track.quote}<footer>{track.quoteNote}</footer></blockquote>
          <div className="song-concept-copy">{track.concept.map(text => <p key={text}>{text}</p>)}</div>
          <div className="song-mood"><span className="tiny-line" />{track.mood}</div>
        </section>
        <section className="song-process glass" aria-label={`${track.title} 创作流程`}>
          <h4 className="song-part-heading"><span>02 /</span> 创作流程 <i>THE MAKING</i></h4>
          <ol>{track.process.map((step, index) => <li key={step.title}><span>{String(index + 1).padStart(2, '0')}</span><div><h5>{step.title}</h5><p>{step.text}</p></div></li>)}</ol>
          <div className="song-prompt"><span><Icon name="spark" size={12} />风格提示词<span>SUNO</span></span><p>{track.prompt}</p></div>
        </section>
      </div>
      <section className="song-operation glass" aria-label={`${track.title} 运营延伸`}>
        <div className="operation-intro"><h4 className="song-part-heading"><span>03 /</span> 运营延伸 <em>运营构想</em></h4><h5>{track.operation.title}</h5><p>{track.operation.intro}</p><span className="operation-tag">{track.operation.tag}<Icon name="diagonal" size={13} /></span></div>
        <div className="operation-ideas">{track.operation.ideas.map((idea, index) => <div key={idea.label}><span>{String(index + 1).padStart(2, '0')}</span><h6>{idea.label}</h6><p>{idea.text}</p></div>)}</div>
      </section>
    </article>
  )
}

export function MusicPage() {
  const player = useMusicPlayer()
  useEffect(() => {
    document.title = 'AI 音乐创作 · 周珈如 — JIARU'
    const hash = window.location.hash.slice(1)
    if (musicTracks.some(track => track.id === hash)) document.getElementById(hash)?.scrollIntoView()
    else window.scrollTo({ top: 0, behavior: 'instant' })
    return () => { document.title = 'JIARU — 让热爱有回响' }
  }, [])

  return (
    <div className="music-page">
      <audio ref={player.audioRef} preload="metadata" aria-hidden="true" />
      <div className="music-breadcrumb"><Link to="/">首页</Link><span>/</span><span>AI 音乐创作</span><span className="music-archive">THE SOUND ARCHIVE <i /> 02</span></div>
      <section className="music-hero" aria-labelledby="music-heading">
        <motion.div className="music-intro" initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7 }}>
          <span className="music-eyebrow"><span className="tiny-line" /> AI MUSIC · HUMAN FEELINGS</span>
          <h1 id="music-heading">让心事，<br /><span>有声可循</span>。</h1>
          <p className="music-hero-english">Little stories. Lasting echoes.</p>
          <p className="music-hero-description">用 AI 探索声音的可能，用音乐安放真实的情绪。<br />两首歌，两种心境，邀你听听故事的另一面。</p>
          <div className="music-track-list" aria-label="选择作品">
            {musicTracks.map((track, index) => (
              <button key={track.id} className={`music-track-row ${player.index === index ? 'is-selected' : ''}`} onClick={() => player.select(index)} aria-label={`${player.index === index && player.playing ? '暂停' : '播放'} ${track.title}`} aria-pressed={player.index === index}>
                <span className={`track-row-number row-${track.tone}`}>{track.number}</span>
                <span className="track-row-name"><strong>{track.title}</strong><span>{track.genre}<i> / </i>{track.language}</span></span>
                <span className="track-row-time">{formatTime(track.duration)}</span>
                <span className="track-row-play"><Icon name={player.index === index && player.playing ? 'pause' : 'play'} size={12} /></span>
              </button>
            ))}
          </div>
          <a className="music-story-anchor" href={`#${player.track.id}`}>听着歌，读读它的诞生<Icon name="down" size={13} /></a>
        </motion.div>
        <div className="music-art">
          <Suspense fallback={<div className="particle-loading">声音正在汇聚…</div>}>
            <MusicParticles sample={player.sample} tone={player.track.tone} playing={player.playing} analysisAvailable={player.analysisAvailable} />
          </Suspense>
        </div>
      </section>

      <MusicTransport player={player} />

      <section className="music-stories" id="music-content" tabIndex={-1} aria-labelledby="music-stories-title">
        <header className="music-stories-heading"><div><span>BEHIND THE MUSIC</span><h2 id="music-stories-title">从一个念头，到一首歌。</h2></div><p>词 · 曲 · 编 · 唱<span>SUNO × 周珈如</span></p></header>
        {musicTracks.map((track, index) => <SongStory key={track.id} track={track} active={player.index === index} playing={player.playing} onPlay={() => player.select(index)} />)}
      </section>
      <div className="music-closing"><span>声音停下了，回响还在。</span><div><a href={musicPortfolioUrl} target="_blank" rel="noreferrer">完整音乐内容作品集<Icon name="diagonal" size={14} /></a><Link to="/">回到首页<Icon name="arrow" size={14} /></Link></div></div>
    </div>
  )
}
