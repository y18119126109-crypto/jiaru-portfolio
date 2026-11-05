import { expect, test, type Page } from '@playwright/test'
import { readFileSync } from 'node:fs'

const variants = ['music-content', 'ai-music-product'] as const
const pages = [
  { path: '', selector: '.hero' },
  { path: '/resume', selector: '.resume-page' },
  { path: '/music', selector: '.music-page' },
  { path: '/products', selector: '.products-page' },
  { path: '/playlists', selector: '.playlists-page' },
] as const

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    sessionStorage.setItem('jiaru-home-opening:v1:music-content', 'seen')
    sessionStorage.setItem('jiaru-home-opening:v1:ai-music-product', 'seen')
  })
})

async function expectScopedNavigation(page: Page, prefix: string) {
  const links = page.locator('.desktop-nav a')
  await expect(links).toHaveCount(5)
  await expect(links.nth(0)).toHaveAttribute('href', prefix)
  await expect(links.nth(1)).toHaveAttribute('href', `${prefix}/resume`)
  await expect(links.nth(2)).toHaveAttribute('href', `${prefix}/music`)
  await expect(links.nth(3)).toHaveAttribute('href', `${prefix}/products`)
  await expect(links.nth(4)).toHaveAttribute('href', `${prefix}/playlists`)
}

test('both version roots and every nested page support direct visits, refresh and shared content', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' })
  for (const variant of variants) {
    const prefix = `/${variant}`
    for (const entry of pages) {
      await page.goto(`${prefix}${entry.path}`)
      await expect(page.locator(entry.selector)).toBeVisible()
      await expectScopedNavigation(page, prefix)
    }
    await page.reload()
    await expect(page.locator('.playlists-page')).toBeVisible()
  }

  for (const route of ['/music', '/products', '/playlists']) {
    await page.goto(`/music-content${route}`)
    const first = await page.locator('main h1').textContent()
    await page.goto(`/ai-music-product${route}`)
    expect(await page.locator('main h1').textContent()).toBe(first)
  }
})

test('music content resume uses only its source content and original PDF', async ({ page, request }) => {
  await page.goto('/music-content/resume')
  await expect(page.locator('.resume-direction')).toHaveText('原创音乐内容拓展 / 音乐内容运营')
  await expect(page.locator('#projects article')).toHaveCount(3)
  await expect(page.locator('#experience article')).toHaveCount(2)
  await expect(page.locator('#projects')).toContainText('谢菲尔德大学中国作品专场音乐会')
  await expect(page.locator('#projects')).toContainText('单条内容曝光 2000+')
  await expect(page.locator('#projects')).toContainText('谢菲尔德市华人春节联欢晚会（市级）')
  await expect(page.locator('#experience')).toContainText('青岛西海岸新区实验初级中学')
  await expect(page.locator('#skills')).toContainText('内容拓展与项目运营')
  await expect(page.locator('#projects')).not.toContainText('AI 音乐生成与评测实践')
  await expect(page.locator('#experience')).not.toContainText('AI 生成与评测方向')
  const firstProjectHighlights = page.locator('#projects article').first().locator('.entry-highlights')
  const originalMusic = firstProjectHighlights.getByRole('link', { name: '2 首原创音乐，前往音乐创作' })
  const themePlaylists = firstProjectHighlights.getByRole('link', { name: '5 个主题歌单，前往精选歌单' })
  await expect(originalMusic).toHaveAttribute('href', '/music-content/music')
  await expect(themePlaylists).toHaveAttribute('href', '/music-content/playlists')
  await originalMusic.click()
  await expect(page).toHaveURL(/\/music-content\/music$/)
  await page.goBack()
  await themePlaylists.click()
  await expect(page).toHaveURL(/\/music-content\/playlists$/)
  await page.goBack()

  const portfolio = page.getByRole('link', { name: '查看我的作品' })
  await expect(portfolio).toHaveAttribute('href', 'https://dcnpzhkntn0i.feishu.cn/wiki/Zvi4wqfH1ioarokfzKNc35E0nKh')
  const download = page.getByRole('link', { name: '下载简历 PDF' })
  await expect(download).toHaveAttribute('download', '周珈如-音乐内容运营简历.pdf')
  await expect(download).toHaveAttribute('href', '/files/zhou-jiaru-resume-music-content.pdf')
  const response = await request.get('/files/zhou-jiaru-resume-music-content.pdf')
  expect(response.ok()).toBe(true)
  expect((await response.body()).equals(readFileSync('public/files/zhou-jiaru-resume-music-content.pdf'))).toBe(true)

  await page.getByRole('link', { name: 'JIARU 首页' }).click()
  await expect(page).toHaveURL(/\/music-content$/)
  await page.goBack()
  await expect(page).toHaveURL(/\/music-content\/resume$/)
})

