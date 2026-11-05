import { expect, test, type Page } from '@playwright/test'
import { readFileSync } from 'node:fs'

async function instrumentAudioAndGPU(page: Page) {
  await page.addInitScript(() => {
    const contexts: AudioContext[] = []
    const analysers: AnalyserNode[] = []
    const media: HTMLMediaElement[] = []
    Object.assign(window, { testMusic: { contexts, analysers, media } })
    const Original = window.AudioContext
    window.AudioContext = class extends Original {
      constructor(options?: AudioContextOptions) { super(options); contexts.push(this) }
      createAnalyser() { const analyser = super.createAnalyser(); analysers.push(analyser); return analyser }
      createMediaElementSource(element: HTMLMediaElement) { media.push(element); return super.createMediaElementSource(element) }
    }
    const draw = WebGL2RenderingContext.prototype.drawArrays
    WebGL2RenderingContext.prototype.drawArrays = function (...args) {
      if (this.canvas instanceof HTMLCanvasElement) this.canvas.dataset.testDraws = String(Number(this.canvas.dataset.testDraws ?? 0) + 1)
      return draw.apply(this, args)
    }
    const location = WebGL2RenderingContext.prototype.getUniformLocation
    const names = new WeakMap<WebGLUniformLocation, string>()
    WebGL2RenderingContext.prototype.getUniformLocation = function (program, name) {
      const result = location.call(this, program, name)
      if (result) names.set(result, name)
      return result
    }
    const uniform = WebGL2RenderingContext.prototype.uniform4f
    WebGL2RenderingContext.prototype.uniform4f = function (location, x, y, z, w) {
      if (location && names.get(location) === 'uAudio' && this.canvas instanceof HTMLCanvasElement) {
        this.canvas.dataset.testAudio = JSON.stringify([x, y, z, w])
      }
      return uniform.call(this, location, x, y, z, w)
    }
  })
}

async function audioState(page: Page) {
  return page.evaluate(() => {
    const data = (window as unknown as { testMusic: { contexts: AudioContext[]; analysers: AnalyserNode[]; media: HTMLMediaElement[] } }).testMusic
    const values = new Float32Array(2048)
    data.analysers.at(-1)?.getFloatTimeDomainData(values)
    return {
      states: data.contexts.map(context => context.state),
      sources: data.media.length,
      playing: data.media.filter(element => !element.paused).length,
      rms: Math.sqrt(values.reduce((sum, value) => sum + value ** 2, 0) / values.length),
      media: data.media.map(element => ({ paused: element.paused, src: element.getAttribute('src') })),
    }
  })
}

const currentTime = (page: Page) => page.locator('audio').evaluate((audio: HTMLAudioElement) => audio.currentTime)
const gpuEnergy = async (page: Page) => JSON.parse(await page.locator('.music-particle-host canvas').getAttribute('data-test-audio') ?? '[0,0,0,0]') as number[]

test('music: original files, complete source stories, calm live sculpture and desktop layout', async ({ page, request }) => {
  const errors: string[] = []
  page.on('pageerror', error => errors.push(error.message))
  page.on('console', message => { if (message.type() === 'error') errors.push(message.text()) })
  await instrumentAudioAndGPU(page)
  await page.goto('/music')
  await expect(page).toHaveTitle('AI 音乐创作 · 周珈如 — JIARU')
  await expect(page.locator('.music-sculpture')).toHaveClass(/is-ready/)
  await expect(page.locator('.music-particle-host')).toHaveCSS('opacity', '1')
  await expect(page.locator('.music-intro')).toHaveCSS('opacity', '1')
  await expect(page.locator('.music-particle-host canvas')).toHaveAttribute('data-particle-count', '6000')
  await expect(page.locator('.song-story h3')).toHaveText(['Stay with Me', 'Rain Talk'])
  for (const song of await page.locator('.song-story').all()) {
    await expect(song.locator('h4')).toContainText(['创作理念', '创作流程', '运营延伸'])
    await expect(song.getByText('运营构想')).toBeVisible()
  }
  await expect(page.locator('#stay-with-me')).toContainText('NewJeans《Ditto》')
  await expect(page.locator('#rain-talk')).toContainText('Op.9 No.2')
  expect((await audioState(page)).states).toEqual([])
  expect(await page.locator('audio').evaluate((audio: HTMLAudioElement) => audio.paused)).toBe(true)
  for (const slug of ['stay-with-me', 'rain-talk']) {
    const response = await request.get(`/audio/music/${slug}.mp3`)
    expect(response.ok()).toBe(true)
    expect((await response.body()).equals(readFileSync(`public/audio/music/${slug}.mp3`))).toBe(true)
  }
  const canvas = page.locator('.music-particle-host canvas')
  const before = Number(await canvas.getAttribute('data-test-draws'))
  await expect.poll(async () => Number(await canvas.getAttribute('data-test-draws'))).toBeGreaterThan(before)
  expect(await gpuEnergy(page)).toEqual([0, 0, 0, 0])
  await page.screenshot({ path: '.artifacts/music-desktop.png', fullPage: true })
  await page.screenshot({ path: '.artifacts/music-first-screen.png' })
  expect(errors).toEqual([])
})

