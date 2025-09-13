import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { copyFileSync, existsSync } from 'fs'
import { resolve } from 'path'

export default defineConfig({
  plugins: [
    vue(),
    // Plugin to copy schedule.json to dist folder during build
    {
      name: 'copy-schedule',
      writeBundle() {
        const source = resolve(__dirname, 'schedule.json')
        const dest = resolve(__dirname, 'dist', 'schedule.json')
        
        if (existsSync(source)) {
          copyFileSync(source, dest)
          console.log('✅ Copied schedule.json to dist folder')
        } else {
          console.warn('⚠️  schedule.json not found in root directory - you need to add it manually')
        }
      }
    }
  ],
  base: '/dance-planner/',
  server: {
    host: true,
    port: 3000
  },
  build: {
    sourcemap: false // Disable source maps to avoid warnings
  }
})
