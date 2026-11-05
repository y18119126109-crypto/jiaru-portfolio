import { expect, test } from '@playwright/test'
import { readFileSync } from 'node:fs'

test('resume: latest source content, chapter navigation, original PDF and live water controls', async ({ page, request }) => {
  const errors: string[] = []
  page.on('pageerror', error => errors.push(error.message))
  page.on('console', message => { if (message.type() === 'error') errors.push(message.text()) })
  await page.addInitScript(() => {
    const draw = WebGL2RenderingContext.prototype.drawElements
    WebGL2RenderingContext.prototype.drawElements = function (...args) {
      if (this.canvas instanceof HTMLCanvasElement) this.canvas.dataset.testDraws = String(Number(this.canvas.dataset.testDraws ?? 0) + 1)
      return draw.apply(this, args)
    }
  })
  await page.goto('/resume')
  await expect(page).toHaveTitle('周珈如 · 个人简历 — JIARU')
  await expect(page.locator('.resume-section h2')).toHaveText(['学习经历', '项目经历', '实习经历', '技能'])
  await expect(page.locator('.education-entry')).toHaveCount(2)
  await expect(page.locator('#projects article')).toHaveCount(2)
  await expect(page.locator('#experience article')).toHaveCount(2)
  await expect(page.locator('#projects')).toContainText('Forever｜AI 私人电台')
  await expect(page.locator('#projects')).toContainText('个人 Vibe Coding 应用')
  await expect(page.locator('#projects')).toContainText('Windows / macOS 桌面交付')
  await expect(page.locator('#projects article').first()).not.toContainText('Forever')
  await expect(page.locator('#projects article').nth(1)).not.toContainText('2026.05')
  await expect(page.locator('#experience')).toContainText('累计生成 1000+ 版 Demo，其中 12 首进入后续制作')
  await expect(page.locator('#experience')).toContainText('累计筛选约 180 位创作者、建联约 50 位')
  await expect(page.locator('#experience')).toContainText('京东零售')
  await expect(page.locator('#experience')).toContainText('3 个月推动品牌违规问题下降 10%')
  await expect(page.locator('#skills')).toContainText('英语 · 雅思 6.5')
  await expect(page.locator('#skills')).toContainText('Trae')
  await expect(page.locator('#skills')).toContainText('Excel')
  await expect(page.locator('.particle-ribbon')).toHaveCount(0)
  await expect(page.getByRole('dialog')).toHaveCount(0)
  await expect(page.getByRole('button', { name: '开启水声' })).toHaveAttribute('aria-pressed', 'false')
  await expect(page.locator('.resume-hero')).toHaveCSS('opacity', '1')
  const canvas = page.locator('.water-backdrop canvas')
  await expect(canvas).toBeVisible()
  const initialDraws = Number(await canvas.getAttribute('data-test-draws'))
  await expect.poll(async () => Number(await canvas.getAttribute('data-test-draws'))).toBeGreaterThan(initialDraws)
  await page.screenshot({ path: '.artifacts/resume-desktop.png', fullPage: true })
  await page.screenshot({ path: '.artifacts/resume-first-screen.png' })
  await page.getByRole('button', { name: '暂停水波动效' }).click()
  await expect(page.locator('.water-backdrop')).toHaveAttribute('data-motion', 'paused')
  const pausedDraws = await canvas.getAttribute('data-test-draws')
  await page.mouse.move(800, 450, { steps: 8 })
  await page.evaluate(() => new Promise<void>(resolve => {
    let frames = 0
    const next = () => { if (++frames >= 7) resolve(); else requestAnimationFrame(next) }
    requestAnimationFrame(next)
  }))
  expect(await canvas.getAttribute('data-test-draws')).toBe(pausedDraws)
  await page.getByRole('button', { name: '播放水波动效' }).click()
  await expect.poll(async () => Number(await canvas.getAttribute('data-test-draws'))).toBeGreaterThan(Number(pausedDraws))

  for (const [title, id] of [['项目经历', 'projects'], ['实习经历', 'experience'], ['技能', 'skills'], ['学习经历', 'education']]) {
    const link = page.getByRole('navigation', { name: '简历章节' }).getByRole('link', { name: title })
    await link.click()
    await expect(page).toHaveURL(new RegExp(`#${id}$`))
    await expect(link).toHaveAttribute('aria-current', 'location')
    await expect(page.locator(`#${id}`)).toBeFocused()
  }
  const download = page.getByRole('link', { name: '下载简历 PDF' })
  await expect(download).toHaveAttribute('download', '周珈如-个人简历.pdf')
  const pdf = await request.get((await download.getAttribute('href'))!)
  expect(pdf.ok()).toBe(true)
  expect((await pdf.body()).equals(readFileSync('public/files/zhou-jiaru-resume.pdf'))).toBe(true)
  await page.getByRole('link', { name: 'JIARU 首页' }).click()
  await expect(page.locator('.water-backdrop')).toHaveCount(0)
  await expect(page.locator('.particle-ribbon')).toHaveClass(/is-ready/)
  expect(errors).toEqual([])
})

