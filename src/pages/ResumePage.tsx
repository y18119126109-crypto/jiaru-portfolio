import { lazy, Suspense, useEffect, useState } from 'react'
import { motion, useReducedMotion } from 'framer-motion'
import { Icon } from '../components/Icon'
import { ProjectMediaGallery } from '../components/ProjectMediaGallery'
import { PreparedLink as Link } from '../components/PreparedNavigation'
import type { WaterStatus } from '../components/WaterBackdrop'
import { useWaterSound } from '../hooks/useWaterSound'
import {
  getResumeData, resumeChapters, type ChapterId, type ResumeEntry,
} from '../data/resume'
import type { SiteVariant } from '../siteRouting'
import './resume.css'

const WaterBackdrop = lazy(() => import('../components/WaterBackdrop').then(module => ({ default: module.WaterBackdrop })))

function ChapterHeading({ id, count }: { id: ChapterId; count?: string }) {
  const chapter = resumeChapters.find(item => item.id === id)!
  return (
    <div className="resume-section-heading">
      <div className="flex items-center gap-3">
        <span className="chapter-number">{chapter.number}</span>
        <h2>{chapter.title}</h2>
        <span className="chapter-english">{chapter.english}</span>
      </div>
      {count && <span className="chapter-count">{count}</span>}
    </div>
  )
}

function ExperienceCard({ entry, index }: { entry: ResumeEntry; index: number }) {
  return (
    <article className="resume-entry glass">
      <div className="entry-heading">
        <div className="entry-title">
          <span className="entry-index" aria-hidden="true">{String(index + 1).padStart(2, '0')}</span>
          <div><h3>{entry.title}</h3><p className="entry-role">{entry.role}</p></div>
        </div>
        <span className="resume-date">{entry.period}</span>
      </div>
      <dl className="entry-details">
        {entry.details.map(detail => (
          <div key={detail.label}><dt>{detail.label}</dt><dd>{detail.text}</dd></div>
        ))}
      </dl>
      <div className="entry-highlights">
        {entry.highlights.map(item => {
          const content = <><strong>{item.value}</strong><span>{item.label}</span></>
          return item.path ? (
            <Link
              key={item.label}
              to={item.path}
              className="entry-highlight-link"
              aria-label={`${item.value} ${item.label}，前往${item.path === '/music' ? '音乐创作' : '精选歌单'}`}
            >
              {content}<Icon name="arrow" size={13} />
            </Link>
          ) : <div key={item.label}>{content}</div>
        })}
      </div>
      <div className="resume-tags">{entry.tags.map(tag => <span key={tag}>{tag}</span>)}</div>
      {entry.action && (
        <Link className="resume-entry-action" to={entry.action.path}>
          {entry.action.label}<Icon name="arrow" size={14} />
        </Link>
      )}
      {entry.media && <ProjectMediaGallery gallery={entry.media} />}
    </article>
  )
}

