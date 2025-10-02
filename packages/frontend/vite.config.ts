import vue from '@vitejs/plugin-vue'
import dotenv from 'dotenv'
import { resolve } from 'path'
import { defineConfig } from 'vite'

dotenv.config({ path: resolve(__dirname, '../../config/env/.env') })
const port = process.env.GAME_PORT

// https://vite.dev/config/
export default defineConfig({
  plugins: [vue()],
  envDir: '../../config/env',
  envPrefix: ['GAME_'],
  resolve: {
    alias: {
      '@': resolve(__dirname, './src'),
    },
  },
  server: {
    proxy: {
      '/api': {
        target: `http://localhost:${port}`,
        changeOrigin: true,
      },
      '/ws': {
        target: `ws://localhost:${port}`,
        changeOrigin: true,
        ws: true,
      },
    },
  },
})
