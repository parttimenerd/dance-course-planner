import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { copyFileSync, existsSync } from 'fs'
import { resolve } from 'path'

export default defineConfig({
  plugins: [
    vue(),
    {
      name: 'copy-config',
      generateBundle() {
        // Copy app.config.json to dist if it exists
        const configSource = resolve(__dirname, 'src/config/app.config.json')
        const configDest = resolve(__dirname, 'dist/src/config/app.config.json')
        
        if (existsSync(configSource)) {
          // Ensure the destination directory exists
          import('fs').then(fs => {
            fs.mkdirSync(resolve(__dirname, 'dist/src/config'), { recursive: true })
            copyFileSync(configSource, configDest)
            console.log('✓ Copied app.config.json to build output')
          })
        } else {
          console.log('ℹ No app.config.json found, application will use defaults')
        }
      }
    }
  ],
  base: '/dance-planner/',
  server: {
    host: true,
    port: 3000,
    hmr: {
      overlay: true
    },
    watch: {
      usePolling: true
    }
  },
  build: {
    sourcemap: false // Disable source maps to avoid warnings
  }
})
