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
        ws: true,
        configure: (proxy) => {
          proxy.on('error', (err) => {
            console.log('proxy error', err);
          });
          proxy.on('proxyReq', (proxyReq) => {
            proxyReq.setHeader('Origin', 'https://api.nodable.ai');
          });
          proxy.on('proxyRes', (proxyRes) => {
            proxyRes.headers['Access-Control-Allow-Origin'] = 'https://app.nodable.ai';
            proxyRes.headers['Access-Control-Allow-Credentials'] = 'true';
          });
        },
      }
    }
  }
});
