import { expect, test, type Page } from '@playwright/test'
import { createHash } from 'node:crypto'
import source from '../src/data/playlists-source.json' with { type: 'json' }

// SHA-256 of newline-joined IDs in the original platform order, verified
// 2026-09-24. Keeps the regression portable without ignored research files.
const sourceOrderHashes = [
  '94be06359bddde7c40c536eba38d0b3bd0edebb1635be2aba67ba0b416632570',
  'fce60110494c60c4200e37b1295ec7e03756b5d22c5e4172a7a064958acb7c28',
  'ff2688550a56c11fede2274560b336396e6c2b57f4247d71195a9c9a12fa5175',
  'f9a6721d5e1262afb51215d793abda0d9d302e185078fdf013ce552039c775e0',
  'c609d09c8ea4466303dde22c330b8f9909b3d1eb2e92e268dd347e1c7b9bdeea',
]

async function frames(page: Page, count = 10) {
  await page.evaluate(count => new Promise<void>(resolve => {
    let current = 0
    const next = () => { if (++current >= count) resolve(); else requestAnimationFrame(next) }
    requestAnimationFrame(next)
  }), count)
}

async function instrumentFlower(page: Page) {
  await page.addInitScript(() => {
    const canvases: HTMLCanvasElement[] = []
    Object.assign(window, { flowerTestCanvases: canvases })
    const proto = WebGL2RenderingContext.prototype
    const draw = proto.drawElements
    proto.drawElements = function (...args) {
      if (this.canvas instanceof HTMLCanvasElement) {
        if (!canvases.includes(this.canvas)) canvases.push(this.canvas)
        this.canvas.dataset.testDraws = String(Number(this.canvas.dataset.testDraws ?? 0) + 1)
      }
      return draw.apply(this, args)
    }
    const getLocation = proto.getUniformLocation
    const names = new WeakMap<WebGLUniformLocation, string>()
    proto.getUniformLocation = function (program, name) {
      const result = getLocation.call(this, program, name)
      if (result) names.set(result, name)
      return result
    }
    const uniform1f = proto.uniform1f
    proto.uniform1f = function (location, value) {
      // Floating petals have a fixed uBloom=1; the minimum catches the bud.
      if (location && names.get(location) === 'uBloom' && this.canvas instanceof HTMLCanvasElement && value !== 1) {
        this.canvas.dataset.testBloom = String(value)
      }
      return uniform1f.call(this, location, value)
    }
    const deleteBuffer = proto.deleteBuffer
    proto.deleteBuffer = function (buffer) {
      if (this.canvas instanceof HTMLCanvasElement) this.canvas.dataset.testDeleted = String(Number(this.canvas.dataset.testDeleted ?? 0) + 1)
      return deleteBuffer.call(this, buffer)
    }
  })
}

test('home defers the playlist route until navigation intent while pinyin waits for search', async ({ page }) => {
  const requests: string[] = []
  page.on('request', request => requests.push(new URL(request.url()).pathname))
  await page.addInitScript(() => sessionStorage.setItem('jiaru-home-opening:v1:default', 'seen'))
  await page.goto('/')
  await expect(page.locator('.particle-ribbon')).toHaveClass(/is-ready/)
  expect(requests.some(path => path.endsWith('/src/pages/PlaylistsPage.tsx'))).toBe(false)
  expect(requests.some(path => path.endsWith('/src/components/PlaylistFlower.tsx'))).toBe(false)
  const playlistLink = page.getByRole('link', { name: '探索个人精选歌单', exact: true })
  await playlistLink.hover()
  await expect.poll(() => requests.some(path => path.endsWith('/src/pages/PlaylistsPage.tsx'))).toBe(true)
  await expect.poll(() => requests.some(path => path.endsWith('/src/components/PlaylistFlower.tsx'))).toBe(true)
  expect(requests.some(path => path.endsWith('/src/data/playlistSearch.ts'))).toBe(false)
  await playlistLink.click()
  await expect(page).toHaveURL(/\/playlists$/)
  await expect(page.getByRole('heading', { name: /把喜欢的旋律/ })).toBeVisible()
  await expect(page.getByText('音乐花园正在盛开…')).toHaveCount(0)
  expect(requests.some(path => path.endsWith('/src/data/playlistSearch.ts'))).toBe(false)
  await page.getByRole('searchbox', { name: '搜索当前歌单' }).focus()
  await expect.poll(() => requests.some(path => path.endsWith('/src/data/playlistSearch.ts'))).toBe(true)
})

