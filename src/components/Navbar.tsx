import { useEffect, useRef, useState } from 'react'
import { useLocation } from 'react-router-dom'
import { sections, site } from '../data/site'
import { parseSiteRoute } from '../siteRouting'
import { Icon } from './Icon'
import { PreparedLink as Link } from './PreparedNavigation'

export function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false)
  const menuButton = useRef<HTMLButtonElement>(null)
  const nav = useRef<HTMLElement>(null)
  const { pathname } = useLocation()
  const currentPage = parseSiteRoute(pathname).pagePath

  useEffect(() => { setMenuOpen(false) }, [pathname])
  useEffect(() => {
    if (!menuOpen) return
    const closeOutside = (event: PointerEvent) => {
      if (!nav.current?.contains(event.target as Node)) setMenuOpen(false)
    }
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setMenuOpen(false)
        menuButton.current?.focus()
      }
    }
    document.addEventListener('pointerdown', closeOutside)
    document.addEventListener('keydown', closeOnEscape)
    return () => {
      document.removeEventListener('pointerdown', closeOutside)
      document.removeEventListener('keydown', closeOnEscape)
    }
  }, [menuOpen])

  return (
    <header className="home-enter home-enter-nav relative z-30">
      <nav ref={nav} className="navbar glass flex items-center justify-between" aria-label="主导航">
        <Link to="/" className="brand flex items-center gap-3" aria-label="JIARU 首页">
          <span className="brand-symbol" aria-hidden="true"><span /><span /><span /></span>
          <span className="brand-wordmark">{site.wordmark}<span className="brand-dot">.</span></span>
          <span className="brand-caption">一个持续生长的个人空间</span>
        </Link>
        <div className="desktop-nav flex items-center gap-1">
          <Link to="/" className={`nav-link ${currentPage === '/' ? 'is-active' : ''}`} aria-current={currentPage === '/' ? 'page' : undefined}>首页</Link>
          {sections.map(section => (
            <Link key={section.id} to={section.path} state={{ fromHome: true }} className={`nav-link ${currentPage === section.path ? 'is-active' : ''}`} aria-current={currentPage === section.path ? 'page' : undefined}>
              {section.navTitle}
            </Link>
          ))}
        </div>
        <span className="nav-status flex items-center gap-2"><span className="status-dot" />保持好奇</span>
        <button ref={menuButton} type="button" className="mobile-menu-button icon-button" aria-expanded={menuOpen} aria-controls="mobile-nav" aria-label={menuOpen ? '关闭导航菜单' : '打开导航菜单'} onClick={() => setMenuOpen(value => !value)}>
          <Icon name={menuOpen ? 'close' : 'menu'} />
        </button>
        {menuOpen && (
          <div id="mobile-nav" className="mobile-nav mobile-nav-enter glass">
            <Link to="/" onClick={() => setMenuOpen(false)}>首页<Icon name="arrow" size={17} /></Link>
            {sections.map(section => (
              <Link key={section.id} to={section.path} state={{ fromHome: true }} onClick={() => setMenuOpen(false)}>{section.title}<Icon name="diagonal" size={17} /></Link>
            ))}
          </div>
        )}
      </nav>
    </header>
  )
}
