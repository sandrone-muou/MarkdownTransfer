import { defineConfig } from 'vite'

export default defineConfig({
  root: '.',
  build: {
    outDir: 'dist',
    sourcemap: true,
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['marked']
        }
      }
    }
  },
  server: {
    port: 3000,
    open: true
  }
})
