import { lazy, Suspense, useEffect, useMemo, useRef, useState, type CSSProperties } from 'react'
import { motion } from 'framer-motion'
import { useSearchParams } from 'react-router-dom'
import { BotanicalMark } from '../components/BotanicalMark'
import { Icon } from '../components/Icon'
import { PreparedLink as Link } from '../components/PreparedNavigation'
import {
  playlists, playlistDuration, searchTracks, trackDuration, type Playlist, type PlaylistTrack,
} from '../data/playlists'
import './playlists.css'

const PlaylistFlower = lazy(() => import('../components/PlaylistFlower').then(module => ({ default: module.PlaylistFlower })))
const portfolioUrl = 'https://dcnpzhkntn0i.feishu.cn/wiki/Zvi4wqfH1ioarokfzKNc35E0nKh'
const previewCount = 8
let playlistSearchLoader: Promise<typeof import('../data/playlistSearch')> | null = null

function loadPlaylistSearch() {
  playlistSearchLoader ??= import('../data/playlistSearch')
  return playlistSearchLoader
}

function themeStyle(playlist: Playlist): CSSProperties {
  return { '--playlist-accent': playlist.theme.color, '--playlist-soft': playlist.theme.soft } as CSSProperties
}

function FlowerLoading() {
  return <div className="playlist-flower flower-loading" role="status"><BotanicalMark /><span>花朵正在舒展…</span></div>
}

