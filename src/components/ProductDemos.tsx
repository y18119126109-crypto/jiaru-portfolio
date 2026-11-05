import { useEffect, useRef, useState, type CSSProperties } from 'react'
import { weatherModes, radioViews, type WeatherId } from '../data/products'
import { Icon } from './Icon'

const noteKey = 'jiaru-rain-writer-preview-v1'
const defaultNote = '雨把世界放轻了一点。\n\n想把今天闪过的念头，\n留在这扇窗边。'
const assistantModes = [
  { name: '对话', text: '把此刻的念头说给雨窗听。', example: '“今晚这场雨让你想起什么？”' },
  { name: '搜索', text: '用自然语言，找回旧笔记。', example: '“上周关于毕业旅行的那段。”' },
  { name: '心情', text: '从当前文字里，梳理心情。', example: '将当前笔记交给 AI，获得情绪分析。' },
]

export function RainWriterDemo({ running }: { running: boolean }) {
  const [weather, setWeather] = useState<WeatherId>('rain')
  const [assistant, setAssistant] = useState(0)
  const [note, setNote] = useState(() => {
    try { return localStorage.getItem(noteKey) ?? defaultNote }
    catch { return defaultNote }
  })
  const [composing, setComposing] = useState(false)
  const [saveState, setSaveState] = useState('试着写下一句话')
  const [active, setActive] = useState(false)
  const host = useRef<HTMLDivElement>(null)
  const edited = useRef(false)
  const current = useRef(note)
  const mode = weatherModes.find(item => item.id === weather)!
  const save = () => {
    if (!edited.current) return
    try { localStorage.setItem(noteKey, current.current); setSaveState('已保存在此浏览器') }
    catch { setSaveState('浏览器无法保存，请复制留存') }
  }
  useEffect(() => {
    if (composing || !edited.current) return
    const timer = window.setTimeout(save, 350)
    return () => clearTimeout(timer)
  }, [note, composing])
  useEffect(() => {
    const container = host.current
    if (!container) return
    let inView = false
    const sync = () => setActive(inView && !document.hidden)
    const observer = new IntersectionObserver(([entry]) => { inView = entry.isIntersecting; sync() })
    observer.observe(container)
    document.addEventListener('visibilitychange', sync)
    const flush = () => {
      if (edited.current) { try { localStorage.setItem(noteKey, current.current) } catch { /* Status is shown by the editor while mounted. */ } }
    }
    window.addEventListener('pagehide', flush)
    return () => { observer.disconnect(); document.removeEventListener('visibilitychange', sync); window.removeEventListener('pagehide', flush); flush() }
  }, [])
  return (
    <div className="product-demo rain-demo" ref={host} data-weather={weather} data-animate={running && active}>
      <div className="demo-topline"><span><Icon name="drop" size={13} /> RAIN WRITER</span><span>交互预览 · {mode.name}</span></div>
      <div className="rain-demo-world">
        <div className="rain-demo-scenery" aria-hidden="true"><div /><div /><div /></div>
        <div className="rain-demo-weather" aria-hidden="true">{Array.from({ length: 44 }, (_, i) => <i key={i} style={{ '--x': `${(i * 37.7) % 100}%`, '--delay': `${-(i * 0.43)}s`, '--duration': `${2.2 + i % 7 * 0.6}s`, '--size': `${2 + i % 4}px` } as CSSProperties} />)}</div>
        <div className="rain-weather-picker" role="group" aria-label="预览天气">{weatherModes.map(item => <button key={item.id} aria-pressed={weather === item.id} onClick={() => setWeather(item.id)}><span aria-hidden="true">{item.symbol}</span>{item.name}</button>)}</div>
        <div className="rain-writing-card">
          <span className="rain-note-label">A NOTE TO MYSELF <Icon name="spark" size={12} /></span>
          <label htmlFor="rain-preview-note">把心事，留给雨。</label>
          <textarea id="rain-preview-note" aria-label="雨窗试写笔记" value={note} maxLength={6000} spellCheck={false}
            onCompositionStart={() => setComposing(true)}
            onCompositionEnd={() => setComposing(false)}
            onChange={event => { edited.current = true; current.current = event.target.value; setNote(event.target.value); setSaveState('正在记录…') }}
            onBlur={() => { if (!composing) save() }}
          />
          <div className="rain-note-footer"><span role="status">{saveState}</span><Icon name="book" size={13} /></div>
        </div>
        <span className="rain-weather-description">{mode.note}</span>
      </div>
      <div className="rain-assistant-preview">
        <div className="rain-assistant-label"><Icon name="spark" size={13} /><span>AI 陪伴的三种方式</span></div>
        <div className="demo-switch" role="group" aria-label="了解雨窗 AI 能力">{assistantModes.map((item, index) => <button key={item.name} onClick={() => setAssistant(index)} aria-pressed={assistant === index}>{item.name}</button>)}</div>
        <div className="rain-assistant-copy" aria-live="polite"><p>{assistantModes[assistant].text}</p><span>{assistantModes[assistant].example}</span></div>
      </div>
      <p className="demo-disclaimer">可切天气、试写文字；只在此浏览器保存。AI 区域为功能说明，不会发送你的文字。</p>
    </div>
  )
}

