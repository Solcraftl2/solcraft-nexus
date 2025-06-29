import http from 'node:http'
import fs from 'node:fs'
import path from 'node:path'

// Ensure build output exists
if (!fs.existsSync(path.join('dist', 'index.html'))) {
  console.error('dist/index.html not found. Did you run pnpm run build?')
  process.exit(1)
}

// Simple HTTP server serving built index.html for any route
const server = http.createServer((req, res) => {
  fs.createReadStream(path.join('dist', 'index.html')).pipe(res)
})

server.listen(5080, async () => {
  try {
    const resp = await fetch('http://localhost:5080/dashboard')
    if (resp.status !== 200) {
      console.error('Expected status 200 but got', resp.status)
      process.exitCode = 1
    } else {
      console.log('Health check passed')
    }
  } catch (err) {
    console.error('Health check failed', err)
    process.exitCode = 1
  } finally {
    server.close()
  }
})
