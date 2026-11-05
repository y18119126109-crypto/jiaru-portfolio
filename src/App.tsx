import { lazy, Suspense, useCallback, useEffect, useState } from 'react'
import { useLocation } from 'react-router-dom'
import { Navbar } from './components/Navbar'
import { PageLoading } from './components/PreparedNavigation'
import { HeroSection } from './components/HeroSection'
import { ExploreGrid } from './components/ExploreGrid'
import { StatsBar } from './components/StatsBar'
import { SectionPreview } from './components/SectionPreview'
import { ContactOrb } from './components/ContactOrb'
import { OpeningIntro } from './components/OpeningIntro'
import { sections } from './data/site'
import {
  loadMusicPage, loadPlaylistsPage, loadProductsPage, loadResumePage,
} from './pageLoaders'
import { parseSiteRoute } from './siteRouting'

const ResumePage = lazy(() => loadResumePage().then(module => ({ default: module.ResumePage })))
const MusicPage = lazy(() => loadMusicPage().then(module => ({ default: module.MusicPage })))
const PlaylistsPage = lazy(() => loadPlaylistsPage().then(module => ({ default: module.PlaylistsPage })))
const ProductsPage = lazy(() => loadProductsPage().then(module => ({ default: module.ProductsPage })))

const initialRoute = typeof window === 'undefined' ? null : parseSiteRoute(window.location.pathname)
const initialHomeScope = initialRoute?.isKnownPage && initialRoute.pagePath === '/'
  ? initialRoute.variant ?? 'default'
  : null

function openingIntroKey(scope: string) {
  return `jiaru-home-opening:v1:${scope}`
}

function introWasSeen(key: string) {
  try {
    return sessionStorage.getItem(key) === 'seen'
  } catch {
    return false
  }
}

