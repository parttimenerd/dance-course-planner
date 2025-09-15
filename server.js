import http from 'http'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const PORT = process.env.PORT || 3000

const mimeTypes = {
  '.html': 'text/html',
  '.js': 'text/javascript',
  '.css': 'text/css',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon'
}

const server = http.createServer((req, res) => {
  // Add CORS headers for development
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')

  if (req.method === 'OPTIONS') {
    res.writeHead(200)
    res.end()
    return
  }

  let pathname = new URL(req.url, `http://localhost:${PORT}`).pathname
  
  // Serve static files
  
  // Serve built files from dist directory
  const distPath = path.join(__dirname, 'dist')
  
  // Default to index.html for root requests
  if (pathname === '/') {
    pathname = '/index.html'
  }
  
  const filePath = path.join(distPath, pathname)
  
  // Security: prevent directory traversal
  if (!filePath.startsWith(distPath)) {
    res.writeHead(403)
    res.end('Forbidden')
    return
  }
  
  fs.readFile(filePath, (err, data) => {
    if (err) {
      if (err.code === 'ENOENT') {
        // Try to serve index.html for SPA routing
        fs.readFile(path.join(distPath, 'index.html'), (err, data) => {
          if (err) {
            res.writeHead(404)
            res.end('Build files not found. Please run "npm run build" first.')
          } else {
            res.writeHead(200, { 'Content-Type': 'text/html' })
            res.end(data)
          }
        })
      } else {
        res.writeHead(500)
        res.end('Server error')
      }
    } else {
      const ext = path.extname(filePath)
      const mimeType = mimeTypes[ext] || 'application/octet-stream'
      
      res.writeHead(200, { 'Content-Type': mimeType })
      res.end(data)
    }
  })
})

server.listen(PORT, () => {
  console.log(`🚀 Dance Course Planner server running on http://localhost:${PORT}`)
  console.log('📋 Make sure to:')
  console.log('   1. Run "npm run build" to build the app')
  console.log('   2. Login with your Nimbuscloud credentials in the app')
  console.log('   3. Visit http://localhost:' + PORT + ' in your browser')
})
