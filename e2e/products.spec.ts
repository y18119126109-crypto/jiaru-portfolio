import { expect, test, type Page } from '@playwright/test'

async function frames(page: Page, count = 12) {
  await page.evaluate(count => new Promise<void>(resolve => {
    let current = 0
    const next = () => { if (++current >= count) resolve(); else requestAnimationFrame(next) }
    requestAnimationFrame(next)
  }), count)
}

test('products: complete local guides, anchors, history and desktop presentation', async ({ page }) => {
  const errors: string[] = []
  const requests: string[] = []
  page.on('pageerror', error => errors.push(error.message))
  page.on('console', message => { if (message.type() === 'error') errors.push(message.text()) })
  page.on('request', request => { if (new URL(request.url()).hostname !== '127.0.0.1') requests.push(request.url()) })
  await page.goto('/products')
  await expect(page).toHaveTitle('AI 产品作品 · 周珈如 — JIARU')
  await expect(page.locator('.dream-galaxy')).toHaveClass(/is-ready/)
  await expect(page.locator('.product-hero-copy')).toHaveCSS('opacity', '1')
  await expect(page.locator('.product-case')).toHaveCount(2)
  await expect(page.locator('.product-guide details')).toHaveCount(12)
  const directDownloads = [
    ['下载 Forever macOS Apple 芯片 v1.3.1', 'https://forever-music.oss-cn-beijing.aliyuncs.com/Forever-1.3.1-mac-arm64.zip'],
    ['下载 Forever macOS Intel 芯片 v1.3.0', 'https://forever-music.oss-cn-beijing.aliyuncs.com/Forever-1.3.0-mac-x64.zip'],
    ['下载 Forever Windows 安装版 v1.3.0', 'https://forever-music.oss-cn-beijing.aliyuncs.com/Forever-1.3.0-win-x64-setup.zip'],
    ['下载 Forever Windows 便携版 v1.3.0', 'https://forever-music.oss-cn-beijing.aliyuncs.com/Forever-1.3.0-win-x64-portable.zip'],
  ] as const
  for (const [name, href] of directDownloads) {
    const link = page.getByRole('link', { name })
    await expect(link).toHaveAttribute('href', href)
    await expect(link).toHaveAttribute('target', '_blank')
  }
  const baiduInstaller = page.getByRole('link', { name: '前往百度网盘下载' })
  const quarkInstaller = page.getByRole('link', { name: '前往夸克网盘下载' })
  await expect(page.locator('.products-page a[href^="http"]')).toHaveCount(6)
  await expect(baiduInstaller).toHaveAttribute('href', 'https://pan.baidu.com/s/1OSUXlr610HiI6Lm20Z79nA?pwd=qmzp')
  await expect(quarkInstaller).toHaveAttribute('href', 'https://pan.quark.cn/s/9693af7e0f8f?pwd=kiZQ')
  await expect(baiduInstaller).toHaveAttribute('target', '_blank')
  await expect(quarkInstaller).toHaveAttribute('target', '_blank')
  await expect(page.locator('.product-installer')).toContainText('百度网盘提取码 qmzp')
  await expect(page.locator('.product-installer')).toContainText('夸克网盘提取码 kiZQ')
  await expect(page.locator('.product-film video')).toHaveCount(2)
  await expect(page.locator('.products-page :is(audio,iframe)')).toHaveCount(0)
  await expect(page.locator('.product-film video[src]')).toHaveCount(0)
  await page.screenshot({ path: '.artifacts/products-desktop-first-screen.png' })
  await page.locator('.dream-galaxy').screenshot({ path: '.artifacts/products-galaxy-detail.png' })
  await page.screenshot({ path: '.artifacts/products-desktop.png', fullPage: true })
  await page.getByRole('navigation', { name: '产品章节' }).getByRole('link', { name: /Forever/ }).click()
  await expect(page).toHaveURL(/#forever$/)
  await expect.poll(() => page.locator('#forever').evaluate(el => Math.round(el.getBoundingClientRect().top))).toBeLessThan(150)
  await page.locator('.forever-demo').screenshot({ path: '.artifacts/products-forever-desktop.png' })
  await page.goBack()
  await expect(page).toHaveURL(/\/products$/)
  await page.getByRole('navigation', { name: '产品章节' }).getByRole('link', { name: /Rain Writer/ }).click()
  await expect(page).toHaveURL(/#rain-writer$/)
  await page.locator('.rain-demo').screenshot({ path: '.artifacts/products-rain-desktop.png' })
  for (const summary of await page.locator('.product-guide summary').all()) await summary.click()
  await expect(page.getByRole('heading', { name: 'v0.4 · 天气成为选择' })).toBeVisible()
  await expect(page.getByRole('heading', { name: '默认熟悉度 17%' })).toBeVisible()
  await expect(page.getByRole('heading', { name: '材料版本说明' })).toBeVisible()
  await expect(page.locator('.forever-case')).toContainText('Forever AI Radio Local v1.0.0')
  await expect(page.locator('.forever-case')).toContainText('新版源码包含三种播放器外观')
  await page.locator('.radio-contract summary').click()
  await expect(page.locator('.radio-contract code')).toContainText('"playerAction": "none"')
  await page.goto('/products#swagger')
  await expect(page).toHaveURL(/#forever$/)
  await expect.poll(() => page.locator('#forever').evaluate(el => Math.round(el.getBoundingClientRect().top))).toBeLessThan(150)
  await page.getByRole('link', { name: 'JIARU 首页' }).click()
  await expect(page.locator('.products-theme')).toHaveCount(0)
  await expect(page.locator('.product-case')).toHaveCount(0)
  expect(requests).toEqual([])
  expect(errors).toEqual([])
})

test('rain preview: five weather modes, IME, persistence, assistant explanations and storage failure', async ({ page }) => {
  await page.goto('/products#rain-writer')
  for (const [name, id] of [['雨', 'rain'], ['细雨', 'drizzle'], ['暴雨', 'storm'], ['雪', 'snow'], ['雾', 'fog']]) {
    await page.getByRole('group', { name: '预览天气' }).getByRole('button', { name, exact: true }).click()
    await expect(page.locator('.rain-demo')).toHaveAttribute('data-weather', id)
  }
  const input = page.getByRole('textbox', { name: '雨窗试写笔记' })
  await input.focus()
  await input.dispatchEvent('compositionstart', { data: '' })
  await input.fill('今天的星河')
  await input.dispatchEvent('compositionupdate', { data: '今天的星河' })
  await frames(page, 25)
  expect(await page.evaluate(() => localStorage.getItem('jiaru-rain-writer-preview-v1'))).toBeNull()
  await expect(input).toHaveValue('今天的星河')
  await input.dispatchEvent('compositionend', { data: '今天的星河' })
  await input.press('End')
  await input.press('Enter')
  await input.pressSequentially('is gentle.')
  await expect(input).toHaveValue('今天的星河\nis gentle.')
  await expect(page.locator('.rain-note-footer [role="status"]')).toHaveText('已保存在此浏览器')
  await page.reload()
  await expect(input).toHaveValue('今天的星河\nis gentle.')
  await page.getByRole('button', { name: '搜索', exact: true }).click()
  await expect(page.locator('.rain-assistant-copy')).toContainText('找回旧笔记')
  await page.getByRole('button', { name: '心情', exact: true }).click()
  await expect(page.locator('.rain-assistant-copy')).toContainText('梳理心情')
  await page.evaluate(() => { Storage.prototype.setItem = () => { throw new DOMException('Quota exceeded', 'QuotaExceededError') } })
  await input.fill('即使无法保存，也可以继续写')
  await expect(page.locator('.rain-note-footer [role="status"]')).toContainText('浏览器无法保存')
  await expect(input).toHaveValue('即使无法保存，也可以继续写')
})

test('Forever: shared selection, three layouts and temporary intent overriding familiarity', async ({ page }) => {
  await page.goto('/products#forever')
  await page.getByRole('button', { name: '选择示例 夜色漫步' }).click()
  for (const [name, id] of [['经典电台', 'classic'], ['唱片沉浸', 'vinyl'], ['玻璃桌面', 'glass']]) {
    await page.getByRole('button', { name, exact: true }).click()
    await expect(page.locator('.radio-demo-world')).toHaveAttribute('data-view', id)
    await expect(page.locator('.radio-current strong')).toHaveText('夜色漫步')
  }
  const range = page.getByRole('slider', { name: '熟悉歌曲比例' })
  await range.fill('50')
  await expect(page.locator('.radio-policy-batch .is-familiar')).toHaveCount(3)
  await page.getByRole('button', { name: /接下来两小时/ }).click()
  await expect(range).toBeDisabled()
  await expect(page.locator('.radio-policy-batch .is-nature')).toHaveCount(6)
  await expect(page.locator('.radio-current strong')).toHaveText('林间溪流')
  await page.getByRole('button', { name: '演示到期' }).click()
  await expect(range).toBeEnabled()
  await expect(range).toHaveValue('50')
  await expect(page.locator('.radio-policy-batch .is-familiar')).toHaveCount(3)
  await expect(page.locator('.radio-policy-status')).toContainText('已演示主题到期')
  await page.getByRole('button', { name: /接下来两小时/ }).click()
  await page.getByRole('button', { name: /接下来两小时/ }).click()
  await expect(page.locator('.radio-policy-status')).toContainText('主题已取消')
})

test('galaxy: GPU animation, pause, pointer, background/offscreen suspension and disposal', async ({ page }) => {
  await page.addInitScript(() => {
    const canvases: HTMLCanvasElement[] = []
    Object.assign(window, { galaxyTestCanvases: canvases })
    const proto = WebGL2RenderingContext.prototype
    const draw = proto.drawArrays
    proto.drawArrays = function (...args) {
      if (this.canvas instanceof HTMLCanvasElement) {
        if (!canvases.includes(this.canvas)) canvases.push(this.canvas)
        this.canvas.dataset.testDraws = String(Number(this.canvas.dataset.testDraws ?? 0) + 1)
      }
      return draw.apply(this, args)
    }
    const remove = proto.deleteBuffer
    proto.deleteBuffer = function (buffer) {
      if (this.canvas instanceof HTMLCanvasElement) this.canvas.dataset.deleted = String(Number(this.canvas.dataset.deleted ?? 0) + 1)
      return remove.call(this, buffer)
    }
    const getLocation = proto.getUniformLocation
    const names = new WeakMap<WebGLUniformLocation, string>()
    proto.getUniformLocation = function (program, name) {
      const location = getLocation.call(this, program, name)
      if (location) names.set(location, name)
      return location
    }
    const matrix = proto.uniformMatrix4fv
    proto.uniformMatrix4fv = function (...args) {
      if (args[0] && names.get(args[0]) === 'modelViewMatrix' && this.canvas instanceof HTMLCanvasElement) this.canvas.dataset.matrix = JSON.stringify(Array.from(args[2]))
      return matrix.apply(this, args)
    }
  })
  await page.goto('/products')
  const galaxy = page.locator('.dream-galaxy')
  const canvas = page.locator('.galaxy-canvas canvas')
  await expect(galaxy).toHaveClass(/is-ready/)
  await expect(canvas).toHaveAttribute('data-particle-count', '8800')
  const initial = Number(await canvas.getAttribute('data-test-draws'))
  await expect.poll(async () => Number(await canvas.getAttribute('data-test-draws'))).toBeGreaterThan(initial)
  const matrix = await canvas.getAttribute('data-matrix')
  const box = await canvas.boundingBox()
  await page.mouse.move(box!.x + box!.width * .8, box!.y + box!.height * .3)
  await expect.poll(() => canvas.getAttribute('data-matrix')).not.toBe(matrix)
  await page.getByRole('button', { name: '暂停梦境动效' }).click()
  await frames(page)
  const paused = await canvas.getAttribute('data-test-draws')
  await frames(page)
  expect(await canvas.getAttribute('data-test-draws')).toBe(paused)
  await page.getByRole('button', { name: '播放梦境动效' }).click()
  await page.evaluate(() => { Object.defineProperty(document, 'hidden', { configurable: true, value: true }); document.dispatchEvent(new Event('visibilitychange')) })
  await frames(page)
  const hidden = await canvas.getAttribute('data-test-draws')
  await frames(page)
  expect(await canvas.getAttribute('data-test-draws')).toBe(hidden)
  await page.evaluate(() => { Object.defineProperty(document, 'hidden', { configurable: true, value: false }); document.dispatchEvent(new Event('visibilitychange')) })
  await expect.poll(async () => Number(await canvas.getAttribute('data-test-draws'))).toBeGreaterThan(Number(hidden))
  await page.locator('#rain-writer').scrollIntoViewIfNeeded()
  await frames(page)
  const offscreen = await canvas.getAttribute('data-test-draws')
  await frames(page)
  expect(await canvas.getAttribute('data-test-draws')).toBe(offscreen)
  await page.getByRole('link', { name: 'JIARU 首页' }).click()
  await expect(galaxy).toHaveCount(0)
  expect(await page.evaluate(() => {
    const canvas = (window as unknown as { galaxyTestCanvases: HTMLCanvasElement[] }).galaxyTestCanvases[0]
    return !canvas.isConnected && Number(canvas.dataset.deleted) > 0
  })).toBe(true)
})

test('mobile: reduced motion, keyboard chapters, all widths and layout states', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 })
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await page.goto('/products')
  await expect(page.locator('.dream-galaxy')).toHaveClass(/is-ready/)
  await expect(page.locator('.dream-galaxy')).toHaveAttribute('data-motion', 'paused')
  await expect(page.locator('.galaxy-canvas canvas')).toHaveAttribute('data-particle-count', '5200')
  await page.screenshot({ path: '.artifacts/products-mobile.png', fullPage: true })
  await page.screenshot({ path: '.artifacts/products-mobile-first-screen.png' })
  await page.getByRole('button', { name: '播放梦境动效' }).click()
  await expect(page.locator('.dream-galaxy')).toHaveAttribute('data-motion', 'running')
  await page.locator('.product-guide summary').first().focus()
  await page.keyboard.press('Enter')
  await expect(page.locator('.product-guide details').first()).toHaveAttribute('open', '')
  for (const width of [320, 390, 628, 768, 850, 1024, 1440]) {
    await page.setViewportSize({ width, height: 900 })
    expect(await page.locator('.rain-demo-world').evaluate(el => {
      const caption = el.querySelector('.rain-weather-description')!.getBoundingClientRect()
      return caption.bottom <= el.getBoundingClientRect().bottom - 5
    }), `weather description is not clipped at ${width}`).toBe(true)
    for (const [name, id] of [['经典电台', 'classic'], ['唱片沉浸', 'vinyl'], ['玻璃桌面', 'glass']]) {
      await page.getByRole('button', { name, exact: true }).click()
      await expect(page.locator('.radio-demo-world')).toHaveAttribute('data-view', id)
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), `no overflow: ${width} ${name}`).toBe(true)
      expect(await page.locator('.radio-demo-world').evaluate(el => el.scrollWidth <= el.clientWidth), `radio fits: ${width} ${name}`).toBe(true)
    }
  }
  await page.setViewportSize({ width: 390, height: 844 })
  await page.locator('.rain-demo').screenshot({ path: '.artifacts/products-rain-mobile.png' })
  await page.locator('.forever-demo').screenshot({ path: '.artifacts/products-forever-mobile.png' })
})

test('WebGL unavailable: static galaxy, retry and full project content remain usable', async ({ page }) => {
  await page.addInitScript(() => {
    const original = HTMLCanvasElement.prototype.getContext
    HTMLCanvasElement.prototype.getContext = function (...args: Parameters<typeof original>) {
      if (String(args[0]).startsWith('webgl')) return null
      return original.apply(this, args)
    } as typeof original
  })
  await page.goto('/products')
  await expect(page.locator('.galaxy-fallback')).toBeVisible()
  await page.getByRole('button', { name: '重新加载银河动效' }).click()
  await expect(page.locator('.galaxy-fallback')).toBeVisible()
  await expect(page.locator('.product-case')).toHaveCount(2)
  await page.getByRole('textbox', { name: '雨窗试写笔记' }).fill('星河停驻，仍然可以写字。')
  await expect(page.locator('.rain-note-footer [role="status"]')).toContainText('已保存')
  await page.getByRole('button', { name: /接下来两小时/ }).click()
  await expect(page.locator('.radio-policy-batch .is-nature')).toHaveCount(6)
})
