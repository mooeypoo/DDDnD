// Serves a production build with the Content-Security-Policy from its
// netlify.toml and an SPA fallback, so headless Chrome sees what Netlify serves
// (`vite preview` sends no CSP).
//
// Usage: node scripts/dev/serve-with-csp.mjs <folder with netlify.toml and dist/> <port>
//   game:   npm run build        && node scripts/dev/serve-with-csp.mjs . 5317
//   studio: npm run studio:build && node scripts/dev/serve-with-csp.mjs studio 4319
import http from 'node:http'
import fs from 'node:fs'
import path from 'node:path'

const [root, port] = process.argv.slice(2)
const toml = fs.readFileSync(path.join(root, 'netlify.toml'), 'utf8')
const csp = toml.match(/Content-Security-Policy = "([^"]+)"/)[1]
const types = { '.js': 'text/javascript', '.css': 'text/css', '.html': 'text/html', '.json': 'application/json', '.svg': 'image/svg+xml', '.png': 'image/png', '.jpg': 'image/jpeg', '.webp': 'image/webp', '.ico': 'image/x-icon', '.woff2': 'font/woff2' }
const dist = path.resolve(root, 'dist')
http.createServer((req, res) => {
  let file = path.join(dist, decodeURIComponent(new URL(req.url, 'http://x').pathname))
  if (!file.startsWith(dist) || !fs.existsSync(file) || fs.statSync(file).isDirectory()) file = path.join(dist, 'index.html')
  res.writeHead(200, { 'Content-Type': types[path.extname(file)] ?? 'application/octet-stream', 'Content-Security-Policy': csp })
  fs.createReadStream(file).pipe(res)
}).listen(Number(port), () => console.log(`serving ${dist} on ${port} with CSP: ${csp}`))