test('music: real signal drives GPU, pause, seek, mute, both songs, persistence and cleanup', async ({ page }) => {
  await instrumentAudioAndGPU(page)
  await page.goto('/music')
  await page.bringToFront()
  await expect(page.locator('.music-sculpture')).toHaveClass(/is-ready/)
  const deck = page.getByRole('region', { name: '音乐播放器' })
  await deck.getByRole('button', { name: '播放音乐' }).click()
  await expect(deck.getByRole('button', { name: '暂停音乐' })).toBeVisible()
  await expect.poll(() => currentTime(page)).toBeGreaterThan(0.2)
  await page.getByRole('slider', { name: '播放进度' }).fill('48')
  await expect.poll(() => currentTime(page)).toBeGreaterThanOrEqual(48)
  await expect.poll(async () => (await audioState(page)).rms).toBeGreaterThan(0.005)
  await expect.poll(async () => (await gpuEnergy(page))[3]).toBeGreaterThan(0.03)
  expect((await audioState(page)).sources).toBe(1)
  const canvas = page.locator('.music-particle-host canvas')
  await page.getByRole('button', { name: '暂停粒子动效' }).click()
  const draws = await canvas.getAttribute('data-test-draws')
  const position = await currentTime(page)
  await expect.poll(() => currentTime(page)).toBeGreaterThan(position + 0.35)
  expect(await canvas.getAttribute('data-test-draws')).toBe(draws)
  await page.getByRole('button', { name: '播放粒子动效' }).click()
  await deck.getByRole('button', { name: '暂停音乐' }).click()
  const paused = await currentTime(page)
  await expect.poll(async () => (await gpuEnergy(page))[3]).toBeLessThan(0.002)
  expect(await currentTime(page)).toBe(paused)
  await page.getByRole('slider', { name: '播放进度' }).fill('86')
  await expect.poll(() => currentTime(page)).toBeCloseTo(86, 0)
  await deck.getByRole('button', { name: '播放音乐' }).click()
  await deck.getByRole('button', { name: '静音', exact: true }).click()
  await expect.poll(async () => (await audioState(page)).rms).toBeLessThan(0.0001)
  await deck.getByRole('button', { name: '取消静音' }).click()
  await page.getByRole('slider', { name: '音量', exact: true }).fill('0.35')
  await expect.poll(async () => (await audioState(page)).rms).toBeGreaterThan(0.002)
  await deck.getByRole('button', { name: '下一首' }).click()
  await expect(deck).toContainText('Rain Talk')
  await expect(page.locator('audio')).toHaveAttribute('src', '/audio/music/rain-talk.mp3')
  await page.getByRole('slider', { name: '播放进度' }).fill('52')
  await expect.poll(() => currentTime(page)).toBeGreaterThanOrEqual(52)
  await expect.poll(async () => (await audioState(page)).rms).toBeGreaterThan(0.005)
  expect((await audioState(page)).playing).toBe(1)
  expect((await audioState(page)).sources).toBe(1)
  await deck.getByRole('button', { name: '暂停音乐' }).click()
  await page.getByRole('slider', { name: '播放进度' }).fill('65')
  await page.reload()
  await expect(deck).toContainText('Rain Talk')
  await expect.poll(() => currentTime(page)).toBeCloseTo(65, 0)
  expect((await audioState(page)).states).toEqual([])
  await expect(page.getByRole('slider', { name: '音量', exact: true })).toHaveValue('0.35')
  await deck.getByRole('button', { name: '播放音乐' }).click()
  await page.getByRole('slider', { name: '播放进度' }).press('End')
  await expect(deck.getByRole('button', { name: '播放音乐' })).toBeVisible()
  await deck.getByRole('button', { name: '播放音乐' }).click()
  await expect.poll(() => currentTime(page)).toBeLessThan(3)
  await page.getByRole('link', { name: 'JIARU 首页' }).click()
  await expect.poll(async () => (await audioState(page)).states.at(-1)).toBe('closed')
  expect((await audioState(page)).media).toEqual([{ paused: true, src: null }])
})

