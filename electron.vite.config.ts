import { defineConfig, externalizeDepsPlugin } from 'electron-vite'
import react from '@vitejs/plugin-react'
import { resolve } from 'path'
import { readFileSync } from 'fs'

const { version } = JSON.parse(readFileSync('./package.json', 'utf-8')) as { version: string }

export default defineConfig({
  main: {
    plugins: [externalizeDepsPlugin()]
  },
  preload: {
    plugins: [externalizeDepsPlugin()]
  },
  renderer: {
    optimizeDeps: {
      include: ['pdfmake/build/pdfmake', 'pdfmake/build/vfs_fonts']
    },
    root: 'src/renderer',
    resolve: {
      alias: {
        '@renderer': resolve('src/renderer')
      }
    },
    plugins: [react()],
    define: {
      __APP_VERSION__: JSON.stringify(version)
    }
  }
})
