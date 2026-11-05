// Renders PNG brand assets (OG image, favicons) with Playwright's Chromium.
// Usage: node scripts/brand/render.cjs   (requires playwright installed globally or locally)
const path = require('path')
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'playwright')
;(async () => {
  const root = path.resolve(__dirname, '../..')
  const browser = await chromium.launch()
  const page = await browser.newPage({ viewport: { width: 1200, height: 630 } })
  await page.goto('file://' + path.join(__dirname, 'og-image.html'))
  await page.screenshot({ path: path.join(root, 'public/og-image.png') })
  for (const [name, size] of [['favicon-32.png', 32], ['apple-touch-icon.png', 180], ['icon-512.png', 512]]) {
    await page.setViewportSize({ width: size, height: size })
    await page.goto('file://' + path.join(root, 'public/favicon.svg'))
    await page.screenshot({ path: path.join(root, 'public', name), omitBackground: true })
  }
  await browser.close()
  console.log('brand assets rendered')
})()