export function ResumePage({ variant }: { variant?: SiteVariant }) {
  const { education, internships, profile, projects, skills, tools } = getResumeData(variant)
  const reducedMotion = useReducedMotion()
  const [motionOverride, setMotionOverride] = useState<boolean | null>(null)
  const paused = motionOverride ?? Boolean(reducedMotion)
  const [waterStatus, setWaterStatus] = useState<WaterStatus>('loading')
  const { soundState, toggleSound } = useWaterSound()
  const [activeChapter, setActiveChapter] = useState<ChapterId>('education')
  const [progress, setProgress] = useState(0)

  useEffect(() => {
    document.title = '周珈如 · 个人简历 — JIARU'
    const initialHash = window.location.hash.slice(1)
    if (resumeChapters.some(chapter => chapter.id === initialHash)) {
      document.getElementById(initialHash)?.scrollIntoView()
    } else {
      window.scrollTo({ top: 0, behavior: 'instant' })
    }
    let frame = 0
    const update = () => {
      frame = 0
      let current: ChapterId = 'education'
      for (const chapter of resumeChapters) {
        if ((document.getElementById(chapter.id)?.getBoundingClientRect().top ?? Infinity) <= 155) current = chapter.id
      }
      const distance = document.documentElement.scrollHeight - innerHeight
      if (distance > 0 && window.scrollY >= distance - 8) current = 'skills'
      setActiveChapter(current)
      setProgress(distance > 0 ? Math.min(100, Math.round(window.scrollY / distance * 100)) : 100)
    }
    const onScroll = () => { if (!frame) frame = requestAnimationFrame(update) }
    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('resize', onScroll)
    update()
    return () => {
      cancelAnimationFrame(frame)
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('resize', onScroll)
      document.title = 'JIARU — 让热爱有回响'
    }
  }, [])

  return (
    <>
      <Suspense fallback={null}><WaterBackdrop paused={paused} onStatus={setWaterStatus} /></Suspense>
      <div className={`resume-page ${paused ? 'water-is-paused' : ''}`}>
        <div className="resume-breadcrumb">
          <Link to="/">首页</Link><span>/</span><span>个人简历</span>
          <span className="resume-volume">THE PERSONAL ARCHIVE <i /> 01</span>
        </div>

        <motion.section className="resume-hero" aria-labelledby="resume-name" initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.65 }}>
          <div className="resume-intro">
            <div className="resume-eyebrow"><span className="tiny-line" />音乐 · 内容 · AI</div>
            <h1 id="resume-name">{profile.name}<span>{profile.englishName}</span></h1>
            <p className="resume-statement">从音乐学出发，<br className="resume-mobile-break" />连接创作、内容与人<span>。</span></p>
            <p className="resume-direction">{profile.direction}</p>
            <div className="resume-contact">
              <a href={`mailto:${profile.email}`}><Icon name="mail" size={15} />{profile.email}</a>
              <a href={`tel:${profile.phone}`}><Icon name="phone" size={14} />{profile.phone}</a>
            </div>
            <div className="resume-actions flex flex-wrap items-center gap-3">
              <a className="primary-button inline-flex items-center gap-4" href={profile.file} download={profile.downloadName}><Icon name="download" size={16} />下载简历<span className="file-label">PDF</span></a>
              {profile.portfolio.startsWith('/') ? (
                <Link className="secondary-button glass inline-flex items-center gap-5" to={profile.portfolio}>查看我的作品<Icon name="diagonal" size={15} /></Link>
              ) : (
                <a className="secondary-button glass inline-flex items-center gap-5" href={profile.portfolio} target="_blank" rel="noreferrer">查看我的作品<Icon name="diagonal" size={15} /></a>
              )}
            </div>
          </div>
          <div className="water-object" aria-hidden="true">
            <span className="water-object-coordinate">A LITTLE RIPPLE, A NEW POSSIBILITY.</span>
            <div className="water-pool"><span /><span /><span /><span /></div>
            <div className="water-pebble"><span className="pebble-highlight" /><span className="pebble-core" /></div>
            <div className="water-object-caption"><span>Always in flow.</span><p>一直流动，始终热爱</p></div>
            <span className="water-object-mark">+</span>
          </div>
        </motion.section>

        <div className="resume-layout" id="resume-content">
          <aside className="resume-sidebar">
            <div className="resume-sidebar-sticky">
              <div className="resume-nav-label">沿着这些足迹<span>CONTENTS</span></div>
              <nav className="resume-chapters" aria-label="简历章节">
                {resumeChapters.map(chapter => (
                  <a key={chapter.id} href={`#${chapter.id}`} className={activeChapter === chapter.id ? 'is-current' : ''} aria-current={activeChapter === chapter.id ? 'location' : undefined}
                    onClick={event => {
                      event.preventDefault()
                      const element = document.getElementById(chapter.id)
                      window.history.replaceState(window.history.state, '', `#${chapter.id}`)
                      element?.scrollIntoView({ behavior: reducedMotion ? 'instant' : 'smooth', block: 'start' })
                      element?.focus({ preventScroll: true })
                    }}>
                    <span className="chapter-nav-number">{chapter.number}</span>
                    <span>{chapter.title}</span>
                    <Icon name="arrow" size={15} />
                  </a>
                ))}
              </nav>
              <div className="resume-reading" aria-hidden="true"><div><span>阅读足迹</span><span>{progress}%</span></div><div className="reading-track"><span style={{ width: `${progress}%` }} /></div></div>
              <div className="water-controls glass">
                <div className="water-control-title"><Icon name="drop" size={16} /><span>此刻，水面微漾</span></div>
                <p>{waterStatus === 'unavailable' ? '静谧水面，依然自在阅读' : paused ? '水面已静止，慢慢阅读' : '轻移光标，留下一点涟漪'}</p>
                <div className="water-control-buttons">
                  <button type="button" onClick={toggleSound} aria-pressed={soundState === 'on'} aria-busy={soundState === 'loading'} disabled={soundState === 'unavailable' || soundState === 'loading'}>
                    <Icon name={soundState === 'on' ? 'volume' : 'mute'} size={15} />
                    <span>{soundState === 'loading' ? '载入溪声…' : soundState === 'unavailable' ? '水声不可用' : soundState === 'on' ? '关闭水声' : '开启水声'}</span>
                  </button>
                  <button type="button" onClick={() => setMotionOverride(!paused)} disabled={waterStatus !== 'ready'} aria-label={paused ? '播放水波动效' : '暂停水波动效'} aria-pressed={!paused && waterStatus === 'ready'}>
                    <Icon name={paused ? 'play' : 'pause'} size={12} />
                  </button>
                </div>
                <span className="water-control-status" role="status">{soundState === 'loading' ? '正在载入自然溪流' : soundState === 'on' ? '林间溪流 · 随移动轻响' : soundState === 'unavailable' ? '溪流音频暂时不可用' : '自然溪声 · 点击开启'}</span>
              </div>
              <p className="resume-side-note">每一段经历，<br />都汇入今天的自己。</p>
            </div>
          </aside>

          <div className="resume-sections">
            <section id="education" className="resume-section" tabIndex={-1} aria-label="学习经历">
              <ChapterHeading id="education" count="两段音乐学旅程" />
              <div className="education-card glass">
                {education.map((item, index) => (
                  <article className="education-entry" key={item.school}>
                    <div className={`education-seal seal-${index}`} aria-hidden="true"><Icon name="book" size={24} /></div>
                    <div className="education-main">
                      <div className="education-topline"><div><h3>{item.school}</h3><p className="school-english">{item.english}</p></div><span className="resume-date">{item.period}</span></div>
                      <div className="education-degree"><span>{item.degree}</span><span className="education-badge">{item.badge}</span></div>
                      <div className="education-courses"><span>核心课程</span><p>{item.courses.join(' / ')}</p></div>
                    </div>
                  </article>
                ))}
              </div>
            </section>

            <section id="projects" className="resume-section" tabIndex={-1} aria-label="项目经历">
              <ChapterHeading id="projects" count="让想法发生" />
              <div className="resume-entry-list">{projects.map((entry, index) => <ExperienceCard key={entry.title} entry={entry} index={index} />)}</div>
            </section>

            <section id="experience" className="resume-section" tabIndex={-1} aria-label="实习经历">
              <ChapterHeading id="experience" count="在实践中生长" />
              <div className="resume-entry-list">{internships.map((entry, index) => <ExperienceCard key={entry.title} entry={entry} index={index} />)}</div>
            </section>

            <section id="skills" className="resume-section" tabIndex={-1} aria-label="技能">
              <ChapterHeading id="skills" count="热爱的工具箱" />
              <div className="resume-skills glass">
                <div className="skill-grid">
                  {skills.map(skill => (
                    <article key={skill.title} className="skill-block"><span className="skill-icon"><Icon name={skill.icon} size={20} /></span><h3>{skill.title}</h3><p>{skill.text}</p>{skill.note && <p>{skill.note}</p>}</article>
                  ))}
                </div>
                <div className="resume-tools"><span>常用工具<span>MY TOOLKIT</span></span><div>{tools.map(tool => <span key={tool}>{tool}</span>)}</div></div>
              </div>
            </section>
            <div className="resume-end"><span>故事还在继续</span><i /><Link to="/">回到首页<Icon name="arrow" size={15} /></Link></div>
          </div>
        </div>
      </div>
    </>
  )
}
