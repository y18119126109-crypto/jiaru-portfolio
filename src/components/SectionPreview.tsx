import { useCallback, useEffect, useRef } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import type { Section } from '../data/site'
import { siteHomePath } from '../siteRouting'
import { SectionArt } from './ExploreGrid'
import { Icon } from './Icon'

export function SectionPreview({ section }: { section?: Section }) {
  const dialog = useRef<HTMLDialogElement>(null)
  const navigate = useNavigate()
  const location = useLocation()
  const dismiss = useCallback(() => {
    if (location.state?.fromHome) navigate(-1)
    else navigate(siteHomePath(location.pathname), { replace: true })
  }, [location.pathname, location.state, navigate])

  useEffect(() => {
    const element = dialog.current
    const previousFocus = document.activeElement instanceof HTMLElement ? document.activeElement : null
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    element?.showModal()
    document.title = section ? `${section.title} — JIARU` : '页面未找到 — JIARU'
    return () => {
      element?.close()
      document.body.style.overflow = previousOverflow
      document.title = 'JIARU — 让热爱有回响'
      const focusTarget = previousFocus?.isConnected && previousFocus !== document.body && !previousFocus.closest('dialog')
        ? previousFocus
        : document.querySelector<HTMLElement>('.brand')
      focusTarget?.focus({ preventScroll: true })
    }
  }, [section])

  return (
    <dialog
      ref={dialog}
      className={`section-dialog tone-${section?.tone ?? 'mint'}`}
      aria-labelledby="preview-title"
      aria-describedby="preview-description"
      onCancel={event => { event.preventDefault(); dismiss() }}
      onClick={event => {
        if (event.target !== event.currentTarget) return
        const bounds = event.currentTarget.getBoundingClientRect()
        if (event.clientX < bounds.left || event.clientX > bounds.right || event.clientY < bounds.top || event.clientY > bounds.bottom) dismiss()
      }}
    >
      <div className="preview-content preview-enter">
        <button type="button" className="preview-close icon-button glass" onClick={dismiss} aria-label="关闭预览" autoFocus><Icon name="close" /></button>
        {section && <SectionArt kind={section.id} />}
        <span className="preview-eyebrow">{section?.eyebrow ?? 'A PATH YET TO BE FOUND'}</span>
        <h2 id="preview-title">{section?.title ?? '这个角落，还没有故事'}</h2>
        <span className="coming-soon flex items-center gap-2"><span className="status-dot" />{section ? '正在整理，敬请期待' : '没有找到这个页面'}</span>
        <p id="preview-description">{section?.preview ?? '沿着来时的路，回到首页继续探索吧。'}</p>
        {section && <div className="preview-tags flex flex-wrap gap-2">{section.tags.map(tag => <span key={tag}>{tag}</span>)}</div>}
        <button type="button" className="primary-button flex items-center justify-center gap-8" onClick={dismiss}>回到首页<Icon name="arrow" size={17} /></button>
      </div>
    </dialog>
  )
}
