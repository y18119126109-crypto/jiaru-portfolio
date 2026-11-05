import { expect, test, type Locator } from '@playwright/test'

async function decoded(video: Locator) {
  await expect.poll(() => video.evaluate((el: HTMLVideoElement) => el.getVideoPlaybackQuality().totalVideoFrames)).toBeGreaterThan(0)
}
async function at(video: Locator, target: number) {
  await expect.poll(() => video.evaluate((el: HTMLVideoElement) => el.currentTime)).toBeGreaterThanOrEqual(target - 0.3)
  expect(await video.evaluate((el: HTMLVideoElement) => el.currentTime)).toBeLessThan(target + 3)
  await decoded(video)
}
async function framePixels(video: Locator) {
  return video.evaluate((el: HTMLVideoElement) => {
    const canvas = document.createElement('canvas')
    canvas.width = 24; canvas.height = 12
    const context = canvas.getContext('2d')!
    context.drawImage(el, 0, 0, 24, 12)
    return Array.from(context.getImageData(0, 0, 24, 12).data).join(',')
  })
}

test('product films: lazy full recordings, decoded chapters, paused seek, fullscreen and offscreen pause', async ({ page }) => {
  test.setTimeout(60_000)
  const errors: string[] = []
  const requests: string[] = []
  page.on('pageerror', error => errors.push(error.message))
  page.on('request', request => { if (request.url().endsWith('.mp4')) requests.push(request.url()) })
  await page.goto('/products')
  await expect(page.locator('.dream-galaxy')).toHaveClass(/is-ready/)
  expect(requests).toEqual([])
  const rain = page.locator('[data-film="rain-writer"]')
  const video = rain.locator('video')
  await rain.getByRole('button', { name: '播放雨窗实录' }).click()
  await expect.poll(() => video.evaluate((el: HTMLVideoElement) => el.paused)).toBe(false)
  await decoded(video)
  expect(await video.evaluate((el: HTMLVideoElement) => el.duration)).toBeCloseTo(119.92, 0)
  expect(await video.evaluate((el: HTMLVideoElement) => el.videoWidth)).toBe(1920)
  await rain.getByRole('button', { name: '暂停雨窗视频' }).click()
  const firstFrame = await framePixels(video)
  await rain.getByRole('slider').fill('91')
  await at(video, 91)
  await expect.poll(() => video.evaluate((el: HTMLVideoElement) => el.seeking)).toBe(false)
  expect(await video.evaluate((el: HTMLVideoElement) => el.paused)).toBe(true)
  expect(await framePixels(video)).not.toBe(firstFrame)
  await rain.screenshot({ path: '.artifacts/products-rain-film.png' })
  await rain.getByRole('button', { name: /00:32 心情分析/ }).click()
  await at(video, 32)
  await expect.poll(() => video.evaluate((el: HTMLVideoElement) => el.paused)).toBe(false)
  await rain.getByRole('button', { name: '全屏观看雨窗' }).click()
  await expect.poll(() => page.evaluate(() => document.fullscreenElement?.className)).toBe('film-player')
  await rain.getByRole('button', { name: '全屏观看雨窗' }).click()
  await expect.poll(() => page.evaluate(() => document.fullscreenElement)).toBeNull()
  const forever = page.locator('[data-film="forever"]')
  await forever.getByRole('button', { name: /01:54 玻璃桌面/ }).click()
  await expect.poll(() => video.evaluate((el: HTMLVideoElement) => el.paused)).toBe(true)
  const other = forever.locator('video')
  await at(other, 114)
  await expect.poll(() => other.evaluate((el: HTMLVideoElement) => el.paused)).toBe(false)
  expect(await other.evaluate((el: HTMLVideoElement) => el.duration)).toBeCloseTo(124.08, 0)
  await forever.screenshot({ path: '.artifacts/products-forever-film.png' })
  await page.evaluate(() => {
    Object.defineProperty(document, 'hidden', { configurable: true, value: true })
    document.dispatchEvent(new Event('visibilitychange'))
  })
  await expect.poll(() => other.evaluate((el: HTMLVideoElement) => el.paused)).toBe(true)
  await page.evaluate(() => {
    Object.defineProperty(document, 'hidden', { configurable: true, value: false })
    document.dispatchEvent(new Event('visibilitychange'))
  })
  expect(await other.evaluate((el: HTMLVideoElement) => el.paused)).toBe(true)
  // Both films visible at once: verify the shared playback signal independently
  // of the offscreen observer.
  await page.setViewportSize({ width: 1440, height: 8000 })
  await rain.getByRole('button', { name: '播放雨窗视频' }).click()
  await expect.poll(() => video.evaluate((el: HTMLVideoElement) => el.paused)).toBe(false)
  await forever.getByRole('button', { name: '播放Forever视频' }).click()
  await expect.poll(() => other.evaluate((el: HTMLVideoElement) => el.paused)).toBe(false)
  await expect.poll(() => video.evaluate((el: HTMLVideoElement) => el.paused)).toBe(true)
  await page.setViewportSize({ width: 1440, height: 1000 })
  await page.locator('.product-closing').scrollIntoViewIfNeeded()
  await expect.poll(() => other.evaluate((el: HTMLVideoElement) => el.paused)).toBe(true)
  expect(errors).toEqual([])
})

