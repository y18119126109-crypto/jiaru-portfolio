import { sections } from '../data/site'
import type { Section } from '../data/site'
import { Icon } from './Icon'
import { PreparedLink as Link } from './PreparedNavigation'

export function SectionArt({ kind }: { kind: Section['id'] }) {
  return (
    <div className={`section-art section-art-${kind}`} aria-hidden="true">
      {kind === 'resume' && <div className="paper-art"><div className="paper-back" /><div className="paper-front"><span className="paper-avatar" /><i /><i /><i /></div></div>}
      {kind === 'music' && <div className="sound-art">{[16, 25, 39, 53, 31, 46, 62, 38, 24, 34, 18].map((height, index) => <span key={index} style={{ height }} />)}</div>}
      {kind === 'products' && <div className="blocks-art"><span /><span /><span /><span /></div>}
      {kind === 'playlists' && <div className="record-art"><div className="record-sleeve" /><div className="record-disc"><span /></div></div>}
    </div>
  )
}

export function ExploreGrid() {
  return (
    <section id="explore" className="explore-section relative z-10" aria-labelledby="explore-title" tabIndex={-1}>
      <div className="section-heading home-enter home-enter-section flex items-end justify-between gap-4">
        <div className="flex items-center gap-3">
          <span className="section-spark"><Icon name="spark" size={17} /></span>
          <h2 id="explore-title">从这里，认识我</h2>
          <span className="section-label">EXPLORE MY WORLD</span>
        </div>
        <span className="section-aside">四个切面，同一个我<Icon name="diagonal" size={13} /></span>
      </div>
      <div className="explore-grid grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {sections.map((section, index) => (
          <article key={section.id} className="home-enter home-enter-card" style={{ animationDelay: `${80 + index * 70}ms` }}>
            <Link to={section.path} state={{ fromHome: true }} className={`explore-card glass tone-${section.tone}`} aria-label={`探索${section.title}`}>
              <div className="card-topline flex items-start justify-between">
                <span className="card-icon glass"><Icon name={section.icon} size={23} /></span>
                <span className="card-arrow"><Icon name="diagonal" size={17} /></span>
              </div>
              <SectionArt kind={section.id} />
              <div className="card-copy relative">
                <h3>{section.title}</h3>
                <p className="card-eyebrow">{section.eyebrow}</p>
                <p className="card-description">{section.description}</p>
              </div>
              <div className="card-footer flex items-center justify-between"><span>{section.action}</span><Icon name="arrow" size={15} /></div>
            </Link>
          </article>
        ))}
      </div>
    </section>
  )
}