test('AI music product resume uses only its source content and original PDF', async ({ page, request }) => {
  await page.goto('/ai-music-product/resume')
  await expect(page.locator('.resume-direction')).toHaveText('音乐产品经理 / AI 音乐产品运营')
  await expect(page.locator('#projects article')).toHaveCount(3)
  await expect(page.locator('#experience article')).toHaveCount(1)
  await expect(page.locator('#projects')).toContainText('AI 音乐生成与评测实践')
  await expect(page.locator('#projects')).toContainText('提示词遵循、旋律、曲式结构、编配、人声和音质')
  await expect(page.locator('#projects')).toContainText('《小提琴持弓方法探究》')
  await expect(page.locator('#experience')).toContainText('跨部门协作与项目推进')
  await expect(page.locator('#skills')).toContainText('Agent 工作流')
  await expect(page.locator('#projects')).not.toContainText('谢菲尔德大学中国作品专场音乐会')
  await expect(page.locator('#experience')).not.toContainText('创作者拓展')
  await expect(page.locator('#projects article').first().locator('.entry-highlights a')).toHaveCount(0)
  const musicProject = page.getByRole('link', { name: '查看 AI 音乐创作' })
  await expect(musicProject).toHaveAttribute('href', '/ai-music-product/music')
  await musicProject.click()
  await expect(page).toHaveURL(/\/ai-music-product\/music$/)
  await page.goBack()
  const foreverProject = page.getByRole('link', { name: '查看 Forever 产品作品' })
  await expect(foreverProject).toHaveAttribute('href', '/ai-music-product/products#forever')
  await foreverProject.click()
  await expect(page).toHaveURL(/\/ai-music-product\/products#forever$/)
  await expect.poll(() => page.locator('#forever').evaluate(element => Math.round(element.getBoundingClientRect().top))).toBeLessThan(150)
  await page.goBack()

  await expect(page.getByRole('link', { name: '查看我的作品' })).toHaveAttribute('href', '/ai-music-product/products')
  const download = page.getByRole('link', { name: '下载简历 PDF' })
  await expect(download).toHaveAttribute('download', '周珈如-AI音乐产品运营简历.pdf')
  await expect(download).toHaveAttribute('href', '/files/zhou-jiaru-resume-ai-music-product.pdf')
  const response = await request.get('/files/zhou-jiaru-resume-ai-music-product.pdf')
  expect(response.ok()).toBe(true)
  expect((await response.body()).equals(readFileSync('public/files/zhou-jiaru-resume-ai-music-product.pdf'))).toBe(true)
})

test('cross-page, mobile and not-found navigation retain the active version prefix', async ({ page }) => {
  await page.goto('/music-content/playlists')
  await expect(page.locator('.playlist-breadcrumb').getByRole('link', { name: '首页' })).toHaveAttribute('href', '/music-content')
  await expect(page.getByRole('link', { name: '听听我的 AI 音乐' })).toHaveAttribute('href', '/music-content/music')
  await page.getByRole('link', { name: '听听我的 AI 音乐' }).click()
  await expect(page).toHaveURL(/\/music-content\/music$/)

  await page.setViewportSize({ width: 390, height: 844 })
  await page.goto('/ai-music-product')
  await page.getByRole('button', { name: '打开导航菜单' }).click()
  const mobileLinks = page.locator('#mobile-nav a')
  await expect(mobileLinks.nth(0)).toHaveAttribute('href', '/ai-music-product')
  await expect(mobileLinks.nth(1)).toHaveAttribute('href', '/ai-music-product/resume')
  await expect(mobileLinks.nth(2)).toHaveAttribute('href', '/ai-music-product/music')
  await expect(mobileLinks.nth(3)).toHaveAttribute('href', '/ai-music-product/products')
  await expect(mobileLinks.nth(4)).toHaveAttribute('href', '/ai-music-product/playlists')

  await page.goto('/ai-music-product/not-found')
  await expect(page.getByRole('dialog')).toContainText('这个角落，还没有故事')
  await page.getByRole('button', { name: '回到首页' }).click()
  await expect(page).toHaveURL(/\/ai-music-product$/)
})
