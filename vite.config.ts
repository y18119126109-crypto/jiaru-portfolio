import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    watch: {
      ignored: ['**/.dbg/**', '**/.artifacts/**'],
    },
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (!id.includes('/node_modules/')) return
          if (/\/node_modules\/(?:react|react-dom|scheduler)\//u.test(id)) return 'react'
          if (/\/node_modules\/(?:react-router|react-router-dom)\//u.test(id)) return 'router'
          if (/\/node_modules\/(?:framer-motion|motion-dom|motion-utils)\//u.test(id)) return 'motion'
          if (id.includes('/node_modules/three/')) return 'three'
        },
      },
    },
  },
})
