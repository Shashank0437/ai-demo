import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
// Vercel-ready: no backend proxy; app uses dummy in-memory data only.
export default defineConfig({
  plugins: [react()],
  server: { port: 5173 },
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
  },
})