export default function App() {
  const { pathname } = useLocation()
  const route = parseSiteRoute(pathname)
  const section = sections.find(item => item.path === route.pagePath)
  const isHome = route.isKnownPage && route.pagePath === '/'
  const isResume = route.isKnownPage && route.pagePath === '/resume'
  const isMusic = route.isKnownPage && route.pagePath === '/music'
  const isPlaylists = route.isKnownPage && route.pagePath === '/playlists'
  const isProducts = route.isKnownPage && route.pagePath === '/products'
  const introScope = route.variant ?? 'default'
  const introKey = openingIntroKey(introScope)
  const [completedIntros, setCompletedIntros] = useState<Set<string>>(() => new Set())
  const introVisible = isHome
    && initialHomeScope === introScope
    && !completedIntros.has(introKey)
    && !introWasSeen(introKey)
  const completeIntro = useCallback(() => {
    try { sessionStorage.setItem(introKey, 'seen') } catch { /* The in-memory flag still prevents a repeat. */ }
    setCompletedIntros(current => {
      if (current.has(introKey)) return current
      const next = new Set(current)
      next.add(introKey)
      return next
    })
  }, [introKey])
  useEffect(() => {
    const loader = document.getElementById('boot-loader')
    if (!loader) return
    const frame = requestAnimationFrame(() => {
      loader.classList.add('is-ready')
      // #region debug-point E:boot-hidden
      fetch('http://127.0.0.1:7777/event', { method: 'POST', body: JSON.stringify({ sessionId: 'mobile-home-white-screen', runId: 'iteration-2-post-fix', hypothesisId: 'E', location: 'src/App.tsx:boot-effect', msg: '[DEBUG] React hid boot loader', data: { now: performance.now(), paints: performance.getEntriesByType('paint').map(entry => ({ name: entry.name, startTime: entry.startTime })), heroPresent: Boolean(document.querySelector('.hero')) }, ts: Date.now() }) }).catch(() => {})
      // #endregion
    })
    const timer = window.setTimeout(() => loader.remove(), 380)
    return () => {
      cancelAnimationFrame(frame)
      window.clearTimeout(timer)
    }
  }, [])
  useEffect(() => {
    if (isHome) window.scrollTo({ top: 0, behavior: 'instant' })
  }, [isHome, pathname])
  useEffect(() => {
    if (!isHome) return
    // #region debug-point B:playlist-preload-absent
    const timer = window.setTimeout(() => {
      const playlistResources = performance.getEntriesByType('resource')
        .map(entry => entry.name)
        .filter(name => /PlaylistsPage|PlaylistFlower|playlistSearch|pinyin/i.test(name))
      fetch('http://127.0.0.1:7777/event', { method: 'POST', body: JSON.stringify({ sessionId: 'mobile-home-white-screen', runId: 'iteration-2-post-fix', hypothesisId: 'B', location: 'src/App.tsx:idle-observation', msg: '[DEBUG] Checked for automatic playlist resources', data: { now: performance.now(), homepageReady: Boolean(document.querySelector('.particle-ribbon.is-ready')), playlistResources }, ts: Date.now() }) }).catch(() => {})
    }, 1800)
    return () => window.clearTimeout(timer)
    // #endregion
  }, [isHome, pathname])
  useEffect(() => {
    if (!isHome) return
    // #region debug-point G:H:I:J:performance-snapshot
    const timer = window.setTimeout(() => {
      const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming | undefined
      const heroRect = document.querySelector('.hero')?.getBoundingClientRect()
      const resources = performance.getEntriesByType('resource')
        .filter(entry => /\.(?:css|js)(?:$|\?)/u.test(entry.name))
        .map(entry => ({ name: entry.name.replace(location.origin, ''), startTime: entry.startTime, duration: entry.duration, transferSize: (entry as PerformanceResourceTiming).transferSize }))
      fetch('http://127.0.0.1:7777/event', { method: 'POST', body: JSON.stringify({ sessionId: 'mobile-home-white-screen', runId: 'iteration-2-post-fix', hypothesisId: 'G,H,I,J', location: 'src/App.tsx:performance-snapshot', msg: '[DEBUG] Captured homepage performance snapshot', data: { now: performance.now(), domInteractive: navigation?.domInteractive, domComplete: navigation?.domComplete, paints: performance.getEntriesByType('paint').map(entry => ({ name: entry.name, startTime: entry.startTime })), lcp: performance.getEntriesByType('largest-contentful-paint').map(entry => ({ startTime: entry.startTime, size: (entry as PerformanceEntry & { size?: number }).size })), longTasks: performance.getEntriesByType('longtask').map(entry => ({ startTime: entry.startTime, duration: entry.duration })), resources, domNodes: document.querySelectorAll('*').length, animations: document.getAnimations().length, heroRect: heroRect ? { width: heroRect.width, height: heroRect.height, top: heroRect.top } : null, particleReady: Boolean(document.querySelector('.particle-ribbon.is-ready')), reducedMotion: matchMedia('(prefers-reduced-motion: reduce)').matches, hardwareConcurrency: navigator.hardwareConcurrency, deviceMemory: (navigator as Navigator & { deviceMemory?: number }).deviceMemory }, ts: Date.now() }) }).catch(() => {})
    }, 4000)
    return () => window.clearTimeout(timer)
    // #endregion
  }, [isHome, pathname])
  return (
    <>
      <div className={isProducts ? 'products-theme' : undefined} inert={introVisible || undefined} aria-hidden={introVisible || undefined}>
        <a className="skip-link" href={isResume ? '#resume-content' : isMusic ? '#music-content' : isPlaylists ? '#playlists-content' : isProducts ? '#products-content' : '#explore'}>{isResume ? '跳至简历正文' : isMusic ? '跳至创作故事' : isPlaylists ? '跳至精选歌单' : isProducts ? '跳至产品作品' : '跳至内容导览'}</a>
        <div className="page-atmosphere" aria-hidden="true" />
        <div className="site-shell">
          <Navbar />
          <main id="main-content">
            {isResume ? (
              <Suspense fallback={<PageLoading label="正在展开履历…" />}><ResumePage variant={route.variant} /></Suspense>
            ) : isMusic ? (
              <Suspense fallback={<PageLoading label="声音正在汇聚…" />}><MusicPage /></Suspense>
            ) : isPlaylists ? (
              <Suspense fallback={<PageLoading label="音乐花园正在盛开…" />}><PlaylistsPage /></Suspense>
            ) : isProducts ? (
              <Suspense fallback={<PageLoading label="星光正在汇聚…" />}><ProductsPage /></Suspense>
            ) : (
              <><HeroSection deferParticles={introVisible} /><ExploreGrid /></>
            )}
          </main>
          <StatsBar />
        </div>
        {!route.isKnownPage && <SectionPreview section={section} />}
        <ContactOrb pagePath={route.pagePath} />
      </div>
      {introVisible && <OpeningIntro variant={route.variant} onComplete={completeIntro} />}
    </>
  )
}