test('music: rapid switching and loading failures never overlap or leave playback stuck', async ({ page }) => {
  await instrumentAudioAndGPU(page)
  await page.route('**/audio/music/stay-with-me.mp3', route => route.fulfill({ status: 503, body: '' }))
  await page.goto('/music')
  const deck = page.getByRole('region', { name: '音乐播放器' })
  await expect(page.getByRole('alert')).toContainText('音频加载失败')
  await page.unroute('**/audio/music/stay-with-me.mp3')
  await deck.getByRole('button', { name: '播放音乐' }).click()
  await expect(deck.getByRole('button', { name: '暂停音乐' })).toBeVisible()
  for (let i = 0; i < 6; i++) await deck.getByRole('button', { name: '下一首' }).click()
  await expect(deck).toContainText('Stay with Me')
  await expect(deck.getByRole('button', { name: '暂停音乐' })).toBeVisible()
  expect((await audioState(page)).sources).toBe(1)
  expect((await audioState(page)).playing).toBe(1)
  await expect(page.getByRole('alert')).toHaveCount(0)
  await deck.getByRole('button', { name: '上一首' }).click()
  await expect(deck).toContainText('Rain Talk')
  await expect.poll(() => currentTime(page)).toBeGreaterThan(0.1)
})

test('music mobile: calm reduced motion, all widths, sticky controls and deep links', async ({ page }) => {
  await instrumentAudioAndGPU(page)
  await page.setViewportSize({ width: 390, height: 844 })
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await page.goto('/music')
  await expect(page.locator('.music-sculpture')).toHaveClass(/is-ready/)
  await expect(page.locator('.music-intro')).toHaveCSS('opacity', '1')
  await expect(page.locator('.music-sculpture')).toHaveAttribute('data-motion', 'paused')
  await expect(page.locator('.music-particle-host canvas')).toHaveAttribute('data-particle-count', '4000')
  await page.screenshot({ path: '.artifacts/music-mobile.png', fullPage: true })
  await page.screenshot({ path: '.artifacts/music-mobile-first-screen.png' })
  for (const width of [320, 390, 628, 768, 1024, 1440]) {
    await page.setViewportSize({ width, height: 900 })
    await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), { message: `no overflow at ${width}px` }).toBe(true)
  }
  await page.setViewportSize({ width: 390, height: 844 })
  const canvas = page.locator('.music-particle-host canvas')
  const deck = page.getByRole('region', { name: '音乐播放器' })
  await page.locator('.music-track-list').getByRole('button', { name: '播放 Rain Talk' }).click()
  await expect(deck.getByRole('button', { name: '暂停音乐' })).toBeVisible()
  await expect(page.locator('.music-sculpture')).toHaveAttribute('data-motion', 'paused')
  const count = await canvas.getAttribute('data-test-draws')
  await expect.poll(() => currentTime(page)).toBeGreaterThan(0.3)
  expect(await canvas.getAttribute('data-test-draws')).toBe(count)
  await page.locator('.music-story-anchor').click()
  await expect(page).toHaveURL(/#rain-talk$/)
  const deckBounds = (await deck.boundingBox())!
  const storyBounds = (await page.locator('#rain-talk').boundingBox())!
  expect(deckBounds.y).toBeLessThan(15)
  expect(storyBounds.y).toBeGreaterThan(deckBounds.y + deckBounds.height)
  await page.screenshot({ path: '.artifacts/music-mobile-reading.png' })
  await deck.getByLabel('音量设置', { exact: true }).click()
  await deck.getByRole('button', { name: '静音', exact: true }).click()
  await expect(deck.getByRole('button', { name: '取消静音' })).toBeVisible()
  await deck.getByRole('slider', { name: '音量', exact: true }).fill('0')
  await deck.getByRole('button', { name: '取消静音' }).click()
  await expect(deck.getByRole('slider', { name: '音量', exact: true })).toHaveValue('0.72')
  await deck.getByRole('button', { name: '关闭音量设置' }).click()
  await page.goto('/music#stay-with-me')
  expect((await page.locator('#stay-with-me').boundingBox())!.y).toBeGreaterThan(125)
})

