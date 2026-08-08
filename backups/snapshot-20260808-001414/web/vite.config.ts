import { defineConfig } from 'vite'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'

// __dirname helper for ESM ("type": "module").
const dirname = path.dirname(fileURLToPath(import.meta.url))

export default defineConfig({
  plugins: [
    // React and Tailwind plugins are both required for the Make stack.
    react(),
    tailwindcss(),
  ],
  resolve: {
    alias: {
      '@': path.resolve(dirname, './src/app'),
    },
  },
  server: {
    // Proxy API calls to the existing Express backend during dev.
    // The legacy static app in /public stays untouched on :3000.
    proxy: {
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true,
      },
    },
  },
})