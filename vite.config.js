import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

export default defineConfig({
  plugins: [vue()],
  base: '/dance-planner/',
  server: {
    host: true,
    port: 3000
  },
  build: {
    sourcemap: false // Disable source maps to avoid warnings
  }
})
