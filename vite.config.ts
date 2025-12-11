import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  // Use '.' for current directory instead of process.cwd() to avoid TS issues if node types are missing
  const env = loadEnv(mode, '.', '');
  return {
    plugins: [react()],
    define: {
      // Isso previne o erro "process is not defined" no navegador
      'process.env.API_KEY': JSON.stringify(env.API_KEY),
      'process.env': JSON.stringify(env)
    },
    build: {
      outDir: 'dist',
    }
  }
})