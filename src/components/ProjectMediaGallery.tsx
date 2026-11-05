import { useEffect, useId, useRef, useState } from 'react'
import type { ResumeProjectGallery } from '../data/resume'
import { Icon } from './Icon'
import './project-media-gallery.css'

function warmImage(src: string) {
  const image = new Image()
  image.src = src
}

export function ProjectMediaGallery({ gallery }: { gallery: ResumeProjectGallery }) {
  const dialog = useRef<HTMLDialogElement>(null)
  const lastTrigger = useRef<HTMLButtonElement>(null)
  const titleId = useId()
  const previewId = useId()
  const [selectedIndex, setSelectedIndex] = useState(0)
  const [expanded, setExpanded] = useState(false)
  const [open, setOpen] = useState(false)
  const [imageStatus, setImageStatus] = useState<'loading' | 'ready' | 'error'>('loading')
  const [imageAttempt, setImageAttempt] = useState(0)
  const selected = gallery.items[selectedIndex]
  const previewIndices = (gallery.previewIndices ?? gallery.items.map((_, index) => index)).slice(0, 3)

  useEffect(() => {
    if (!open) return
    const element = dialog.current
    const previousOverflow = document.body.style.overflow
    if (element && !element.open) element.showModal()
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = previousOverflow }
  }, [open])

  const show = (index: number, trigger: HTMLButtonElement) => {
    lastTrigger.current = trigger
    setImageStatus('loading')
    setImageAttempt(0)
    setSelectedIndex(index)
    setOpen(true)
  }

  const close = () => dialog.current?.close()
  const select = (index: number) => {
    setImageStatus('loading')
    setImageAttempt(0)
    setSelectedIndex(index)
  }
  const move = (offset: number) => {
    setImageStatus('loading')
    setImageAttempt(0)
    setSelectedIndex(current => (current + offset + gallery.items.length) % gallery.items.length)
  }

  return (
    <section className={`project-media ${expanded ? 'is-expanded' : ''}`} aria-label={gallery.title}>
      <div className="project-media-heading">
        <span><i aria-hidden="true" />PROJECT MEDIA</span>
        <button type="button" aria-expanded={expanded} aria-controls={previewId} onClick={() => setExpanded(value => !value)}>
          {expanded ? '收起影像' : `展开 ${gallery.items.length} 张影像`}<Icon name="down" size={13} />
        </button>
      </div>
      {expanded && (
        <div id={previewId} className="project-media-preview" data-count={previewIndices.length}>
          {previewIndices.map((itemIndex, previewIndex) => {
            const item = gallery.items[itemIndex]
            return (
              <button
                key={item.src}
                type="button"
                className={`project-media-tile project-media-tile-${previewIndex + 1}`}
                style={{ flexBasis: Math.max(220, Math.round(Math.min(1.8, item.aspectRatio ?? 1) * 176)) }}
                onPointerEnter={() => warmImage(item.src)}
                onFocus={() => warmImage(item.src)}
                onClick={event => show(itemIndex, event.currentTarget)}
                aria-label={`查看${item.caption}，第 ${itemIndex + 1} 张，共 ${gallery.items.length} 张`}
              >
                <img src={item.thumbnail} alt="" loading="lazy" decoding="async" style={{ objectPosition: item.position }} />
                <span aria-hidden="true">{String(itemIndex + 1).padStart(2, '0')}</span>
              </button>
            )
          })}
        </div>
      )}

      <dialog
        ref={dialog}
        className="project-media-dialog"
        aria-labelledby={titleId}
        onClose={() => {
          setOpen(false)
          lastTrigger.current?.focus({ preventScroll: true })
        }}
        onKeyDown={event => {
          if (event.key === 'ArrowLeft') { event.preventDefault(); move(-1) }
          if (event.key === 'ArrowRight') { event.preventDefault(); move(1) }
          if (event.key === 'Home') { event.preventDefault(); setSelectedIndex(0) }
          if (event.key === 'End') { event.preventDefault(); setSelectedIndex(gallery.items.length - 1) }
        }}
        onClick={event => {
          if (event.target !== event.currentTarget) return
          const bounds = event.currentTarget.getBoundingClientRect()
          if (event.clientX < bounds.left || event.clientX > bounds.right || event.clientY < bounds.top || event.clientY > bounds.bottom) close()
        }}
      >
        {open && (
          <div className="project-media-viewer">
            <header>
              <div>
                <span>PROJECT ARCHIVE</span>
                <h2 id={titleId}>{gallery.title}</h2>
              </div>
              <span className="project-media-counter" aria-live="polite">{String(selectedIndex + 1).padStart(2, '0')} / {String(gallery.items.length).padStart(2, '0')}</span>
              <button type="button" className="project-media-close" onClick={close} aria-label="关闭项目影像" autoFocus><Icon name="close" size={18} /></button>
            </header>

            <div className="project-media-stage">
              <button type="button" className="project-media-previous" onPointerEnter={() => warmImage(gallery.items[(selectedIndex - 1 + gallery.items.length) % gallery.items.length].src)} onFocus={() => warmImage(gallery.items[(selectedIndex - 1 + gallery.items.length) % gallery.items.length].src)} onClick={() => move(-1)} aria-label="查看上一张图片"><Icon name="previous" size={20} /></button>
              <figure aria-busy={imageStatus === 'loading'}>
                {imageStatus === 'loading' && <span className="project-media-loading" role="status"><i aria-hidden="true" />正在载入影像</span>}
                <img
                  key={`${selected.src}-${imageAttempt}`}
                  className={imageStatus === 'ready' ? 'is-ready' : undefined}
                  src={imageAttempt ? `${selected.src}?retry=${imageAttempt}` : selected.src}
                  alt={selected.alt}
                  decoding="async"
                  onLoad={() => setImageStatus('ready')}
                  onError={() => setImageStatus('error')}
                />
                {imageStatus === 'error' && (
                  <span className="project-media-error" role="alert">
                    影像暂时无法载入
                    <button type="button" onClick={() => { setImageStatus('loading'); setImageAttempt(attempt => attempt + 1) }}>重新加载</button>
                  </span>
                )}
                <figcaption><span>{String(selectedIndex + 1).padStart(2, '0')}</span><strong>{selected.caption}</strong></figcaption>
              </figure>
              <button type="button" className="project-media-next" onPointerEnter={() => warmImage(gallery.items[(selectedIndex + 1) % gallery.items.length].src)} onFocus={() => warmImage(gallery.items[(selectedIndex + 1) % gallery.items.length].src)} onClick={() => move(1)} aria-label="查看下一张图片"><Icon name="next" size={20} /></button>
            </div>

            <div className="project-media-thumbnails" aria-label="选择项目影像">
              {gallery.items.map((item, index) => (
                <button
                  key={item.src}
                  type="button"
                  className={index === selectedIndex ? 'is-active' : undefined}
                  aria-current={index === selectedIndex ? 'true' : undefined}
                  aria-label={`查看第 ${index + 1} 张：${item.caption}`}
                  onPointerEnter={() => warmImage(item.src)}
                  onFocus={() => warmImage(item.src)}
                  onClick={() => select(index)}
                >
                  <img src={item.thumbnail} alt="" loading="lazy" decoding="async" style={{ objectPosition: item.position }} />
                </button>
              ))}
            </div>
          </div>
        )}
      </dialog>
    </section>
  )
}