test('water audio: silent before consent, movement produces a fading signal, off and unmount release audio', async ({ page }) => {
  let recordingRequests = 0
  page.on('request', request => { if (request.url().endsWith('/audio/woodland-stream.mp3')) recordingRequests++ })
  await page.addInitScript(() => {
    const contexts: AudioContext[] = []
    const analysers: AnalyserNode[] = []
    const sources: AudioBufferSourceNode[] = []
    Object.assign(window, { testAudio: { contexts, analysers, sources } })
    const Original = window.AudioContext
    window.AudioContext = class extends Original {
      constructor(options?: AudioContextOptions) { super(options); contexts.push(this) }
      createBufferSource() { const source = super.createBufferSource(); sources.push(source); return source }
    }
    const connect = AudioNode.prototype.connect
    AudioNode.prototype.connect = function (this: AudioNode, destination: AudioNode | AudioParam, ...args: number[]) {
      if (destination instanceof AudioDestinationNode) {
        const analyser = this.context.createAnalyser()
        analyser.fftSize = 2048
        analysers.push(analyser)
        connect.call(this, analyser)
      }
      return Reflect.apply(connect, this, [destination, ...args])
    } as typeof connect
  })
  await page.goto('/resume')
  await page.bringToFront()
  const audioState = () => page.evaluate(() => {
    const data = (window as unknown as { testAudio: { contexts: AudioContext[]; analysers: AnalyserNode[]; sources: AudioBufferSourceNode[] } }).testAudio
    const values = new Float32Array(2048)
    data.analysers.at(-1)?.getFloatTimeDomainData(values)
    const source = data.sources.at(-1)
    return {
      states: data.contexts.map(context => context.state),
      rms: Math.sqrt(values.reduce((sum, value) => sum + value ** 2, 0) / values.length),
      recording: source ? { duration: source.buffer?.duration, channels: source.buffer?.numberOfChannels, rate: source.playbackRate.value, loop: source.loop } : null,
    }
  })
  await page.mouse.move(850, 350, { steps: 10 })
  expect((await audioState()).states).toEqual([])
  expect(recordingRequests).toBe(0)
  await page.getByRole('button', { name: '开启水声' }).click()
  await expect(page.getByRole('button', { name: '关闭水声' })).toHaveAttribute('aria-pressed', 'true')
  await expect.poll(async () => (await audioState()).states.at(-1)).toBe('running')
  expect(recordingRequests).toBe(1)
  const recording = (await audioState()).recording!
  expect(recording.channels).toBe(2)
  expect(recording.duration).toBeCloseTo(45, 0)
  expect(recording.rate).toBe(1)
  expect(recording.loop).toBe(true)
  let moveIndex = 0
  await expect.poll(async () => {
    await page.mouse.move(++moveIndex % 2 ? 780 : 1080, 430, { steps: 12 })
    return (await audioState()).rms
  }).toBeGreaterThan(0.00005)
  await expect.poll(async () => (await audioState()).rms, { timeout: 7000 }).toBeLessThan(0.00001)
  await page.getByRole('button', { name: '关闭水声' }).click()
  await expect.poll(async () => (await audioState()).states.at(-1)).toBe('suspended')
  await page.getByRole('button', { name: '开启水声' }).click()
  await expect.poll(async () => (await audioState()).states.at(-1)).toBe('running')
  expect(recordingRequests).toBe(1)
  await page.getByRole('link', { name: 'JIARU 首页' }).click()
  await expect.poll(async () => (await audioState()).states.at(-1)).toBe('closed')
})