test('five complete playlists preserve source IDs, order, editions and every platform URL', async ({ page }) => {
  const errors: string[] = []
  page.on('pageerror', error => errors.push(error.message))
  await page.goto('/playlists')
  await expect(page).toHaveTitle('精选歌单 · 周珈如 — JIARU')
  await expect(page.locator('.playlist-card')).toHaveCount(5)
  expect(source.map(list => list.count)).toEqual([14, 37, 21, 22, 58])
  for (const [index, playlist] of source.entries()) {
    const orderHash = createHash('sha256').update(playlist.tracks.map(track => track.id).join('\n')).digest('hex')
    expect(orderHash).toBe(sourceOrderHashes[index])
    await page.locator('.playlist-card').nth(index).click()
    await expect(page.locator('.playlist-detail')).toHaveAttribute('data-playlist-id', playlist.id)
    await expect(page.locator('.playlist-platform-link')).toHaveAttribute('href', playlist.url)
    await expect(page.locator('.playlist-table tbody tr')).toHaveCount(8)
    await page.getByRole('button', { name: `展开全部 ${playlist.count} 首` }).click()
    const rows = page.locator('.playlist-table tbody tr')
    await expect(rows).toHaveCount(playlist.count)
    const rendered = await rows.evaluateAll(rows => rows.map(row => ({
      id: row.getAttribute('data-track-id'),
      title: row.querySelector('strong')?.textContent,
      artists: row.querySelector('.playlist-track-title > span')?.textContent,
      urls: [...row.querySelectorAll('a')].map(link => [link.href, link.target, link.rel]),
    })))
    for (const [trackIndex, row] of rendered.entries()) {
      const track = playlist.tracks[trackIndex]
      expect(row.id).toBe(track.id)
      expect(row.title).toBe(track.title)
      expect(row.artists).toBe(track.artists.join(' / '))
      expect(row.urls).toEqual([[track.url, '_blank', 'noreferrer'], [track.url, '_blank', 'noreferrer']])
    }
    await page.getByRole('button', { name: '收起曲目' }).click()
    await expect(rows).toHaveCount(8)
  }
  await expect(page).toHaveURL(/list=qq-kpop$/)
  await page.goBack()
  await expect(page.locator('.playlist-detail')).toHaveAttribute('data-playlist-id', 'qq-ost')
  await page.reload()
  await expect(page.locator('.playlist-detail')).toHaveAttribute('data-playlist-id', 'qq-ost')
  await page.goto('/playlists?list=unknown')
  await expect(page.locator('.playlist-detail')).toHaveAttribute('data-playlist-id', 'netease-kpop')
  expect(errors).toEqual([])
})

test('search: OR keywords, full and initial pinyin, aliases, no results and uninterrupted IME', async ({ page }) => {
  await page.goto('/playlists?list=netease-cpop')
  const input = page.getByRole('searchbox', { name: '搜索当前歌单' })
  const titles = page.locator('.playlist-track-title strong')
  await input.fill('shuixingji')
  await expect(titles).toHaveText(['水星记'])
  await input.fill('sxj')
  await expect(titles).toHaveText(['水星记'])
  await input.fill('guoding')
  await expect(titles).toHaveText(['水星记'])
  await input.fill('水星记 小幸运')
  await expect(titles).toHaveText(['小幸运', '水星记'])
  await expect(page.locator('.playlist-track-title').first()).toContainText('田馥甄的小迷妹')
  await input.fill('飞行器的执行周期')
  await expect(titles).toHaveText(['水星记'])
  await input.fill('没有这首歌曲zzz')
  await expect(page.locator('.playlist-empty')).toBeVisible()
  await page.getByRole('button', { name: '清除搜索', exact: true }).click()
  await expect(input).toBeFocused()
  await input.dispatchEvent('compositionstart', { data: '' })
  await input.fill('水')
  await input.dispatchEvent('compositionupdate', { data: '水' })
  await expect(titles).toHaveCount(8)
  await input.fill('水星记')
  await expect(input).toHaveValue('水星记')
  await input.dispatchEvent('compositionend', { data: '水星记' })
  await expect(input).toBeFocused()
  await expect(titles).toHaveText(['水星记'])
  await input.press('Escape')
  await expect(input).toHaveValue('')
  await expect(titles).toHaveCount(8)
  await page.locator('.playlist-card').first().click()
  await expect(page.locator('.playlist-detail')).toHaveAttribute('data-playlist-id', 'netease-kpop')
  await input.fill('舞落的花瓣')
  await expect(titles).toHaveText(["舞い落ちる花びら（Fallin' Flower）"])
  await input.fill('rose')
  await expect(titles).toHaveText(['Gone'])
})

