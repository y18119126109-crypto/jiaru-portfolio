import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App'
import { NavigationProvider } from './components/PreparedNavigation'
import './styles.css'

// #region debug-point A:E:main-evaluated
fetch('http://127.0.0.1:7777/event', { method: 'POST', body: JSON.stringify({ sessionId: 'mobile-home-white-screen', runId: 'iteration-2-post-fix', hypothesisId: 'A,E', location: 'src/main.tsx:entry', msg: '[DEBUG] Main module evaluated', data: { now: performance.now(), bootVisible: Boolean(document.getElementById('boot-loader')) }, ts: Date.now() }) }).catch(() => {})
// #endregion

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <NavigationProvider>
        <App />
      </NavigationProvider>
    </BrowserRouter>
  </StrictMode>,
)
