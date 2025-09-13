#!/usr/bin/env node

import fs from 'fs-extra'
import path from 'path'
import archiver from 'archiver'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const projectRoot = path.resolve(__dirname, '..')
const distDir = path.join(projectRoot, 'dist')
const deployDir = path.join(projectRoot, 'deploy')

async function buildServer() {
  console.log('🚀 Building server deployment package...')
  
  // Clean and create deploy directory
  await fs.emptyDir(deployDir)
  
  // Copy built files from dist
  if (await fs.pathExists(distDir)) {
    await fs.copy(distDir, deployDir)
    console.log('✅ Copied build files')
  } else {
    console.error('❌ Dist directory not found. Please run "npm run build" first.')
    process.exit(1)
  }
  
  // Create a simple server.js file for serving the app
  const serverCode = `const http = require('http');
const fs = require('fs');
const path = require('path');
const url = require('url');

const PORT = process.env.PORT || 3000;

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
};

const server = http.createServer((req, res) => {
  const parsedUrl = url.parse(req.url, true);
  let pathname = parsedUrl.pathname;
  
  // Default to index.html for root requests
  if (pathname === '/') {
    pathname = '/index.html';
  }
  
  const filePath = path.join(__dirname, pathname);
  
  // Security: prevent directory traversal
  if (!filePath.startsWith(__dirname)) {
    res.writeHead(403);
    res.end('Forbidden');
    return;
  }
  
  fs.readFile(filePath, (err, data) => {
    if (err) {
      if (err.code === 'ENOENT') {
        // Try to serve index.html for SPA routing
        fs.readFile(path.join(__dirname, 'index.html'), (err, data) => {
          if (err) {
            res.writeHead(404);
            res.end('Not found');
          } else {
            res.writeHead(200, { 'Content-Type': 'text/html' });
            res.end(data);
          }
        });
      } else {
        res.writeHead(500);
        res.end('Server error');
      }
    } else {
      const ext = path.extname(filePath);
      const mimeType = mimeTypes[ext] || 'application/octet-stream';
      
      res.writeHead(200, { 'Content-Type': mimeType });
      res.end(data);
    }
  });
});

server.listen(PORT, () => {
  console.log(\`🚀 Dance Course Planner running on http://localhost:\${PORT}\`);
  console.log('📋 Don\\'t forget to place your schedule.json file in this directory');
});`
  
  await fs.writeFile(path.join(deployDir, 'server.js'), serverCode)
  console.log('✅ Created server.js')
  
  // Create package.json for the server
  const serverPackageJson = {
    name: 'dance-course-planner-server',
    version: '1.0.0',
    description: 'Dance Course Planner - Production Server',
    main: 'server.js',
    scripts: {
      start: 'node server.js'
    },
    engines: {
      node: '>=14.0.0'
    }
  }
  
  await fs.writeFile(
    path.join(deployDir, 'package.json'), 
    JSON.stringify(serverPackageJson, null, 2)
  )
  console.log('✅ Created package.json for server')
  
  // Create README for deployment
  const deployReadme = `# Dance Course Planner - Deployment

This package contains the built Dance Course Planner application ready for deployment.

## Quick Start

1. Upload all files to your server
2. Place your \`schedule.json\` file in the same directory
3. Install Node.js (version 14 or higher) on your server
4. Run: \`node server.js\`

The application will be available at http://your-server:3000

## Files

- \`index.html\` - The main application
- \`assets/\` - JavaScript and CSS files  
- \`server.js\` - Simple Node.js server
- \`package.json\` - Server configuration
- \`schedule.json\` - Your course schedule data (you need to provide this)

## Alternative Deployment

If you prefer not to use Node.js, you can serve the static files using any web server:

- Apache: Place files in your document root
- Nginx: Configure to serve static files
- Any static hosting service (Netlify, Vercel, etc.)

Just make sure your \`schedule.json\` file is accessible at the root URL.

## Environment Variables

- \`PORT\` - Server port (default: 3000)

## Support

For issues or questions, please check the main project repository.
`
  
  await fs.writeFile(path.join(deployDir, 'README.md'), deployReadme)
  console.log('✅ Created deployment README')
  
  // Create a deployment archive
  const archivePath = path.join(projectRoot, 'dance-course-planner-deploy.zip')
  const output = fs.createWriteStream(archivePath)
  const archive = archiver('zip', { zlib: { level: 9 } })
  
  return new Promise((resolve, reject) => {
    output.on('close', () => {
      console.log(`✅ Created deployment archive: ${archivePath}`)
      console.log(`📦 Archive size: ${(archive.pointer() / 1024 / 1024).toFixed(2)} MB`)
      console.log('')
      console.log('🎉 Deployment package ready!')
      console.log('📋 Next steps:')
      console.log('   1. Extract dance-course-planner-deploy.zip on your server')
      console.log('   2. Add your schedule.json file')
      console.log('   3. Run: node server.js')
      resolve()
    })
    
    archive.on('error', reject)
    archive.pipe(output)
    archive.directory(deployDir, false)
    archive.finalize()
  })
}

buildServer().catch(console.error)