test('product films: non-seekable host fallback, latest seek wins, paused intent and object URL cleanup', async ({ page }) => {
  test.setTimeout(60_000)
  await page.addInitScript(() => {
    const descriptor = Object.getOwnPropertyDescriptor(HTMLMediaElement.prototype, 'seekable')!
    Object.defineProperty(HTMLMediaElement.prototype, 'seekable', {
      configurable: true,
      get() {
        if (this instanceof HTMLVideoElement && !this.src.startsWith('blob:')) {
          return { length: 0, start: () => 0, end: () => 0 }
        }
        return descriptor.get!.call(this)
      },
    })
    const created: string[] = [], revoked: string[] = []
    const create = URL.createObjectURL, revoke = URL.revokeObjectURL
    URL.createObjectURL = blob => { const url = create(blob); created.push(url); return url }
    URL.revokeObjectURL = url => { revoked.push(url); revoke(url) }
    Object.assign(window, { filmTest: { created, revoked, videos: [] } })
  })
  await page.goto('/products')
  const rain = page.locator('[data-film="rain-writer"]')
  const video = rain.locator('video')
  await rain.getByRole('slider').fill('45')
  await rain.getByRole('slider').fill('91')
  await at(video, 91)
  await expect(video).toHaveAttribute('src', /^blob:/)
  expect(await video.evaluate((el: HTMLVideoElement) => el.paused)).toBe(true)
  await rain.getByRole('slider').fill('32')
  await at(video, 32)
  await rain.getByRole('button', { name: '播放雨窗视频' }).click()
  await expect.poll(() => video.evaluate((el: HTMLVideoElement) => el.currentTime)).toBeGreaterThan(33)
  await page.evaluate(() => {
    const state = (window as unknown as { filmTest: { videos: HTMLVideoElement[] } }).filmTest
    state.videos = Array.from(document.querySelectorAll('video'))
  })
  await page.getByRole('link', { name: 'JIARU 首页' }).click()
  await expect(page.locator('.product-film')).toHaveCount(0)
  const cleanup = await page.evaluate(() => {
    const state = (window as unknown as { filmTest: { created: string[]; revoked: string[]; videos: HTMLVideoElement[] } }).filmTest
    return { created: state.created.length, released: state.created.every(url => state.revoked.includes(url)), stopped: state.videos.every(video => !video.isConnected && video.paused && !video.getAttribute('src')) }
  })
  expect(cleanup).toEqual({ created: 1, released: true, stopped: true })
})

test('product films: mobile keyboard playback and retry after unavailable recording', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 })
  await page.route('**/video/products/swagger.mp4', route => route.abort())
  await page.goto('/products#forever')
  const film = page.locator('[data-film="forever"]')
  await film.getByRole('button', { name: '播放Forever实录' }).click()
  await expect(film.locator('.film-error')).toContainText('点击播放重试')
  await page.unroute('**/video/products/swagger.mp4')
  await film.getByRole('button', { name: '播放Forever视频' }).focus()
  await page.keyboard.press('Enter')
  await decoded(film.locator('video'))
  await expect(film.locator('.film-error')).toHaveCount(0)
  await film.getByRole('button', { name: '暂停Forever视频' }).click()
  await film.getByRole('slider').focus()
  await page.keyboard.press('ArrowRight')
  await expect.poll(() => film.locator('video').evaluate((el: HTMLVideoElement) => el.currentTime)).toBeGreaterThan(0)
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true)
  await film.screenshot({ path: '.artifacts/products-film-mobile.png' })
})