function TrackList({ playlist }: { playlist: Playlist }) {
  const [input, setInput] = useState('')
  const [query, setQuery] = useState('')
  const [expanded, setExpanded] = useState(false)
  const composing = useRef(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const listRef = useRef<HTMLDivElement>(null)
  const directMatches = useMemo(() => searchTracks(playlist, query), [playlist, query])
  const searchKey = `${playlist.id}:${query}`
  const needsPinyin = /[a-z]/iu.test(query)
  const [pinyinResult, setPinyinResult] = useState<{ key: string; tracks: PlaylistTrack[]; unavailable?: boolean } | null>(null)
  useEffect(() => {
    if (!needsPinyin) return
    let current = true
    loadPlaylistSearch()
      .then(module => {
        if (current) setPinyinResult({ key: searchKey, tracks: module.searchTracksWithPinyin(playlist, query) })
      })
      .catch(() => {
        if (current) setPinyinResult({ key: searchKey, tracks: [], unavailable: true })
      })
    return () => { current = false }
  }, [needsPinyin, playlist, query, searchKey])
  const currentPinyin = pinyinResult?.key === searchKey ? pinyinResult : null
  const matches = useMemo(() => {
    if (!currentPinyin?.tracks.length) return directMatches
    const directIds = new Set(directMatches.map(track => track.id))
    return [...directMatches, ...currentPinyin.tracks.filter(track => !directIds.has(track.id))]
  }, [currentPinyin, directMatches])
  const searching = query.trim().length > 0
  const pinyinPending = needsPinyin && !currentPinyin
  const shown = searching || expanded ? matches : matches.slice(0, previewCount)
  const clear = () => { setInput(''); setQuery(''); inputRef.current?.focus() }
  return (
    <div className="playlist-tracks" ref={listRef}>
      <div className="playlist-list-heading">
        <div><h3>曲目花笺 <span>TRACKLIST</span></h3><p role="status">{pinyinPending ? '正在准备拼音搜索…' : currentPinyin?.unavailable ? '拼音搜索暂时不可用，可输入歌名或歌手' : searching ? `找到 ${matches.length} 首 · 共 ${playlist.count} 首` : `${playlist.count} 首歌曲 · ${playlistDuration(playlist.duration)}`}</p></div>
        <div className="playlist-search">
          <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true"><circle cx="10.5" cy="10.5" r="6" /><path d="m15 15 5 5" /></svg>
          <input ref={inputRef} type="search" aria-label="搜索当前歌单" placeholder="歌名、歌手、专辑 / 拼音" value={input}
            onFocus={() => { void loadPlaylistSearch().catch(() => {}) }}
            onCompositionStart={() => { composing.current = true }}
            onCompositionEnd={event => { composing.current = false; setQuery(event.currentTarget.value) }}
            onChange={event => { setInput(event.target.value); if (!composing.current) setQuery(event.target.value) }}
            onKeyDown={event => { if (event.key === 'Escape' && !event.nativeEvent.isComposing) clear() }}
          />
          {input && <button aria-label="清除搜索" onClick={clear}><Icon name="close" size={13} /></button>}
        </div>
      </div>
      <p className="playlist-search-hint">在这份歌单里寻找旋律；多个关键词用空格分隔。</p>
      <table className="playlist-table">
        <caption className="sr-only">{playlist.title} · {playlist.platformName}完整曲目</caption>
        <thead><tr><th scope="col">#</th><th scope="col">歌曲 / 歌手</th><th scope="col" className="playlist-album">专辑</th><th scope="col" className="playlist-time">时长</th><th scope="col"><span className="sr-only">原平台链接</span><Icon name="diagonal" size={12} /></th></tr></thead>
        <tbody>
          {shown.map(track => (
            <tr key={track.id} data-track-id={track.id}>
              <td className="playlist-track-number">{String(playlist.tracks.indexOf(track) + 1).padStart(2, '0')}</td>
              <td className="playlist-track-title"><a href={track.url} target="_blank" rel="noreferrer" aria-label={`在${playlist.platformName}打开 ${track.title}`}><strong>{track.title}</strong></a><span>{track.artists.join(' / ')}</span>{track.album && <span className="playlist-mobile-album">{track.album}</span>}</td>
              <td className="playlist-album">{track.album || '—'}</td>
              <td className="playlist-time">{trackDuration(track.duration)}</td>
              <td><a className="playlist-song-link" href={track.url} target="_blank" rel="noreferrer" aria-label={`前往${playlist.platformName}聆听 ${track.title}`}><Icon name="diagonal" size={14} /></a></td>
            </tr>
          ))}
        </tbody>
      </table>
      {!pinyinPending && !matches.length && <div className="playlist-empty"><BotanicalMark variant={2} /><h4>这朵花里，还没有这段旋律。</h4><p>试试其他歌名、歌手或拼音。</p><button onClick={clear}>清除搜索，看看全部歌曲<Icon name="arrow" size={13} /></button></div>}
      {!searching && <div className="playlist-list-footer"><span>已展示 {shown.length} / {playlist.count} 首</span><button aria-expanded={expanded} onClick={() => {
        if (expanded) listRef.current?.scrollIntoView({ block: 'start', behavior: 'instant' })
        setExpanded(value => !value)
      }}>{expanded ? '收起曲目' : `展开全部 ${playlist.count} 首`}<Icon name="down" size={13} className={expanded ? 'is-up' : ''} /></button></div>}
      <p className="playlist-source-note">曲目更新于 {playlist.verifiedAt.replaceAll('-', '.')} · 点击歌曲在{playlist.platformName}聆听</p>
    </div>
  )
}

export function PlaylistsPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const playlist = playlists.find(item => item.id === searchParams.get('list')) ?? playlists[0]
  const total = playlists.reduce((sum, item) => sum + item.count, 0)
  useEffect(() => {
    document.title = '精选歌单 · 周珈如 — JIARU'
    window.scrollTo({ top: 0, behavior: 'instant' })
    return () => { document.title = 'JIARU — 让热爱有回响' }
  }, [])
  return (
    <div className="playlists-page" style={themeStyle(playlist)}>
      <div className="playlist-breadcrumb"><Link to="/">首页</Link><span>/</span><span>个人精选歌单</span><span className="playlist-archive">THE LISTENING GARDEN <i /> 04</span></div>
      <section className="playlist-hero" aria-labelledby="playlists-heading">
        <motion.div className="playlist-intro" initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7 }}>
          <span className="playlist-eyebrow"><span className="tiny-line" /> MUSIC, IN FULL BLOOM</span>
          <h1 id="playlists-heading">把喜欢的旋律，<br />种成<span>一座花园</span>。</h1>
          <p className="playlist-english">A little garden of sounds.</p>
          <p className="playlist-hero-description">有些歌陪你熬过长夜，有些歌把青春轻轻唤回。<br />把不同心境收进歌单，等一个恰好想听的你。</p>
          <a className="playlist-explore primary-button" href="#playlists-content">走进音乐花园<Icon name="down" size={14} /></a>
          <div className="playlist-hero-meta"><span><strong>05</strong> 份主题歌单</span><i /><span>网易云音乐 × QQ 音乐</span></div>
        </motion.div>
        <div className="playlist-art"><Suspense fallback={<FlowerLoading />}><PlaylistFlower theme={playlist.theme} /></Suspense></div>
      </section>

      <section id="playlists-content" className="playlist-garden" tabIndex={-1} aria-labelledby="garden-heading">
        <header className="playlist-garden-heading"><div><span>CHOOSE A FEELING</span><h2 id="garden-heading">今天，想听哪一种心情？</h2></div><p>周珈如策划 <span> / </span> {total} 条音乐收录</p></header>
        <div className="playlist-cards" role="group" aria-label="选择主题歌单">
          {playlists.map(item => (
            <button key={item.id} className={`playlist-card glass ${item.id === playlist.id ? 'is-selected' : ''}`} style={themeStyle(item)}
              aria-pressed={item.id === playlist.id} aria-controls="selected-playlist" aria-label={`${item.theme.name}，${item.platformName}，${item.count}首`}
              onClick={() => {
                const next = new URLSearchParams(searchParams)
                next.set('list', item.id)
                setSearchParams(next, { preventScrollReset: true })
              }}>
              <span className="playlist-card-top"><span>FLOWER {item.number}</span><span className="playlist-selected-dot" /></span>
              <span className="playlist-card-art"><BotanicalMark variant={Number(item.number)} /><i>{item.theme.english}</i></span>
              <strong>{item.theme.name}</strong><span className="playlist-card-subtitle">{item.theme.subtitle}</span>
              <span className="playlist-card-bottom"><span><i className={`platform-dot platform-${item.platform}`} />{item.platformName}</span><span>{item.count} 首<Icon name="arrow" size={12} /></span></span>
            </button>
          ))}
        </div>

        <div id="selected-playlist" className="playlist-detail" data-playlist-id={playlist.id}>
          <aside className="playlist-curation">
            <span className="playlist-detail-number">{playlist.number}<span> / THE COLLECTION</span></span>
            <span className="playlist-category">{playlist.theme.category}</span>
            <h2>{playlist.theme.name}<span>{playlist.theme.subtitle}</span></h2>
            <blockquote>{playlist.description.replace(/^[“”]|[“”]$/g, '')}</blockquote>
            <div className="playlist-tags">{playlist.theme.tags.map(tag => <span key={tag}>{tag}</span>)}</div>
            <div className="playlist-curator-note"><h3><Icon name="spark" size={13} />策划手记</h3><p>{playlist.theme.note}</p></div>
            <a className="playlist-platform-link glass" href={playlist.url} target="_blank" rel="noreferrer">在{playlist.platformName}打开歌单<Icon name="diagonal" size={14} /></a>
            <p className="playlist-original-title">原歌单：{playlist.title}</p>
          </aside>
          <TrackList key={playlist.id} playlist={playlist} />
        </div>
      </section>
      <div className="playlist-closing"><p>愿每一次偶然听见，<span>都像花开。</span></p><div><a href={portfolioUrl} target="_blank" rel="noreferrer">完整音乐内容作品集<Icon name="diagonal" size={14} /></a><Link to="/music">听听我的 AI 音乐<Icon name="arrow" size={14} /></Link></div></div>
    </div>
  )
}
