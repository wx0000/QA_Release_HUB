import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { resolve } from 'path'

export default defineConfig({
  root: 'src/renderer',
  resolve: {
    alias: {
      '@renderer': resolve(__dirname, 'src/renderer')
    }
  },
  plugins: [react()]
})
