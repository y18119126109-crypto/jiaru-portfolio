import { useCallback, useEffect, useRef, useState } from 'react'
import type { SiteVariant } from '../siteRouting'
import { Icon } from './Icon'
import './opening-intro.css'

const firstLine = '希望能用你停留的 10s，'
const secondLine = '换来一个属于我的机会'
const signature = '努力找工作的周珈如'
const totalCharacters = firstLine.length + secondLine.length + signature.length

function visibleSegments(count: number) {
  const firstCount = Math.min(count, firstLine.length)
  const secondCount = Math.min(Math.max(count - firstLine.length, 0), secondLine.length)
  const signatureCount = Math.min(Math.max(count - firstLine.length - secondLine.length, 0), signature.length)
  return {
    first: firstLine.slice(0, firstCount),
    second: secondLine.slice(0, secondCount),
    signature: signature.slice(0, signatureCount),
    active: count < firstLine.length ? 'first' : count < firstLine.length + secondLine.length ? 'second' : 'signature',
  }
}

export function OpeningIntro({
  variant,
  onComplete,
}: {
  variant?: SiteVariant
  onComplete: () => void
}) {
  const skipButton = useRef<HTMLButtonElement>(null)
  const closing = useRef(false)
  const closeTimer = useRef(0)
  const reducedMotion = useRef(window.matchMedia('(prefers-reduced-motion: reduce)').matches)
  const [visibleCount, setVisibleCount] = useState(reducedMotion.current ? totalCharacters : 0)
  const [leaving, setLeaving] = useState(false)
  const segments = visibleSegments(visibleCount)
  const complete = visibleCount >= totalCharacters
  const progress = Math.round((visibleCount / totalCharacters) * 100)

  const close = useCallback(() => {
    if (closing.current) return
    closing.current = true
    setLeaving(true)
    closeTimer.current = window.setTimeout(onComplete, reducedMotion.current ? 20 : 620)
  }, [onComplete])

  useEffect(() => {
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    skipButton.current?.focus({ preventScroll: true })
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') close()
      if (event.key === 'Tab') {
        event.preventDefault()
        skipButton.current?.focus({ preventScroll: true })
      }
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => {
      document.body.style.overflow = previousOverflow
      document.removeEventListener('keydown', handleKeyDown)
      window.clearTimeout(closeTimer.current)
    }
  }, [close])

  useEffect(() => {
    let timer = 0
    let cancelled = false
    if (reducedMotion.current) {
      timer = window.setTimeout(close, 2200)
      return () => window.clearTimeout(timer)
    }

    const typeNext = (nextCount: number) => {
      if (cancelled) return
      setVisibleCount(nextCount)
      if (nextCount >= totalCharacters) {
        timer = window.setTimeout(close, 1750)
        return
      }
      const typedCharacter = nextCount <= firstLine.length
        ? firstLine[nextCount - 1]
        : nextCount <= firstLine.length + secondLine.length
          ? secondLine[nextCount - firstLine.length - 1]
          : signature[nextCount - firstLine.length - secondLine.length - 1]
      const linePause = nextCount === firstLine.length || nextCount === firstLine.length + secondLine.length
      timer = window.setTimeout(() => typeNext(nextCount + 1), linePause ? 420 : /[，。]/u.test(typedCharacter) ? 230 : 82)
    }

    timer = window.setTimeout(() => typeNext(1), 480)
    return () => {
      cancelled = true
      window.clearTimeout(timer)
    }
  }, [close])

  return (
    <div
      className={`opening-intro${leaving ? ' is-leaving' : ''}`}
      data-intro-variant={variant ?? 'default'}
      role="dialog"
      aria-modal="true"
      aria-label="开场：希望能用你停留的 10s，换来一个属于我的机会，努力找工作的周珈如"
    >
      <div className="opening-intro-spectrum" aria-hidden="true"><i /><i /><i /></div>
      <header className="opening-intro-header">
        <span className="opening-intro-brand"><i aria-hidden="true" />JIARU / PORTFOLIO</span>
        <button ref={skipButton} type="button" onClick={close}>
          {complete ? '进入作品' : '跳过开场'}<Icon name="arrow" size={15} />
        </button>
      </header>

      <div className="opening-intro-copy" aria-hidden="true">
        <span className="opening-intro-kicker">10 SEC / ONE CHANCE</span>
        <p className="opening-intro-message">
          <span>{segments.first}{segments.active === 'first' && <i className="opening-intro-caret" />}</span>
          <span>{segments.second}{segments.active === 'second' && <i className="opening-intro-caret" />}</span>
        </p>
        <p className={`opening-intro-signature${segments.signature ? ' is-visible' : ''}`}>
          <span>--</span>{segments.signature}{segments.active === 'signature' && <i className="opening-intro-caret" />}
        </p>
      </div>

      <footer className="opening-intro-progress" aria-hidden="true">
        <span><i style={{ transform: `scaleX(${progress / 100})` }} /></span>
        <small>{String(Math.ceil(progress / 10)).padStart(2, '0')} / 10 SEC</small>
      </footer>
    </div>
  )
}
