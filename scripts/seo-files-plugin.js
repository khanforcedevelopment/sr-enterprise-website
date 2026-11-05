/**
 * Generates sitemap.xml and robots.txt at build time.
 *
 * The site URL comes from (in order):
 *   1. SITE_URL environment variable (set this in Netlify once your custom domain is live)
 *   2. URL environment variable (Netlify sets this automatically to the site's main URL)
 *   3. none: links in index.html stay relative, robots.txt is written without a Sitemap line
 *      and sitemap.xml is skipped (a sitemap needs absolute URLs). Used for Netlify Drop builds.
 */
import { writeFileSync } from 'node:fs'
import { resolve } from 'node:path'

const ROUTES = [
  { path: '/', changefreq: 'monthly', priority: '1.0' },
  { path: '/privacy-policy', changefreq: 'yearly', priority: '0.3' },
  { path: '/terms-and-conditions', changefreq: 'yearly', priority: '0.3' },
  { path: '/refund-policy', changefreq: 'yearly', priority: '0.3' },
]

const getSiteUrl = () =>
  (process.env.SITE_URL || process.env.VITE_SITE_URL || process.env.URL || '').replace(/\/$/, '')

export function seoFilesPlugin() {
  let outDir = 'dist'
  let isBuild = false
  return {
    name: 'seo-files',
    configResolved(config) {
      outDir = resolve(config.root, config.build.outDir)
      isBuild = config.command === 'build'
    },
    // Replace __SITE_URL__ placeholders in index.html (canonical, Open Graph, structured data)
    transformIndexHtml(html) {
      return html.replaceAll('__SITE_URL__', getSiteUrl())
    },
    closeBundle() {
      if (!isBuild) return
      const siteUrl = getSiteUrl()
      const today = new Date().toISOString().slice(0, 10)

      const urls = ROUTES.map(
        (r) => `  <url>
    <loc>${siteUrl}${r.path}</loc>
    <lastmod>${today}</lastmod>
    <changefreq>${r.changefreq}</changefreq>
    <priority>${r.priority}</priority>
  </url>`
      ).join('\n')

      const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls}
</urlset>
`
      const robots = `User-agent: *
Allow: /
Disallow: /payment/
Disallow: /admin
Disallow: /pay
${siteUrl ? `\nSitemap: ${siteUrl}/sitemap.xml\n` : ''}`
      writeFileSync(resolve(outDir, 'robots.txt'), robots)
      if (siteUrl) {
        writeFileSync(resolve(outDir, 'sitemap.xml'), sitemap)
        console.log(`\n[seo-files] sitemap.xml and robots.txt written for ${siteUrl}`)
      } else {
        console.log('\n[seo-files] No SITE_URL set: robots.txt written, sitemap.xml skipped')
      }
    },
  }
}