test('stream load failure stays silent; leaving during loading cancels playback', async ({ page }) => {
  await page.route('**/audio/woodland-stream.mp3', route => route.fulfill({ status: 503, body: '' }))
  await page.goto('/resume')
  await page.getByRole('button', { name: '开启水声' }).click()
  await expect(page.getByRole('button', { name: '水声不可用' })).toBeDisabled()
  await expect(page.getByRole('status')).toHaveText('溪流音频暂时不可用')
  await page.unroute('**/audio/woodland-stream.mp3')
  let release: () => void = () => {}
  const waiting = new Promise<void>(resolve => { release = resolve })
  await page.route('**/audio/woodland-stream.mp3', async route => {
    await waiting
    await route.abort().catch(() => {})
  })
  await page.goto('/resume')
  await page.getByRole('button', { name: '开启水声' }).click()
  await expect(page.getByRole('button', { name: '载入溪声…' })).toBeDisabled()
  await page.getByRole('link', { name: 'JIARU 首页' }).click()
  release()
  await expect(page).toHaveURL(/\/$/)
  await expect(page.locator('.water-controls')).toHaveCount(0)
})

test('resume mobile: readable widths, sticky chapter navigation, direct hash links and home return', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 })
  await page.goto('/resume')
  await expect(page.locator('.resume-hero')).toHaveCSS('opacity', '1')
  await expect(page.locator('.water-backdrop canvas')).toBeVisible()
  await page.screenshot({ path: '.artifacts/resume-mobile.png', fullPage: true })
  await page.screenshot({ path: '.artifacts/resume-mobile-first-screen.png' })
  for (const width of [320, 390, 628, 768, 1024, 1440]) {
    await page.setViewportSize({ width, height: 900 })
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), `no horizontal overflow at ${width}px`).toBe(true)
  }
  await page.setViewportSize({ width: 390, height: 844 })
  await page.getByRole('navigation', { name: '简历章节' }).getByRole('link', { name: '实习经历' }).click()
  await expect(page.locator('#experience')).toBeFocused()
  await expect.poll(async () => Math.round((await page.locator('#experience').boundingBox())!.y)).toBeLessThan(155)
  const navBounds = await page.locator('.resume-sidebar').boundingBox()
  const experienceBounds = await page.locator('#experience').boundingBox()
  expect(experienceBounds!.y).toBeGreaterThan(navBounds!.y + navBounds!.height)
  await page.screenshot({ path: '.artifacts/resume-mobile-reading.png' })
  await page.goto('/resume#skills')
  await expect(page.getByRole('navigation', { name: '简历章节' }).getByRole('link', { name: '技能' })).toHaveAttribute('aria-current', 'location')
  await page.getByRole('link', { name: '回到首页' }).click()
  await expect(page).toHaveURL(/\/$/)
  await expect.poll(() => page.evaluate(() => scrollY)).toBe(0)
})

test('resume reduced motion and unavailable WebGL/audio retain full content', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await page.goto('/resume')
  await expect(page.locator('.water-backdrop')).toHaveAttribute('data-motion', 'paused')
  await expect(page.getByRole('button', { name: '播放水波动效' })).toBeEnabled()
  await page.getByRole('button', { name: '播放水波动效' }).click()
  await expect(page.locator('.water-backdrop')).toHaveAttribute('data-active', 'true')
  await page.addInitScript(() => {
    const original = HTMLCanvasElement.prototype.getContext
    HTMLCanvasElement.prototype.getContext = function (...args: Parameters<typeof original>) {
      if (String(args[0]).startsWith('webgl')) return null
      return original.apply(this, args)
    } as typeof original
    window.AudioContext = class { constructor() { throw new Error('Audio unavailable') } } as unknown as typeof AudioContext
  })
  await page.reload()
  await expect(page.getByText('静谧水面，依然自在阅读')).toBeVisible()
  await expect(page.getByRole('button', { name: '播放水波动效' })).toBeDisabled()
  await page.getByRole('button', { name: '开启水声' }).click()
  await expect(page.getByRole('button', { name: '水声不可用' })).toBeDisabled()
  await expect(page.locator('.resume-section')).toHaveCount(4)
  await page.getByRole('navigation', { name: '简历章节' }).getByRole('link', { name: '项目经历' }).click()
  await expect(page.locator('#projects')).toBeFocused()
})
