import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  // De 'base' moet exact overeenkomen met je repository naam op GitHub
  base: '/Eduhelper/',
  plugins: [react()],
  build: {
    // Dit zorgt ervoor dat de build-output in de juiste map terechtkomt voor de Action
    outDir: 'dist',
  }
})
