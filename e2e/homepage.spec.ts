import { expect, test } from '@playwright/test'
import { mkdirSync } from 'node:fs'

const captureDir = '.artifacts'
test.beforeAll(() => mkdirSync(captureDir, { recursive: true }))
test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => sessionStorage.setItem('jiaru-home-opening:v1:default', 'seen'))
})

test('initial document shows a boot state before React is available', async ({ page }) => {
  let release: () => void = () => {}
  const waiting = new Promise<void>(resolve => { release = resolve })
  await page.route('**/src/main.tsx', async route => {
    await waiting
    await route.continue()
  })
  await page.goto('/', { waitUntil: 'commit' })
  const loader = page.locator('#boot-loader')
  await expect(loader).toBeVisible()
  await expect(loader).toContainText('JIARU.')
  await expect(loader).toContainText('让灵感生长')
  await expect(loader).toContainText('让热爱有回响')
  await expect(loader).toContainText('A little curiosity. A little creation.')
  await expect(loader).toContainText('正在打开这片个人空间')
  await page.screenshot({ path: `${captureDir}/homepage-boot-loading.png` })
  release()
  await expect(page.locator('.particle-ribbon')).toHaveClass(/is-ready/)
  await expect(loader).toHaveCount(0)
})

test('initial boot state offers recovery when the app takes too long', async ({ page }) => {
  let release: () => void = () => {}
  const waiting = new Promise<void>(resolve => { release = resolve })
  await page.addInitScript(() => {
    const nativeTimeout = window.setTimeout.bind(window)
    window.setTimeout = ((handler: TimerHandler, timeout?: number, ...args: unknown[]) => (
      nativeTimeout(handler, timeout === 15_000 ? 20 : timeout, ...args)
    )) as typeof window.setTimeout
  })
  await page.route('**/src/main.tsx', async route => {
    await waiting
    await route.continue()
  })
  await page.goto('/', { waitUntil: 'commit' })
  await expect(page.locator('#boot-message')).toHaveText('加载时间有点久，请检查网络后重新加载。')
  await expect(page.getByRole('button', { name: '重新加载' })).toBeVisible()
  release()
})

