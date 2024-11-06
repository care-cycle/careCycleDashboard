// vite.config.ts
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api': {
        target: 'https://api.nodable.ai',
        changeOrigin: true,
        secure: false, // Set to true if SSL is valid
        // No path rewrite
        configure: (proxy) => {
          proxy.on('proxyReq', (proxyReq, req) => {
            console.log('Proxying request:', {
              originalUrl: req.url,
              targetUrl: proxyReq.path,
              method: req.method,
              headers: proxyReq.getHeaders()
            });
          });

          proxy.on('error', (err, req, res) => {
            console.error('Proxy encountered an error:', err);
            res.writeHead(500, {
              'Content-Type': 'text/plain',
            });
            res.end('Proxy error');
          });

          proxy.on('proxyRes', (proxyRes, req) => {
            console.log('Received response from target:', {
              statusCode: proxyRes.statusCode,
              headers: proxyRes.headers,
              url: req.url
            });
          });
        },
      }
    }
  }
});