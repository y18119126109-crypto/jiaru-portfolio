import { Icon } from './Icon'

export function StatsBar() {
  return (
    <footer className="stats-bar flex flex-wrap items-center justify-between gap-5">
      <div className="footer-message flex items-center gap-2.5"><span className="status-dot" />在创造中发现自己，在分享中遇见同频。</div>
      <div className="footer-center flex items-center gap-3" aria-label="音乐与人工智能的交汇"><span>MUSIC</span><Icon name="spark" size={11} /><span>AI</span><Icon name="spark" size={11} /><span>LIFE</span></div>
      <div className="footer-signature flex items-center gap-2"><span>Made with curiosity</span><Icon name="spark" size={12} /><span>© {new Date().getFullYear()} Jiaru</span></div>
    </footer>
  )
}
