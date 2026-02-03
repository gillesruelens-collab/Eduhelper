import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  // De 'base' MOET exact je repository naam zijn met slashes
  base: '/Eduhelper/', 
  plugins: [react()],
  build: {
    outDir: 'dist',
  }
})
