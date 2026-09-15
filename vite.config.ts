import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'node:path'

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:8000',
        changeOrigin: true,
        rewrite: path => path.replace(/^\/api/, ''),
      },
    },
  },
  preview: {
    allowedHosts: [
      'ivanpashkulev.com',
      'aws.ivanpashkulev.com',
      'gcp.ivanpashkulev.com',
      'az.ivanpashkulev.com',
    ],
  },
  resolve: {
    alias: {
      '@': path.resolve(import.meta.dirname, './src'),
    },
  },
})