const regularQueue = ['熟悉的旋律', '夜色漫步', '温柔失重', '月光来信', '微光之间', '下一颗星']
const themeQueue = ['林间溪流', '窗外细雨', '远处的海', '山谷微风', '森林清晨', '安静雨夜']

export function ForeverDemo() {
  const [view, setView] = useState<(typeof radioViews)[number]['id']>('glass')
  const [theme, setTheme] = useState(false)
  const [familiarity, setFamiliarity] = useState(17)
  const [selected, setSelected] = useState(0)
  const [message, setMessage] = useState('通用模式：把熟悉与新鲜感编进一档节目。')
  const familiarCount = Math.round(familiarity * 6 / 100)
  const queue = theme ? themeQueue : regularQueue
  const changeTheme = (next: boolean, expired = false) => {
    setTheme(next)
    setSelected(0)
    setMessage(next ? '临时主题生效：只保留白噪音，熟悉度配比暂时停用。' : expired ? '已演示主题到期：恢复原来的熟悉度设置。' : '主题已取消：恢复通用混合推荐。')
  }
  return (
    <div className="product-demo forever-demo">
      <div className="demo-topline"><span><Icon name="headphones" size={13} /> FOREVER</span><span>产品逻辑演示 · 无音频</span></div>
      <div className="radio-view-switch demo-switch" role="group" aria-label="电台外观">{radioViews.map(item => <button key={item.id} aria-pressed={view === item.id} onClick={() => setView(item.id)}>{item.name}</button>)}</div>
      <div className="radio-demo-world" data-view={view} data-theme={theme ? 'nature' : 'mixed'}>
        <div className="radio-clock"><span>YOUR PRIVATE FREQUENCY</span><strong>22:08</strong><small>夜间界面示意</small></div>
        <div className="radio-record-stage"><div className="radio-record" aria-hidden="true"><i /><span>FV<br /><small>VOL. 02</small></span></div><div className="radio-current"><span>当前示例 · {String(selected + 1).padStart(2, '0')}</span><strong>{queue[selected]}</strong><small>{theme ? 'NATURE / WHITE NOISE' : 'A LITTLE DISCOVERY'}</small></div></div>
        <div className="radio-demo-queue"><span>UP NEXT <small>示例内容</small></span>{queue.slice(0, 3).map((name, index) => <button key={name} aria-pressed={selected === index} onClick={() => setSelected(index)} aria-label={`选择示例 ${name}`}><i>{String(index + 1).padStart(2, '0')}</i><span>{name}</span><Icon name={selected === index ? 'music' : 'arrow'} size={12} /></button>)}</div>
        <div className="radio-demo-message"><Icon name="spark" size={14} /><p>{theme ? '让两小时，轻轻落在自然里。' : '告诉我，此刻想处在怎样的氛围里。'}<span>DJ 文案示例</span></p></div>
      </div>
      <p className="radio-view-description">{radioViews.find(item => item.id === view)!.description}</p>
      <div className="radio-policy">
        <div className="radio-policy-header"><span>试试：让此刻的心情优先</span><span className={theme ? 'is-theme' : ''}>{theme ? '临时主题' : '通用推荐'}</span></div>
        <button className="radio-theme-command" aria-pressed={theme} onClick={() => changeTheme(!theme)}><span>“接下来两小时，只听白噪音。”</span><Icon name={theme ? 'close' : 'arrow'} size={14} /></button>
        <div className="radio-familiarity"><label htmlFor="familiarity">熟悉歌曲比例 <strong>{familiarity}%</strong></label><input id="familiarity" type="range" min="0" max="100" value={familiarity} disabled={theme} onChange={event => setFamiliarity(Number(event.target.value))} /></div>
        <div className="radio-policy-batch" aria-label={theme ? '六个主题内候选' : `六个候选，${familiarCount}个熟悉，${6 - familiarCount}个新发现`}>{Array.from({ length: 6 }, (_, i) => <span key={i} className={theme ? 'is-nature' : i < familiarCount ? 'is-familiar' : ''}><Icon name={theme ? 'drop' : i < familiarCount ? 'music' : 'spark'} size={14} /><small>{theme ? '自然' : i < familiarCount ? '熟悉' : '发现'}</small></span>)}</div>
        <div className="radio-policy-status"><p role="status">{message}{!theme && ` 每批示例：${familiarCount} 首熟悉，${6 - familiarCount} 首新发现。`}</p>{theme && <button onClick={() => changeTheme(false, true)}>演示到期<Icon name="arrow" size={12} /></button>}</div>
      </div>
      <p className="demo-disclaimer">固定示例用于说明外观共享状态与策略优先级，不联网推荐、不播放歌曲。</p>
    </div>
  )
}
