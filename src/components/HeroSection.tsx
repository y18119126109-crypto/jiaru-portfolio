import { lazy, Suspense, useEffect, useState } from 'react'
import { Icon } from './Icon'
import { PreparedLink as Link } from './PreparedNavigation'
import { site } from '../data/site'

const ParticleRibbon = lazy(() => import('./ParticleRibbon'))

function ParticlePlaceholder() {
  return (
    <div className="particle-loading" role="status">
      <span className="particle-standin" aria-hidden="true"><i /><i /><i /></span>
      <em>灵感正在汇聚</em>
    </div>
  )
}

function DeferredParticleRibbon({ deferred }: { deferred: boolean }) {
  const [shouldLoad, setShouldLoad] = useState(false)

  useEffect(() => {
    if (deferred) return
    const connection = (navigator as Navigator & {
      connection?: { effectiveType?: string; saveData?: boolean }
    }).connection
    const isMobile = window.matchMedia('(max-width: 767px)').matches
    const isSlow = /(?:^|-)2g$|3g/u.test(connection?.effectiveType ?? '')
    const delay = connection?.saveData ? 3500 : isSlow ? 2200 : isMobile ? 1000 : 300
    const timer = window.setTimeout(() => setShouldLoad(true), delay)
    return () => window.clearTimeout(timer)
  }, [deferred])

  if (!shouldLoad) return <ParticlePlaceholder />
  return (
    <Suspense fallback={<ParticlePlaceholder />}>
      <ParticleRibbon />
    </Suspense>
  )
}

function getGreeting() {
  const hour = new Date().getHours()
  if (hour < 6) return { text: '夜深了，灵感还醒着', icon: 'moon' as const }
  if (hour < 11) return { text: '早安，给好奇心一点时间', icon: 'sun' as const }
  if (hour < 17) return { text: '午后好，来这里慢一会儿', icon: 'sun' as const }
  return { text: '晚上好，欢迎来到我的小小宇宙', icon: 'moon' as const }
}

export function HeroSection({ deferParticles = false }: { deferParticles?: boolean }) {
  const [greeting, setGreeting] = useState(getGreeting)

  useEffect(() => {
    const timer = window.setInterval(() => setGreeting(getGreeting()), 60_000)
    return () => window.clearInterval(timer)
  }, [])

  function explore() {
    const target = document.getElementById('explore')
    if (!target) return
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    window.scrollTo({ top: target.getBoundingClientRect().top + window.scrollY - 32, behavior: reducedMotion ? 'instant' : 'smooth' })
    target.focus({ preventScroll: true })
  }

  return (
    <section className="hero grid items-center" aria-labelledby="hero-title">
      <div className="hero-copy home-enter home-enter-copy relative z-10">
        <div className="hello-pill glass inline-flex items-center gap-2.5">
          <Icon name={greeting.icon} size={15} />
          <span>{greeting.text}</span>
        </div>
        <h1 id="hero-title">让灵感生长，<br /><span className="hero-title-accent">让热爱有回响<span className="title-period">。</span></span></h1>
        <p className="hero-english">A little curiosity. A little creation.</p>
        <p className="hero-description">
          你好，我是 <strong>{site.name}</strong>。<br className="mobile-break" />一个在音乐、设计与 AI 之间，<br className="desktop-break" />
          不断探索的创作者。这里收藏着我的作品，也藏着我的热爱。
        </p>
        <div className="hero-actions flex flex-wrap items-center gap-4">
          <button type="button" className="primary-button flex items-center gap-7" onClick={explore}>开始探索<Icon name="arrow" size={18} /></button>
          <Link to="/resume" state={{ fromHome: true }} className="secondary-button glass flex items-center gap-5">认识我<Icon name="diagonal" size={16} /></Link>
        </div>
        <div className="hero-note flex items-center gap-2.5">
          <span className="tiny-line" />
          <span>以好奇为起点，让创作自然发生</span>
        </div>
      </div>

      <div className="hero-art home-enter home-enter-art relative">
        <div className="art-orb art-orb-mint" aria-hidden="true" />
        <div className="art-orb art-orb-peach" aria-hidden="true" />
        <div className="art-orbit orbit-back" aria-hidden="true" />
        <div className="art-cross cross-top" aria-hidden="true">+</div>
        <div className="art-cross cross-bottom" aria-hidden="true">+</div>
        <div className="art-coordinate" aria-hidden="true">SOUND MEETS POSSIBILITY</div>
        <DeferredParticleRibbon deferred={deferParticles} />
        <div className="art-orbit orbit-floor" aria-hidden="true" />
        <div className="resonance-card glass flex items-center gap-3" aria-hidden="true">
          <div className="mini-wave flex items-center gap-1">{[10, 20, 30, 18, 26, 12, 7].map((height, index) => <span key={index} style={{ height }} />)}</div>
          <div><p>灵感，自由共振</p><span>Human feeling. AI possibility.</span></div>
        </div>
      </div>
    </section>
  )
}
