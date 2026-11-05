import {
  createContext, useCallback, useContext, useRef, useState, type MouseEvent, type ReactNode,
} from 'react'
import {
  Link as RouterLink, useLocation, useNavigate, type LinkProps, type NavigateOptions, type To,
} from 'react-router-dom'
import { isPagePrepared, pageLabels, pagePath, preparePage, preloadPage } from '../pageLoaders'
import { scopeSiteTarget } from '../siteRouting'
import { Icon } from './Icon'

type NavigationRequest = {
  to: To
  options?: NavigateOptions
  path: string
  label: string
}

type TransitionState =
  | { status: 'idle' }
  | { status: 'loading'; request: NavigationRequest }
  | { status: 'error'; request: NavigationRequest }

const PreparedNavigationContext = createContext<{
  open: (to: To, options?: NavigateOptions) => void
} | null>(null)

function targetPath(to: To, currentPath: string) {
  if (typeof to === 'string') return to.startsWith('#') ? currentPath : to.split(/[?#]/u)[0] || '/'
  return to.pathname ? to.pathname.split(/[?#]/u)[0] || '/' : currentPath
}

function scopedTarget(to: To, currentPath: string): To {
  if (typeof to === 'string') return scopeSiteTarget(to, currentPath)
  if (!to.pathname) return to
  return { ...to, pathname: scopeSiteTarget(to.pathname, currentPath) }
}

export function NavigationProvider({ children }: { children: ReactNode }) {
  const navigate = useNavigate()
  const location = useLocation()
  const sequence = useRef(0)
  const [transition, setTransition] = useState<TransitionState>({ status: 'idle' })

  const run = useCallback((request: NavigationRequest) => {
    const ticket = ++sequence.current
    if (request.path === location.pathname || isPagePrepared(request.path)) {
      navigate(request.to, request.options)
      setTransition({ status: 'idle' })
      return
    }
    setTransition({ status: 'loading', request })
    void preparePage(request.path)
      .then(() => {
        if (sequence.current !== ticket) return
        navigate(request.to, request.options)
        setTransition({ status: 'idle' })
      })
      .catch(() => {
        if (sequence.current === ticket) setTransition({ status: 'error', request })
      })
  }, [location.pathname, navigate])

  const open = useCallback((to: To, options?: NavigateOptions) => {
    const resolvedTo = scopedTarget(to, location.pathname)
    const path = targetPath(resolvedTo, location.pathname)
    run({ to: resolvedTo, options, path, label: pageLabels[pagePath(path)] ?? '下一页' })
  }, [location.pathname, run])

  const close = () => {
    sequence.current += 1
    setTransition({ status: 'idle' })
  }

  return (
    <PreparedNavigationContext.Provider value={{ open }}>
      {children}
      {transition.status !== 'idle' && (
        <div className="route-transition" aria-live="polite">
          <div className="route-transition-panel" role={transition.status === 'error' ? 'alert' : 'status'}>
            {transition.status === 'loading' ? <span className="route-transition-spinner" aria-hidden="true" /> : <Icon name="spark" size={22} />}
            <span>{transition.status === 'loading' ? '正在准备页面' : '页面暂时没有准备好'}</span>
            <strong>{transition.request.label}</strong>
            <p>{transition.status === 'loading' ? '这一页的内容与画面准备好后，会自动进入。' : '网络连接中断或资源暂时不可用，请重试。'}</p>
            {transition.status === 'error' && (
              <div>
                <button type="button" onClick={() => run(transition.request)}>重新加载<Icon name="arrow" size={13} /></button>
                <button type="button" onClick={close}>留在当前页面</button>
              </div>
            )}
          </div>
        </div>
      )}
    </PreparedNavigationContext.Provider>
  )
}

export function PreparedLink({
  to, onClick, onPointerEnter, onPointerDown, onFocus, target, reloadDocument, ...props
}: LinkProps) {
  const context = useContext(PreparedNavigationContext)
  const location = useLocation()
  const resolvedTo = scopedTarget(to, location.pathname)
  const path = targetPath(resolvedTo, location.pathname)
  const warm = () => preloadPage(path)
  const handleClick = (event: MouseEvent<HTMLAnchorElement>) => {
    onClick?.(event)
    if (
      event.defaultPrevented || reloadDocument || (target && target !== '_self') || event.button !== 0
      || event.metaKey || event.ctrlKey || event.altKey || event.shiftKey || !context
    ) return
    event.preventDefault()
    context.open(to, {
      preventScrollReset: props.preventScrollReset,
      relative: props.relative,
      replace: props.replace,
      state: props.state,
      viewTransition: props.viewTransition,
    })
  }
  return (
    <RouterLink
      {...props}
      to={resolvedTo}
      target={target}
      reloadDocument={reloadDocument}
      onClick={handleClick}
      onPointerEnter={event => { onPointerEnter?.(event); warm() }}
      onPointerDown={event => { onPointerDown?.(event); warm() }}
      onFocus={event => { onFocus?.(event); warm() }}
    />
  )
}

export function PageLoading({ label }: { label: string }) {
  return (
    <div className="page-loading" role="status">
      <span className="route-transition-spinner" aria-hidden="true" />
      <strong>{label}</strong>
      <p>这一页的内容与画面正在准备中…</p>
    </div>
  )
}