test('music: no WebGL or Web Audio still permits both original tracks and source reading', async ({ page }) => {
  await page.addInitScript(() => {
    const original = HTMLCanvasElement.prototype.getContext
    HTMLCanvasElement.prototype.getContext = function (...args: Parameters<typeof original>) {
      if (String(args[0]).startsWith('webgl')) return null
      return original.apply(this, args)
    } as typeof original
    window.AudioContext = class { constructor() { throw new Error('Audio unavailable') } } as unknown as typeof AudioContext
  })
  await page.goto('/music')
  await expect(page.locator('.music-particle-fallback')).toBeVisible()
  const deck = page.getByRole('region', { name: '音乐播放器' })
  await deck.getByRole('button', { name: '播放音乐' }).click()
  await expect.poll(() => currentTime(page)).toBeGreaterThan(0.1)
  await deck.getByRole('button', { name: '下一首' }).click()
  await expect(deck).toContainText('Rain Talk')
  await expect.poll(() => currentTime(page)).toBeGreaterThan(0.1)
  await expect(page.locator('.song-story')).toHaveCount(2)
})

test('music: non-seekable static host caches originals, preserves pause and releases object URLs', async ({ page }) => {
  await page.addInitScript(() => {
    const created: string[] = []
    const revoked: string[] = []
    Object.assign(window, { audioBlobTest: { created, revoked } })
    const create = URL.createObjectURL
    const revoke = URL.revokeObjectURL
    URL.createObjectURL = blob => { const url = create(blob); created.push(url); return url }
    URL.revokeObjectURL = url => { revoked.push(url); revoke(url) }
    const seekable = Object.getOwnPropertyDescriptor(HTMLMediaElement.prototype, 'seekable')!
    Object.defineProperty(HTMLMediaElement.prototype, 'seekable', {
      ...seekable,
      get() { return this.src.startsWith('blob:') ? seekable.get!.call(this) : { length: 1, start: () => 0, end: () => 0 } },
    })
  })
  await page.goto('/music')
  const audio = page.locator('audio')
  const deck = page.getByRole('region', { name: '音乐播放器' })
  await expect.poll(() => audio.evaluate((audio: HTMLAudioElement) => audio.readyState)).toBeGreaterThanOrEqual(1)
  await page.getByRole('slider', { name: '播放进度' }).fill('86')
  await expect.poll(() => currentTime(page)).toBeCloseTo(86, 0)
  await expect(audio).toHaveAttribute('src', /^blob:/)
  expect(await audio.evaluate((audio: HTMLAudioElement) => audio.paused)).toBe(true)
  const firstBlob = await audio.getAttribute('src')
  await deck.getByRole('button', { name: '下一首' }).click()
  await page.getByRole('slider', { name: '播放进度' }).fill('65')
  await expect.poll(() => currentTime(page)).toBeGreaterThanOrEqual(65)
  await expect(audio).toHaveAttribute('src', /^blob:/)
  await deck.getByRole('button', { name: '上一首' }).click()
  await expect(audio).toHaveAttribute('src', firstBlob!)
  await expect.poll(() => currentTime(page)).toBeGreaterThan(0.1)
  await page.getByRole('link', { name: 'JIARU 首页' }).click()
  await expect(audio).toHaveCount(0)
  const urls = await page.evaluate(() => (window as unknown as { audioBlobTest: { created: string[]; revoked: string[] } }).audioBlobTest)
  expect(urls.created).toHaveLength(2)
  expect(urls.revoked.sort()).toEqual(urls.created.sort())
})
