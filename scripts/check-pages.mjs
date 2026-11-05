import assert from 'node:assert/strict'
import { readdir, readFile, stat } from 'node:fs/promises'
import { join, relative, resolve } from 'node:path'

const root = resolve('dist')
async function collect(directory) {
  const files = []
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const path = join(directory, entry.name)
    if (entry.isDirectory()) files.push(...await collect(path))
    else if (entry.isFile()) files.push({ path: relative(root, path), size: (await stat(path)).size })
  }
  return files
}
const files = await collect(root)
assert(files.length > 0 && files.length <= 20_000, 'Pages Free permits up to 20,000 files.')
for (const file of files) {
  assert(file.size <= 25 * 1024 * 1024, `${file.path} exceeds Pages' 25 MiB per-file limit.`)
  assert(!/(^|\/)\.env|\.map$/u.test(file.path), `Unexpected deployment asset: ${file.path}`)
}
for (const asset of [
  'index.html', 'favicon.svg',
  'audio/music/stay-with-me.mp3', 'audio/music/rain-talk.mp3',
  'audio/woodland-stream.mp3',
  'files/zhou-jiaru-resume.pdf',
  'files/zhou-jiaru-resume-music-content.pdf',
  'files/zhou-jiaru-resume-ai-music-product.pdf',
  'video/products/rain-writer.mp4', 'video/products/swagger.mp4',
  'video/products/rain-writer-poster.jpg', 'video/products/swagger-poster.jpg',
]) assert(files.some(file => file.path === asset), `Missing public asset: ${asset}`)
const playlistsEntry = files.find(file => /^assets\/PlaylistsPage-[^/]+\.js$/u.test(file.path))
const playlistSearch = files.find(file => /^assets\/playlistSearch-[^/]+\.js$/u.test(file.path))
assert(playlistsEntry && playlistsEntry.size <= 100 * 1024, 'Keep the playlist route below 100 KiB; pinyin search must stay deferred.')
assert(playlistSearch, 'Missing the deferred pinyin search chunk.')
// Pages natively falls back to index.html for an SPA without a root 404.html.
// A catch-all rewrite to /index.html is rejected by current Wrangler as a loop.
assert(!files.some(file => file.path === '404.html'), 'A root 404.html disables the Pages SPA fallback.')
assert(!files.some(file => file.path === '_redirects'), 'Review custom redirects before changing the native SPA fallback.')
const html = await readFile(join(root, 'index.html'), 'utf8')
assert(
  html.includes('id="boot-loader"') && html.includes('id="boot-retry"') && html.includes('class="boot-title"'),
  'Missing the meaningful static first-load shell.',
)
assert(!/rel="modulepreload"[^>]+motion-/u.test(html), 'Framer Motion must not block the homepage entry.')
assert(!html.includes('/src/') && !html.includes('localhost:'), 'Deploy the production build, not the Vite entry.')
for (const [, url] of html.matchAll(/(?:src|href)="(\/assets\/[^"]+)"/g)) {
  assert(files.some(file => `/${file.path}` === url), `Missing bundled entry: ${url}`)
}
const total = files.reduce((sum, file) => sum + file.size, 0)
const largest = [...files].sort((a, b) => b.size - a.size)[0]
console.log(`Pages preflight passed: ${files.length} files, ${(total / 1048576).toFixed(2)} MiB total.`)
console.log(`Largest: ${largest.path} (${(largest.size / 1048576).toFixed(2)} MiB / 25 MiB).`)
console.log(`Playlist route: ${(playlistsEntry.size / 1024).toFixed(2)} KiB; pinyin search remains a separate on-demand chunk.`)
console.log('SPA fallback, production entry, music, stream audio, all resume PDFs and both product recordings/posters present.')
console.log(files.length <= 1000 ? 'Also within the dashboard drag-and-drop file limit (1,000).' : 'Use Git integration or Wrangler; dashboard drag-and-drop is limited to 1,000 files.')
