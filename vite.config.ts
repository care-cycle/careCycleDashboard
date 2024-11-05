import { fileURLToPath } from 'url'
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url))
    },
  },
  envPrefix: 'VITE_',
  server: {
    proxy: {
      '/api': {
        target: 'https://api.nodable.ai',
        changeOrigin: true,
        secure: false,
        ws: true
      }
    }
  }
});
