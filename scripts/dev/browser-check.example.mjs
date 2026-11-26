// A starting point for checking the Studio or the game in headless Chrome.
// playwright-core is not a project dependency: install it outside the repo
// (e.g. `npm i playwright-core` in a scratch folder) and run this from there.
//
//   npm run studio:build && node scripts/dev/serve-with-csp.mjs studio 4319
//   node <scratch>/browser-check.mjs
//
// Every check reports CSP violations and console errors; both must be empty.
import { chromium } from 'playwright-core'

const browser = await chromium.launch({ executablePath: '/usr/bin/google-chrome', headless: true })
const context = await browser.newContext({ viewport: { width: 1440, height: 1100 }, acceptDownloads: true })
const page = await context.newPage()
await page.addInitScript(() => {
  window.__csp = []
  document.addEventListener('securitypolicyviolation', (e) => window.__csp.push(`${e.violatedDirective} ${e.blockedURI}`))
})
const errors = []
page.on('pageerror', (e) => errors.push(e.message))
page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()) })
const flat = (text) => text.replace(/\s+/g, ' ').trim()
// The checks settle after each edit: the toolbar's checks button leaves "Checking…"
const settle = async () => { await page.waitForTimeout(1300); await page.locator('.checks-toggle.status-ok, .checks-toggle.status-problems').waitFor({ timeout: 20000 }) }

await page.goto('http://localhost:4319/', { waitUntil: 'load' })
await page.getByRole('button', { name: 'Copy and adapt The Monolith of Mild Despair' }).click()
await settle()
console.log('checks:', flat(await page.locator('.checks-menu [role="status"]').innerText()))
await page.screenshot({ path: 'studio-workspace.png', fullPage: true })

console.log('CSP violations:', await page.evaluate(() => window.__csp), '| errors:', errors)
await browser.close()
