export const siteVariantPrefixes = {
  'music-content': '/music-content',
  'ai-music-product': '/ai-music-product',
} as const

export type SiteVariant = keyof typeof siteVariantPrefixes
export type SitePagePath = '/' | '/resume' | '/music' | '/products' | '/playlists'

const sitePagePaths = new Set<SitePagePath>([
  '/',
  '/resume',
  '/music',
  '/products',
  '/playlists',
])

export interface SiteRoute {
  variant?: SiteVariant
  prefix: string
  pagePath: string
  isKnownPage: boolean
}

function normalizePathname(pathname: string) {
  if (!pathname || pathname === '/') return '/'
  return pathname.replace(/\/+$/u, '') || '/'
}

export function parseSiteRoute(pathname: string): SiteRoute {
  const normalized = normalizePathname(pathname)
  for (const [variant, prefix] of Object.entries(siteVariantPrefixes) as [SiteVariant, string][]) {
    if (normalized !== prefix && !normalized.startsWith(`${prefix}/`)) continue
    const pagePath = normalized === prefix ? '/' : normalized.slice(prefix.length)
    return {
      variant,
      prefix,
      pagePath,
      isKnownPage: sitePagePaths.has(pagePath as SitePagePath),
    }
  }
  return {
    prefix: '',
    pagePath: normalized,
    isKnownPage: sitePagePaths.has(normalized as SitePagePath),
  }
}

export function siteHomePath(currentPathname: string) {
  return parseSiteRoute(currentPathname).prefix || '/'
}

export function scopeSiteTarget(target: string, currentPathname: string) {
  if (!target.startsWith('/')) return target
  const suffixIndex = target.search(/[?#]/u)
  const pathname = suffixIndex === -1 ? target : target.slice(0, suffixIndex)
  const suffix = suffixIndex === -1 ? '' : target.slice(suffixIndex)
  const current = parseSiteRoute(currentPathname)
  if (!current.prefix || !sitePagePaths.has(normalizePathname(pathname) as SitePagePath)) return target
  const normalized = normalizePathname(pathname)
  return `${current.prefix}${normalized === '/' ? '' : normalized}${suffix}`
}
