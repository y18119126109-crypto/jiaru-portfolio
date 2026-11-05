import { useEffect, useState } from 'react'
import { motion, useReducedMotion } from 'framer-motion'
import { Icon } from '../components/Icon'
import { DreamGalaxy } from '../components/DreamGalaxy'
import { PreparedLink as Link } from '../components/PreparedNavigation'
import { ForeverDemo, RainWriterDemo } from '../components/ProductDemos'
import { ProductFilm } from '../components/ProductFilm'
import { foreverGuide, rainGuide, radioFlow, productRecordings, type GuideSection } from '../data/products'
import './products.css'

const foreverInstallers = [
  {
    name: '百度网盘',
    url: 'https://pan.baidu.com/s/1OSUXlr610HiI6Lm20Z79nA?pwd=qmzp',
    code: 'qmzp',
  },
  {
    name: '夸克网盘',
    url: 'https://pan.quark.cn/s/9693af7e0f8f?pwd=kiZQ',
    code: 'kiZQ',
  },
] as const

const foreverDirectDownloads = [
  {
    platform: 'macOS',
    variant: 'Apple 芯片',
    version: 'v1.3.1',
    size: '156 MB',
    url: 'https://forever-music.oss-cn-beijing.aliyuncs.com/Forever-1.3.1-mac-arm64.zip',
  },
  {
    platform: 'macOS',
    variant: 'Intel 芯片',
    version: 'v1.3.0',
    size: '160 MB',
    url: 'https://forever-music.oss-cn-beijing.aliyuncs.com/Forever-1.3.0-mac-x64.zip',
  },
  {
    platform: 'Windows',
    variant: '安装版',
    version: 'v1.3.0',
    size: '121 MB',
    url: 'https://forever-music.oss-cn-beijing.aliyuncs.com/Forever-1.3.0-win-x64-setup.zip',
  },
  {
    platform: 'Windows',
    variant: '便携版',
    version: 'v1.3.0',
    size: '121 MB',
    url: 'https://forever-music.oss-cn-beijing.aliyuncs.com/Forever-1.3.0-win-x64-portable.zip',
  },
] as const

function ProductGuide({ name, sections }: { name: string; sections: GuideSection[] }) {
  return (
    <div className="product-guide">
      <div className="product-guide-intro"><span className="product-overline">BEHIND THE EXPERIENCE</span><h3>再靠近一点，<br />看看它如何运转。</h3><p>{name} 的使用指南、实现思考与迭代记录，都留在这里。</p><span className="product-guide-hint"><Icon name="book" size={13} />展开章节，继续阅读</span></div>
      <div className="product-guide-chapters">{sections.map((section, index) => <details key={section.title}><summary><span className="chapter-number">{String(index + 1).padStart(2, '0')}</span><h4>{section.title}</h4><Icon name="down" size={14} /></summary><div className="chapter-content">{section.items.map(item => <div key={item.title}><h5>{item.title}</h5><p>{item.text}</p></div>)}</div></details>)}</div>
    </div>
  )
}