test('desktop: live WebGL, pause/resume, four destinations, history and keyboard', async ({ page }) => {
  const errors: string[] = []
  page.on('pageerror', error => errors.push(error.message))
  page.on('console', message => {
    if (message.type() === 'error') errors.push(message.text())
  })
  // Observe real GPU submissions, without relying on byte-identical browser
  // screenshots (glass compositing can vary even when the canvas is frozen).
  await page.addInitScript(() => {
    const draw = WebGL2RenderingContext.prototype.drawArrays
    WebGL2RenderingContext.prototype.drawArrays = function (...args) {
      if (this.canvas instanceof HTMLCanvasElement) {
        this.canvas.dataset.testDraws = String(Number(this.canvas.dataset.testDraws ?? 0) + 1)
      }
      return draw.apply(this, args)
    }
  })
  await page.goto('/')
  await expect(page.locator('.particle-ribbon')).toHaveClass(/is-ready/)
  await expect(page.locator('canvas')).toHaveAttribute('data-particle-count', '6000')
  await expect(page.locator('.explore-card')).toHaveCount(4)
  await expect(page.locator('.particle-fallback')).toHaveCount(0)
  await expect(page.locator('.particle-canvas')).toHaveCSS('opacity', '1')
  await expect(page.locator('.hero-art')).toHaveCSS('opacity', '1')
  await page.screenshot({ path: `${captureDir}/homepage-desktop.png`, fullPage: true })

  const canvas = page.locator('canvas')
  const initialDraws = Number(await canvas.getAttribute('data-test-draws'))
  await expect.poll(async () => Number(await canvas.getAttribute('data-test-draws'))).toBeGreaterThan(initialDraws)
  await page.getByRole('button', { name: '暂停粒子动效' }).click()
  await expect(page.locator('.particle-ribbon')).toHaveAttribute('data-motion', 'paused')
  const frozenDraws = await canvas.getAttribute('data-test-draws')
  await page.evaluate(() => new Promise<void>(resolve => {
    let frames = 0
    function next() { if (++frames >= 5) resolve(); else requestAnimationFrame(next) }
    requestAnimationFrame(next)
  }))
  expect(await canvas.getAttribute('data-test-draws'), 'paused sculpture must stop GPU submissions').toBe(frozenDraws)
  await page.getByRole('button', { name: '播放粒子动效' }).click()
  await expect(page.locator('.particle-ribbon')).toHaveAttribute('data-motion', 'running')

  for (const [name, path] of [
    ['个人简历', '/resume'],
    ['AI 音乐创作', '/music'],
    ['AI 产品作品', '/products'],
    ['个人精选歌单', '/playlists'],
  ]) {
    await page.getByRole('link', { name: `探索${name}`, exact: true }).click()
    await expect(page).toHaveURL(new RegExp(`${path}$`))
    if (path === '/resume') {
      await expect(page.getByRole('heading', { name: '周珈如 Jiaru Zhou' })).toBeVisible()
      await expect(page.getByRole('dialog')).toHaveCount(0)
      await page.getByRole('link', { name: 'JIARU 首页' }).click()
    } else if (path === '/music') {
      await expect(page.locator('.song-story')).toHaveCount(2)
      await expect(page.getByRole('region', { name: '音乐播放器' })).toBeVisible()
      await expect(page.getByRole('dialog')).toHaveCount(0)
      await page.getByRole('link', { name: 'JIARU 首页' }).click()
    } else if (path === '/playlists') {
      await expect(page.locator('.playlist-card')).toHaveCount(5)
      await expect(page.locator('.playlist-detail')).toHaveAttribute('data-playlist-id', 'netease-kpop')
      await expect(page.getByRole('dialog')).toHaveCount(0)
      await page.getByRole('link', { name: 'JIARU 首页' }).click()
    } else if (path === '/products') {
      await expect(page.locator('.product-case')).toHaveCount(2)
      await expect(page.getByRole('dialog')).toHaveCount(0)
      await page.getByRole('link', { name: 'JIARU 首页' }).click()
    } else {
      await expect(page.getByRole('dialog')).toBeVisible()
      await expect(page.getByRole('dialog').getByRole('heading', { name, exact: true })).toBeVisible()
      await page.keyboard.press('Escape')
    }
    await expect(page).toHaveURL(/\/$/)
    await expect(page.getByRole('dialog')).toHaveCount(0)
  }
  await page.getByRole('link', { name: '认识我', exact: true }).click()
  await page.goBack()
  await expect(page.getByRole('dialog')).toHaveCount(0)
  await page.getByRole('button', { name: '开始探索', exact: true }).click()
  await expect(page.locator('#explore')).toBeFocused()
  expect(errors).toEqual([])
})

test('navigation waits for critical page resources and shows a clear loading state', async ({ page }) => {
  let release: () => void = () => {}
  const waiting = new Promise<void>(resolve => { release = resolve })
  await page.route('**/src/components/MusicParticles.tsx', async route => {
    await waiting
    await route.continue()
  })
  await page.goto('/')
  await expect(page.locator('.particle-ribbon')).toHaveClass(/is-ready/)
  await page.getByRole('link', { name: '探索AI 音乐创作', exact: true }).click()
  await expect(page).toHaveURL(/\/$/)
  await expect(page.locator('.route-transition')).toBeVisible()
  await expect(page.locator('.route-transition-panel')).toContainText('AI 音乐创作')
  await expect(page.locator('.route-transition-panel')).toContainText('这一页的内容与画面准备好后，会自动进入')
  await page.screenshot({ path: '.artifacts/navigation-loading.png' })
  release()
  await expect(page).toHaveURL(/\/music$/)
  await expect(page.locator('.route-transition')).toHaveCount(0)
  await expect(page.locator('.music-particle-host')).toBeVisible()
})

