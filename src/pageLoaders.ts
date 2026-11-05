import { parseSiteRoute } from './siteRouting'

export const loadResumePage = () => import('./pages/ResumePage')
export const loadMusicPage = () => import('./pages/MusicPage')
export const loadPlaylistsPage = () => import('./pages/PlaylistsPage')
export const loadProductsPage = () => import('./pages/ProductsPage')

export const pageLabels: Record<string, string> = {
  '/': '首页',
  '/resume': '个人简历',
  '/music': 'AI 音乐创作',
  '/playlists': '精选歌单',
  '/products': 'AI 产品作品',
}

function preloadImage(src: string) {
  if (typeof Image === 'undefined') return Promise.resolve()
  return new Promise<void>(resolve => {
    const image = new Image()
    let finished = false
    const finish = () => {
      if (finished) return
      finished = true
      if (image.decode) void image.decode().catch(() => {}).finally(resolve)
      else resolve()
    }
    image.onload = finish
    image.onerror = () => resolve()
    image.src = src
    if (image.complete) finish()
  })
}

const preparations: Record<string, () => Promise<unknown>> = {
  '/': () => import('./components/ParticleRibbon'),
  '/resume': () => Promise.all([loadResumePage(), import('./components/WaterBackdrop')]),
  '/music': () => Promise.all([loadMusicPage(), import('./components/MusicParticles')]),
  '/playlists': () => Promise.all([loadPlaylistsPage(), import('./components/PlaylistFlower')]),
  '/products': () => Promise.all([
    loadProductsPage(),
    preloadImage('/video/products/rain-writer-poster.jpg'),
    preloadImage('/video/products/swagger-poster.jpg'),
  ]),
}

const prepared = new Set<string>()
const pending = new Map<string, Promise<void>>()
const preparationTimeout = 20_000

export function pagePath(target: string) {
  const pathname = target.split(/[?#]/u)[0] || '/'
  return parseSiteRoute(pathname).pagePath
}

export function isPagePrepared(target: string) {
  return prepared.has(pagePath(target))
}

export function preparePage(target: string) {
  const path = pagePath(target)
  if (prepared.has(path) || !preparations[path]) return Promise.resolve()
  const existing = pending.get(path)
  if (existing) return existing
  let timeout = 0
  const expired = new Promise<never>((_, reject) => {
    timeout = window.setTimeout(() => reject(new Error(`Page preparation timed out: ${path}`)), preparationTimeout)
  })
  const task = Promise.race([preparations[path](), expired])
    .then(() => { prepared.add(path) })
    .catch(error => {
      pending.delete(path)
      throw error
    })
    .finally(() => window.clearTimeout(timeout))
  pending.set(path, task)
  return task
}

export function preloadPage(target: string) {
  void preparePage(target).catch(() => {
    // Navigation retries a transient preload failure and can show recovery UI.
  })
}
