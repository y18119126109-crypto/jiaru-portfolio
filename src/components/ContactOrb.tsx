import { useEffect, useRef, useState } from 'react'
import { Icon, type IconName } from './Icon'
import './contact-orb.css'

type ContactTheme = 'home' | 'resume' | 'music' | 'products' | 'playlists'

const contactDetails = {
  email: 'zhoujiaru2324@163.com',
  phone: '15553313138',
}

const pageMessages: Record<ContactTheme, { icon: IconName; eyebrow: string; title: string }> = {
  home: {
    icon: 'spark',
    eyebrow: 'LET IDEAS MEET',
    title: '让一次交流，成为新的回响。',
  },
  resume: {
    icon: 'drop',
    eyebrow: 'A RIPPLE STARTS HERE',
    title: '关于经历与新的可能，欢迎来聊。',
  },
  music: {
    icon: 'music',
    eyebrow: 'SHARE THE FREQUENCY',
    title: '有关于声音与创作的想法，欢迎来聊。',
  },
  products: {
    icon: 'spark',
    eyebrow: 'IDEAS FIND AN ORBIT',
    title: '有关于产品与 AI 的想法，欢迎来聊。',
  },
  playlists: {
    icon: 'headphones',
    eyebrow: 'A NOTE IN BLOOM',
    title: '想聊音乐、歌单与此刻的声音，欢迎来找我。',
  },
}

function contactTheme(pagePath: string): ContactTheme {
  if (pagePath === '/resume') return 'resume'
  if (pagePath === '/music') return 'music'
  if (pagePath === '/products') return 'products'
  if (pagePath === '/playlists') return 'playlists'
  return 'home'
}

function ContactMark({ theme }: { theme: ContactTheme }) {
  if (theme === 'music') {
    return <span className="contact-mark contact-mark-music" aria-hidden="true">{[10, 18, 27, 15, 23, 12].map((height, index) => <i key={index} style={{ height }} />)}</span>
  }
  if (theme === 'playlists') {
    return <span className="contact-mark contact-mark-flower" aria-hidden="true">{[0, 1, 2, 3, 4].map(index => <i key={index} />)}<b /></span>
  }
  return (
    <span className={`contact-mark contact-mark-${theme}`} aria-hidden="true">
      <i /><i /><Icon name={theme === 'resume' ? 'drop' : 'spark'} size={22} />
    </span>
  )
}

export function ContactOrb({ pagePath }: { pagePath: string }) {
  const dialog = useRef<HTMLDialogElement>(null)
  const trigger = useRef<HTMLButtonElement>(null)
  const [open, setOpen] = useState(false)
  const theme = contactTheme(pagePath)
  const message = pageMessages[theme]

  useEffect(() => {
    if (!open) return
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = previousOverflow }
  }, [open])

  useEffect(() => {
    if (dialog.current?.open) dialog.current.close()
  }, [pagePath])

  const show = () => {
    if (dialog.current?.open) return
    dialog.current?.showModal()
    setOpen(true)
  }

  const close = () => dialog.current?.close()

  return (
    <div className={`contact-layer ${open ? 'is-open' : ''}`} data-contact-theme={theme}>
      <button ref={trigger} type="button" className="contact-orb" aria-label="与我联系" aria-haspopup="dialog" aria-expanded={open} onClick={show}>
        <span className="contact-orb-ring" aria-hidden="true" />
        <Icon name={message.icon} size={21} />
        <span className="contact-orb-tooltip" role="tooltip">与我联系</span>
      </button>

      <dialog
        ref={dialog}
        className="contact-dialog"
        aria-labelledby="contact-dialog-title"
        aria-describedby="contact-dialog-description"
        onClose={() => {
          setOpen(false)
          trigger.current?.focus({ preventScroll: true })
        }}
        onClick={event => {
          if (event.target !== event.currentTarget) return
          const bounds = event.currentTarget.getBoundingClientRect()
          if (event.clientX < bounds.left || event.clientX > bounds.right || event.clientY < bounds.top || event.clientY > bounds.bottom) close()
        }}
      >
        <div className="contact-panel">
          <button type="button" className="contact-close" onClick={close} aria-label="关闭联系方式" autoFocus><Icon name="close" size={17} /></button>
          <ContactMark theme={theme} />
          <span className="contact-eyebrow">{message.eyebrow}</span>
          <h2 id="contact-dialog-title">{message.title}</h2>
          <p id="contact-dialog-description">如果你也对音乐、内容或 AI 产品有想交流和探讨的地方，欢迎随时联系我。</p>
          <div className="contact-options">
            <a href={`mailto:${contactDetails.email}`}>
              <span className="contact-option-icon"><Icon name="mail" size={18} /></span>
              <span><small>邮箱</small><strong>{contactDetails.email}</strong></span>
              <Icon name="diagonal" size={14} />
            </a>
            <a href={`tel:${contactDetails.phone}`}>
              <span className="contact-option-icon"><Icon name="phone" size={17} /></span>
              <span><small>电话</small><strong>{contactDetails.phone}</strong></span>
              <Icon name="diagonal" size={14} />
            </a>
          </div>
          <span className="contact-signature"><i />期待与你相遇</span>
        </div>
      </dialog>
    </div>
  )
}