test('responsive: layout, mobile menu and direct links', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 })
  await page.goto('/')
  await expect(page.locator('.particle-ribbon')).toHaveClass(/is-ready/)
  await expect(page.locator('canvas')).toHaveAttribute('data-particle-count', '4000')
  await page.getByRole('button', { name: '打开导航菜单' }).click()
  await expect(page.locator('#mobile-nav')).toBeVisible()
  await page.locator('#mobile-nav').getByRole('link', { name: 'AI 音乐创作' }).click()
  await expect(page.locator('.song-story')).toHaveCount(2)
  await expect(page.getByRole('dialog')).toHaveCount(0)
  await page.getByRole('link', { name: 'JIARU 首页' }).click()
  await expect(page.locator('.explore-card')).toHaveCount(4)
  await expect(page.getByRole('dialog')).toHaveCount(0)
  await expect(page.locator('#mobile-nav')).toHaveCount(0)
  // Reveal the entrance animations before taking a full-page reference image.
  for (const card of await page.locator('.explore-card').all()) {
    await card.scrollIntoViewIfNeeded()
    await expect(card.locator('..')).toHaveCSS('opacity', '1')
  }
  await page.mouse.wheel(0, -4000)
  await expect.poll(() => page.evaluate(() => window.scrollY)).toBe(0)
  await page.screenshot({ path: `${captureDir}/homepage-mobile.png`, fullPage: true })

  for (const width of [320, 390, 628, 768, 1024, 1440]) {
    await page.setViewportSize({ width, height: 900 })
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), `no overflow at ${width}px`).toBe(true)
    const heading = await page.locator('h1').boundingBox()
    const art = await page.locator('.hero-art').boundingBox()
    expect(heading).not.toBeNull()
    expect(art).not.toBeNull()
    if (width >= 768) expect(heading!.x + heading!.width).toBeLessThanOrEqual(art!.x + 3)
  }
  await page.goto('/playlists')
  await expect(page.locator('.playlist-card')).toHaveCount(5)
  await expect(page.getByRole('dialog')).toHaveCount(0)
  await page.getByRole('link', { name: 'JIARU 首页' }).click()
  await expect(page).toHaveURL(/\/$/)
  await page.goto('/unknown-page')
  await expect(page.getByRole('heading', { name: '这个角落，还没有故事' })).toBeVisible()
})

test('reduced motion defaults to a still sculpture and remains user-controllable', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await page.goto('/')
  await expect(page.locator('.particle-ribbon')).toHaveClass(/is-ready/)
  await expect(page.locator('.particle-ribbon')).toHaveAttribute('data-motion', 'paused')
  await expect(page.getByRole('button', { name: '播放粒子动效' })).toBeVisible()
  await page.getByRole('button', { name: '播放粒子动效' }).click()
  await expect(page.locator('.particle-ribbon')).toHaveAttribute('data-motion', 'running')
})

test('WebGL unavailable: readable fallback, retry and navigation remain available', async ({ page }) => {
  await page.addInitScript(() => {
    const original = HTMLCanvasElement.prototype.getContext
    HTMLCanvasElement.prototype.getContext = function (...args: Parameters<typeof original>) {
      if (String(args[0]).startsWith('webgl')) return null
      return original.apply(this, args)
    } as typeof original
  })
  await page.goto('/')
  await expect(page.locator('.particle-fallback')).toBeVisible()
  await expect(page.getByRole('button', { name: '重新加载' })).toBeVisible()
  await page.getByRole('link', { name: '探索AI 产品作品', exact: true }).click()
  await expect(page.locator('.product-case')).toHaveCount(2)
  await expect(page.locator('.galaxy-fallback')).toBeVisible()
})