function ForeverInstaller() {
  return (
    <section className="product-installer" aria-labelledby="forever-installer-heading">
      <div className="product-installer-copy">
        <span className="product-overline"><Icon name="download" size={13} /> DESKTOP INSTALLER</span>
        <h3 id="forever-installer-heading">把 Forever，<br />带到自己的桌面。</h3>
        <p>选择与你的电脑匹配的版本，通过阿里云 OSS 直接下载。无需提取码，百度网盘和夸克网盘保留为备用方式。</p>
      </div>
      <div className="product-direct-downloads">
        <div className="product-direct-heading"><span>阿里云 OSS 直链下载</span><small>无需提取码</small></div>
        <div className="product-direct-grid">
          {foreverDirectDownloads.map(download => (
            <a href={download.url} target="_blank" rel="noreferrer" key={`${download.platform}-${download.variant}`} aria-label={`下载 Forever ${download.platform} ${download.variant} ${download.version}`}>
              <span className="product-download-platform"><Icon name="download" size={15} /><span><strong>{download.platform}</strong><small>{download.variant}</small></span></span>
              <span className="product-download-meta"><span>{download.version}</span><span>{download.size}</span><Icon name="diagonal" size={13} /></span>
            </a>
          ))}
        </div>
      </div>
      <div className="product-installer-fallback">
        <span>网盘备用下载</span>
        <div className="product-installer-actions">
          {foreverInstallers.map(installer => (
            <div className="product-installer-action" key={installer.name}>
              <span>{installer.name}提取码 <code>{installer.code}</code></span>
              <a href={installer.url} target="_blank" rel="noreferrer">前往{installer.name}下载<Icon name="diagonal" size={14} /></a>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

export function ProductsPage() {
  const reducedMotion = useReducedMotion()
  const [override, setOverride] = useState<boolean | null>(null)
  const running = override ?? !reducedMotion
  const [active, setActive] = useState('forever')
  useEffect(() => {
    document.title = 'AI 产品作品 · 周珈如 — JIARU'
    const locate = () => {
      const requestedId = window.location.hash.slice(1)
      const id = requestedId === 'swagger' ? 'forever' : requestedId
      if (requestedId === 'swagger') window.history.replaceState(window.history.state, '', '#forever')
      const target = ['products-content', 'forever', 'rain-writer', 'products-top'].includes(id) ? document.getElementById(id) : null
      if (target) target.scrollIntoView({ behavior: 'instant', block: 'start' })
      else if (!id) window.scrollTo({ top: 0, behavior: 'instant' })
    }
    const frame = requestAnimationFrame(locate)
    window.addEventListener('hashchange', locate)
    const observer = new IntersectionObserver(entries => {
      entries.forEach(entry => { if (entry.isIntersecting) setActive(entry.target.id) })
    }, { rootMargin: '-12% 0px -65% 0px' })
    for (const id of ['forever', 'rain-writer']) {
      const element = document.getElementById(id)
      if (element) observer.observe(element)
    }
    return () => {
      cancelAnimationFrame(frame)
      observer.disconnect()
      window.removeEventListener('hashchange', locate)
      document.title = 'JIARU — 让热爱有回响'
    }
  }, [])
  return (
    <div className="products-page" data-motion={running ? 'running' : 'paused'} data-active-project={active} id="products-top">
      <div className="product-breadcrumb"><Link to="/">首页</Link><span>/</span><span>AI 产品作品</span><span className="product-archive">THE DREAM ATELIER <i /> 03</span></div>
      <section className="product-hero" aria-labelledby="products-heading">
        <motion.div className="product-hero-copy" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8 }}>
          <span className="product-hero-pill"><Icon name="spark" size={12} /> SOME IDEAS BECOME LITTLE WORLDS</span>
          <h1 id="products-heading">把一点想象，<br />做成<span>日常的微光</span>。</h1>
          <p className="product-hero-english">Little worlds, dreamed into being.</p>
          <p className="product-hero-description">一台懂你的电台，一扇落雨的窗。<br />让技术感知情绪，让微小的日常有处安放。</p>
          <a href="#products-content" className="product-primary-link">漫游我的小宇宙<Icon name="down" size={14} /></a>
          <div className="product-hero-meta"><span><strong>02</strong> 个 AI 产品探索</span><i /><span>从一个念头，到一种陪伴</span></div>
        </motion.div>
        <DreamGalaxy running={running} onToggle={() => setOverride(!running)} />
      </section>

      <nav className="product-orbit-nav" aria-label="产品章节" id="products-content">
        <span className="product-nav-caption"><Icon name="moon" size={14} /> TWO LITTLE WORLDS</span>
        <a href="#forever" aria-current={active === 'forever' ? 'location' : undefined}><span>01</span>Forever<Icon name="headphones" size={14} /></a>
        <a href="#rain-writer" aria-current={active === 'rain-writer' ? 'location' : undefined}><span>02</span>雨窗 · Rain Writer<Icon name="drop" size={14} /></a>
        <span className="product-nav-tail">沿着灵感的轨道<Icon name="spark" size={12} /></span>
      </nav>

      <article className="product-case forever-case" id="forever" aria-labelledby="forever-heading">
        <header className="product-case-heading"><div><span className="product-overline">WORLD 01 / A FREQUENCY OF YOUR OWN</span><h2 id="forever-heading">Forever<Icon name="headphones" size={26} /></h2></div><span className="product-version">私人 AI Radio <i /> v1.0.0 本地版</span></header>
        <div className="product-case-main">
          <div className="product-story">
            <span className="product-kicker">少一点选歌，多一点沉浸。</span>
            <h3>此刻想听什么，<br />让<span>懂你的电台</span>继续。</h3>
            <p className="product-story-lead">只需要说出想要的氛围。理解意图、挑选曲目、DJ 串场和下一段节目，由一台本地优先的私人电台持续串联。</p>
            <div className="product-tags"><span>自然语言交互</span><span>持续播放</span><span>长期记忆</span></div>
            <div className="product-feature"><span>01</span><div><h4>当下的意图，高于过去的偏好</h4><p>说出“两小时只听白噪音”，临时主题就成为最高优先级。历史品味帮助理解你，也给当下留出自由。</p></div></div>
            <div className="product-feature"><span>02</span><div><h4>照顾好，上一首结束的那一秒</h4><p>提前补充队列、自然结束后自动切歌、失败重试与播报后恢复进度，让整档节目持续下去。</p></div></div>
            <div className="product-feature"><span>03</span><div><h4>同一颗大脑，三种观看方式</h4><p>经典电台、唱片沉浸与玻璃桌面共享队列、进度和消息。换一个空间，音乐也能保持连续。</p></div></div>
          </div>
          <ForeverDemo />
        </div>
        <ForeverInstaller />
        <ProductFilm film={productRecordings.forever} />
        <div className="product-radio-flow"><div className="product-flow-heading"><span className="product-overline">FROM INTENT TO A CONTINUOUS PROGRAM</span><h3>一句话，如何成为一档节目？</h3></div><ol>{radioFlow.map(([title, description], index) => <li key={title}><span>{String(index + 1).padStart(2, '0')}<Icon name={index === 3 ? 'music' : 'arrow'} size={14} /></span><h4>{title}</h4><p>{description}</p></li>)}</ol><details className="radio-contract"><summary>展开模型输出契约<Icon name="down" size={13} /></summary><p>结构化计划让文案与播放器动作可以分别执行，避免从自由文本中猜测指令。</p><pre><code>{'{\n  "say": "DJ 播报内容",\n  "play": ["歌曲搜索词或歌曲 ID"],\n  "reason": "推荐原因",\n  "segue": "过渡语",\n  "playerAction": "none"\n}'}</code></pre></details></div>
        <ProductGuide name="Forever" sections={foreverGuide} />
      </article>

      <div className="product-between" aria-hidden="true"><span /><Icon name="spark" size={18} /><span /><p>from a private frequency, to a quiet window.</p></div>

      <article className="product-case rain-case" id="rain-writer" aria-labelledby="rain-heading">
        <header className="product-case-heading"><div><span className="product-overline">WORLD 02 / A WINDOW FOR YOUR THOUGHTS</span><h2 id="rain-heading">雨窗<span>Rain Writer</span><Icon name="drop" size={24} /></h2></div><span className="product-version">情绪陪伴 × 沉浸书写 <i /> v0.4</span></header>
        <div className="product-case-main">
          <div className="product-story">
            <span className="product-kicker">给纷乱的思绪，一场刚刚好的雨。</span>
            <h3>窗外在下雨，<br />心里有了<span>落笔的地方。</span></h3>
            <p className="product-story-lead">有时想要的，只是一个看得到雨、听得到雨、能顺手写点东西的角落。雨窗把天气、随手记与 AI 陪伴，放进同一张网页。</p>
            <div className="product-tags"><span>氛围交互</span><span>自动保存</span><span>AI 陪伴</span></div>
            <div className="product-feature"><span>01</span><div><h4>先安顿情绪，再开始表达</h4><p>五种天气联动画面与环境音，既可以看一场雨，也可以把雾调得更轻，让空间服从此刻的心情。</p></div></div>
            <div className="product-feature"><span>02</span><div><h4>把“开始写”变得足够简单</h4><p>中央卡片直接落笔，多篇笔记自动保存。切换、回看和新建都留在一屏，减少打断灵感的步骤。</p></div></div>
            <div className="product-feature"><span>03</span><div><h4>AI 留在需要它的地方</h4><p>侧边抽屉承载对话、旧笔记搜索和心情分析。需要时展开，独处时收起，书写始终是空间的中心。</p></div></div>
          </div>
          <RainWriterDemo running={running} />
        </div>
        <ProductFilm film={productRecordings.rain} />
        <div className="product-thought"><span>DESIGN NOTE <Icon name="spark" size={13} /></span><blockquote>天气不只是背景，<br className="product-mobile-break" />也是进入表达的一种方式。</blockquote><p>视觉、声音与文字在同一屏相遇，<br />让交互从一个动作，变成一种情境。</p></div>
        <ProductGuide name="雨窗" sections={rainGuide} />
      </article>
      <div className="product-closing"><Icon name="spark" size={23} /><p>愿每一个小小的想法，<br />都能照亮<span>某一刻的日常。</span></p><span>MADE OF CURIOSITY, CODE & A LITTLE STARDUST.</span><div><Link to="/music">去听听我的 AI 音乐<Icon name="arrow" size={14} /></Link><a href="#products-top">回到星河<Icon name="globe" size={14} /></a></div></div>
    </div>
  )
}