test('flower: real GPU morph, keyboard, pause, offscreen suspension and route cleanup', async ({ page }) => {
  const errors: string[] = []
  page.on('pageerror', error => errors.push(error.message))
  page.on('console', message => { if (message.type() === 'error') errors.push(message.text()) })
  await instrumentFlower(page)
  await page.goto('/playlists')
  const flower = page.locator('.playlist-flower')
  const canvas = page.locator('.flower-canvas canvas')
  await expect(flower).toHaveClass(/is-ready/)
  await expect.poll(async () => Number(await canvas.getAttribute('data-test-bloom'))).toBeGreaterThan(0.98)
  await expect(page.locator('.playlist-intro')).toHaveCSS('opacity', '1')
  await page.screenshot({ path: '.artifacts/playlists-desktop.png', fullPage: true })
  await page.screenshot({ path: '.artifacts/playlists-desktop-first-screen.png' })
  await page.getByRole('button', { name: '收拢花朵', exact: true }).focus()
  await page.keyboard.press('Enter')
  await expect(flower).toHaveAttribute('data-bloom', 'closed')
  await expect.poll(async () => Number(await canvas.getAttribute('data-test-bloom'))).toBeLessThan(0.02)
  await page.locator('.playlist-art').screenshot({ path: '.artifacts/playlists-flower-bud.png' })
  await page.getByRole('button', { name: '绽放花朵', exact: true }).click()
  await expect.poll(async () => Number(await canvas.getAttribute('data-test-bloom'))).toBeGreaterThan(0.98)
  await page.mouse.move(1200, 250)
  const before = Number(await canvas.getAttribute('data-test-draws'))
  await expect.poll(async () => Number(await canvas.getAttribute('data-test-draws'))).toBeGreaterThan(before)
  await page.getByRole('button', { name: '暂停花朵动效' }).click()
  await expect(flower).toHaveAttribute('data-motion', 'paused')
  await frames(page)
  const frozen = await canvas.getAttribute('data-test-draws')
  await frames(page, 15)
  expect(await canvas.getAttribute('data-test-draws')).toBe(frozen)
  await page.getByRole('button', { name: '播放花朵动效' }).click()
  await page.locator('.playlist-source-note').scrollIntoViewIfNeeded()
  await frames(page)
  const offscreen = await canvas.getAttribute('data-test-draws')
  await frames(page, 15)
  expect(await canvas.getAttribute('data-test-draws')).toBe(offscreen)
  await page.getByRole('link', { name: 'JIARU 首页' }).click()
  await expect(page.locator('.playlist-flower')).toHaveCount(0)
  const cleanup = await page.evaluate(() => {
    const canvas = (window as unknown as { flowerTestCanvases: HTMLCanvasElement[] }).flowerTestCanvases[0]
    return { connected: canvas.isConnected, buffersDeleted: Number(canvas.dataset.testDeleted) }
  })
  expect(cleanup.connected).toBe(false)
  expect(cleanup.buffersDeleted).toBeGreaterThan(0)
  expect(errors).toEqual([])
})

test('mobile: reduced motion, theme carousel, full metadata, touch bloom and all widths', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 })
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await page.goto('/playlists')
  await expect(page.locator('.playlist-flower')).toHaveClass(/is-ready/)
  await expect(page.locator('.playlist-flower')).toHaveAttribute('data-motion', 'paused')
  await expect(page.locator('.playlist-intro')).toHaveCSS('opacity', '1')
  await page.screenshot({ path: '.artifacts/playlists-mobile.png', fullPage: true })
  await page.screenshot({ path: '.artifacts/playlists-mobile-first-screen.png' })
  await page.getByRole('button', { name: '收拢花朵', exact: true }).click()
  await expect(page.locator('.playlist-flower')).toHaveAttribute('data-bloom', 'closed')
  await page.getByRole('button', { name: '绽放花朵', exact: true }).click()
  await expect(page.locator('.playlist-flower')).toHaveAttribute('data-bloom', 'open')
  await page.locator('.playlist-card').last().click()
  await expect(page.locator('.playlist-detail')).toHaveAttribute('data-playlist-id', 'qq-kpop')
  await expect(page.locator('.playlist-mobile-album').first()).toBeVisible()
  await page.getByRole('button', { name: '展开全部 58 首' }).click()
  await expect(page.locator('.playlist-table tbody tr')).toHaveCount(58)
  for (const width of [320, 390, 628, 768, 1024, 1440]) {
    await page.setViewportSize({ width, height: 900 })
    await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), { message: `no overflow at ${width}` }).toBe(true)
  }
  await page.setViewportSize({ width: 390, height: 844 })
  await page.getByRole('button', { name: '收起曲目' }).click()
  await page.locator('.playlist-tracks').screenshot({ path: '.artifacts/playlists-mobile-tracks.png' })
})

test('WebGL unavailable: botanical fallback, all songs, search and source links remain accessible', async ({ page }) => {
  await page.addInitScript(() => {
    const original = HTMLCanvasElement.prototype.getContext
    HTMLCanvasElement.prototype.getContext = function (...args: Parameters<typeof original>) {
      if (String(args[0]).startsWith('webgl')) return null
      return original.apply(this, args)
    } as typeof original
  })
  await page.goto('/playlists?list=netease-classical')
  await expect(page.locator('.flower-fallback')).toBeVisible()
  await expect(page.getByRole('button', { name: '重新加载花朵动效' })).toBeVisible()
  await page.getByRole('button', { name: '展开全部 21 首' }).click()
  await expect(page.locator('.playlist-table tbody tr')).toHaveCount(21)
  await expect(page.locator('.playlist-platform-link')).toHaveAttribute('href', 'https://music.163.com/playlist?id=17983561617')
  await page.getByRole('searchbox').fill('Clair')
  await expect(page.locator('.playlist-track-title strong')).toContainText(['Clair De Lune'])
})
