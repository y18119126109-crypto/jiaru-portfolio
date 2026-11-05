import { expect, test } from '@playwright/test'

const pageThemes = [
  { path: '/', theme: 'home', title: '让一次交流，成为新的回响。' },
  { path: '/resume', theme: 'resume', title: '关于经历与新的可能，欢迎来聊。' },
  { path: '/music', theme: 'music', title: '有关于声音与创作的想法，欢迎来聊。' },
  { path: '/products', theme: 'products', title: '有关于产品与 AI 的想法，欢迎来聊。' },
  { path: '/playlists', theme: 'playlists', title: '想聊音乐、歌单与此刻的声音，欢迎来找我。' },
] as const

test('contact orb is persistent and adapts its dialog to every page type', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' })
  for (const entry of pageThemes) {
    await page.goto(entry.path)
    const layer = page.locator('.contact-layer')
    const trigger = page.getByRole('button', { name: '与我联系' })
    await expect(layer).toHaveAttribute('data-contact-theme', entry.theme)
    await expect(trigger).toBeVisible()
    await trigger.click()
    const dialog = page.getByRole('dialog', { name: entry.title })
    await expect(dialog).toBeVisible()
    await expect(dialog).toContainText('对音乐、内容或 AI 产品有想交流和探讨的地方')
    await expect(dialog.getByRole('link', { name: /zhoujiaru2324@163\.com/ })).toHaveAttribute('href', 'mailto:zhoujiaru2324@163.com')
    await expect(dialog.getByRole('link', { name: /15553313138/ })).toHaveAttribute('href', 'tel:15553313138')
    await page.keyboard.press('Escape')
    await expect(dialog).not.toBeVisible()
    await expect(trigger).toBeFocused()
  }
})

test('contact orb remains available across both scoped site versions', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' })
  for (const prefix of ['/music-content', '/ai-music-product']) {
    for (const entry of pageThemes) {
      const path = entry.path === '/' ? prefix : `${prefix}${entry.path}`
      await page.goto(path)
      await expect(page.locator('.contact-layer')).toHaveAttribute('data-contact-theme', entry.theme)
      await expect(page.getByRole('button', { name: '与我联系' })).toBeVisible()
    }
  }
})

test('contact orb and dialog fit mobile viewports and respect reduced motion', async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 720 })
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await page.goto('/ai-music-product/products')
  const trigger = page.getByRole('button', { name: '与我联系' })
  const triggerBounds = await trigger.boundingBox()
  expect(triggerBounds).not.toBeNull()
  expect(triggerBounds!.x).toBeGreaterThanOrEqual(0)
  expect(triggerBounds!.x + triggerBounds!.width).toBeLessThanOrEqual(320)
  expect(triggerBounds!.y + triggerBounds!.height).toBeLessThanOrEqual(720)

  await trigger.click()
  const dialog = page.getByRole('dialog', { name: '有关于产品与 AI 的想法，欢迎来聊。' })
  await expect(dialog).toBeVisible()
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true)
  await expect(dialog.locator('.contact-panel')).toHaveCSS('animation-name', 'none')
  await dialog.getByRole('button', { name: '关闭联系方式' }).click()
  await expect(trigger).toBeFocused()
})
