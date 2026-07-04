// Portable build: inlines all JS/CSS into a single dist-portable/index.html
// that can be opened by double-clicking (file://), no server needed.
// Run with: npm run build:portable
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { viteSingleFile } from 'vite-plugin-singlefile'

export default defineConfig({
  plugins: [react(), viteSingleFile()],
  base: './',
  build: {
    outDir: 'dist-portable',
    chunkSizeWarningLimit: 5000,
  },
})
