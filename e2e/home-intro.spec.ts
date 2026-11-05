import { expect, test } from '@playwright/test'
import { mkdirSync } from 'node:fs'

const captureDir = '.artifacts'
const entries = [
  { path: '/', key: 'jiaru-home-opening:v1:default' },
  { path: '/music-content', key: 'jiaru-home-opening:v1:music-content' },
  { path: '/ai-music-product', key: 'jiaru-home-opening:v1:ai-music-product' },
] as const

test.beforeAll(() => mkdirSync(captureDir, { recursive: true }))

test('each direct home entry shows the typewriter once per browser session', async ({ page }) => {
  for (const [index, entry] of entries.entries()) {
    await page.goto(entry.path)
    const intro = page.getByRole('dialog', { name: /开场：希望能用你停留的 10s/ })
    await expect(intro).toBeVisible()
    await expect(intro).toContainText('10 SEC / ONE CHANCE')
    await expect(intro.getByRole('button', { name: '跳过开场' })).toBeFocused()
    await expect(page.locator('#root > div').first()).toHaveAttribute('inert', '')
    await expect.poll(() => intro.locator('.opening-intro-message').textContent()).toContain('10s')
    await expect(page.locator('.particle-ribbon')).toHaveCount(0)
    if (index === 0) await intro.screenshot({ path: `${captureDir}/home-opening-desktop.png` })

    await intro.getByRole('button', { name: '跳过开场' }).click()
    await expect(intro).toHaveCount(0)
    await expect(page.locator('#root > div').first()).not.toHaveAttribute('inert', '')
    await expect(page.locator('.particle-ribbon')).toHaveClass(/is-ready/)
    expect(await page.evaluate(key => sessionStorage.getItem(key), entry.key)).toBe('seen')

    await page.reload()
    await expect(page.locator('.opening-intro')).toHaveCount(0)
    await expect(page.locator('.particle-ribbon')).toHaveClass(/is-ready/)
  }
})

test('the completed typewriter changes its command and enters automatically', async ({ page }) => {
  await page.goto('/')
  const intro = page.getByRole('dialog', { name: /开场：希望能用你停留的 10s/ })
  await expect(intro.locator('.opening-intro-message')).toContainText('换来一个属于我的机会', { timeout: 8000 })
  await expect(intro.locator('.opening-intro-signature')).toContainText('努力找工作的周珈如')
  await expect(intro.getByRole('button', { name: '进入作品' })).toBeVisible()
  await expect(intro).toHaveCount(0, { timeout: 4000 })
  await expect(page.locator('.particle-ribbon')).toHaveClass(/is-ready/)
})

test('mobile and reduced-motion visitors see the complete copy without overflow and can use Escape', async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 720 })
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await page.goto('/music-content')
  const intro = page.getByRole('dialog', { name: /开场：希望能用你停留的 10s/ })
  await expect(intro).toBeVisible()
  await expect(intro.locator('.opening-intro-message')).toContainText('希望能用你停留的 10s，')
  await expect(intro.locator('.opening-intro-message')).toContainText('换来一个属于我的机会')
  await expect(intro.locator('.opening-intro-signature')).toContainText('努力找工作的周珈如')
  await expect(intro.locator('.opening-intro-caret').first()).toHaveCSS('animation-name', 'none')
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true)
  await intro.screenshot({ path: `${captureDir}/home-opening-mobile.png` })
  await page.keyboard.press('Escape')
  await expect(intro).toHaveCount(0)
})
