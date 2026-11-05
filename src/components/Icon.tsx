import type { CSSProperties } from 'react'

const paths = {
  arrow: <><path d="M5 12h14M13 6l6 6-6 6" /></>,
  diagonal: <><path d="M6 18 18 6M6 6h12v12" /></>,
  down: <><path d="M12 4v16M6 14l6 6 6-6" /></>,
  person: <><circle cx="12" cy="8" r="3.2" /><path d="M5.5 20v-2a6.5 6.5 0 0 1 13 0v2M7 20h10" /></>,
  music: <><path d="M9 17V5l10-2v12M9 8l10-2" /><ellipse cx="6" cy="18" rx="3" ry="2.5" /><ellipse cx="16" cy="16" rx="3" ry="2.5" /></>,
  grid: <><rect x="3.5" y="3.5" width="6" height="6" rx="1.5" /><rect x="14.5" y="3.5" width="6" height="6" rx="1.5" /><rect x="3.5" y="14.5" width="6" height="6" rx="1.5" /><rect x="14.5" y="14.5" width="6" height="6" rx="1.5" /></>,
  headphones: <><path d="M4 14v-3a8 8 0 0 1 16 0v3" /><rect x="3.5" y="12" width="4" height="8" rx="2" /><rect x="16.5" y="12" width="4" height="8" rx="2" /></>,
  spark: <><path d="m12 3 2.5 6.5L21 12l-6.5 2.5L12 21l-2.5-6.5L3 12l6.5-2.5Z" /></>,
  pause: <><path d="M8 5v14M16 5v14" strokeWidth="3" /></>,
  play: <><path d="m8 4 11 8-11 8Z" fill="currentColor" stroke="none" /></>,
  previous: <><path d="M5 5v14M18 5 7 12l11 7Z" /></>,
  next: <><path d="M19 5v14M6 5l11 7-11 7Z" /></>,
  close: <><path d="m6 6 12 12M6 18 18 6" /></>,
  menu: <><path d="M4 7h16M4 12h16M4 17h16" /></>,
  cursor: <><path d="m5 3 14 10-7 1-3 7Z" /></>,
  globe: <><circle cx="12" cy="12" r="9" /><ellipse cx="12" cy="12" rx="4" ry="9" /><path d="M3 12h18" /></>,
  sun: <><circle cx="12" cy="12" r="3.5" /><path d="M12 2v2M12 20v2M2 12h2M20 12h2M5 5l1.5 1.5M17.5 17.5 19 19M5 19l1.5-1.5M17.5 6.5 19 5" /></>,
  moon: <><path d="M20.5 14A8.5 8.5 0 0 1 10 3.5 8.5 8.5 0 1 0 20.5 14Z" /></>,
  drop: <><path d="M12 3C10 6 5.5 10 5.5 14a6.5 6.5 0 0 0 13 0C18.5 10 14 6 12 3Z" /><path d="M9 14a3 3 0 0 0 3 3" /></>,
  volume: <><path d="m11 4-5 4H3v8h3l5 4V4ZM15 8a6 6 0 0 1 0 8M18 5a10 10 0 0 1 0 14" /></>,
  mute: <><path d="m11 4-5 4H3v8h3l5 4V4ZM16 9l6 6M22 9l-6 6" /></>,
  mail: <><rect x="3" y="5" width="18" height="14" rx="3" /><path d="m4 7 8 6 8-6" /></>,
  phone: <><path d="m7 3 3 5-2.5 2.5a15 15 0 0 0 6 6L16 14l5 3-1 3c-.3 1-1.2 1.3-2.2 1C10 19.5 4.5 14 3 6.2 2.7 5.2 3 4.3 4 4l3-1Z" /></>,
  download: <><path d="M12 3v12m-5-5 5 5 5-5M4 16v4h16v-4" /></>,
  book: <><path d="M12 5v15M3 4c4-1 7 0 9 2 2-2 5-3 9-2v14c-4-1-7 0-9 2-2-2-5-3-9-2V4Z" /></>,
} as const

export type IconName = keyof typeof paths

export function Icon({ name, size = 20, className = '', style }: {
  name: IconName
  size?: number
  className?: string
  style?: CSSProperties
}) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className={className} style={style} aria-hidden="true">
      {paths[name]}
    </svg>
  )
}
