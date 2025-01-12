// vite.config.ts
import { fileURLToPath } from 'url';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  const isDev = env.VITE_NODE_ENV === 'development';
  
  console.log('Vite Config:', {
    apiTarget: isDev ? env.VITE_API_BASE_URL : env.VITE_PROD_API_BASE_URL,
    isDev,
    host: env.VITE_DEV_HOST,
    port: env.VITE_DEV_PORT
  });

  return {
    plugins: [react()],
    resolve: {
      alias: {
        '@': fileURLToPath(new URL('./src', import.meta.url))
      },
    },
    server: {
      host: env.VITE_DEV_HOST,
      port: parseInt(env.VITE_DEV_PORT),
      strictPort: true,
      proxy: {
        '/api': {
          target: isDev ? env.VITE_API_BASE_URL : env.VITE_PROD_API_BASE_URL,
          changeOrigin: true,
          secure: !isDev,
          configure: (proxy) => {
            // Add error handling
            proxy.on('error', (err, req) => {
              console.error('Proxy Error:', {
                error: err.message,
                path: req.path,
                target: isDev ? env.VITE_API_BASE_URL : env.VITE_PROD_API_BASE_URL
              });
            });

            // Add request logging
            proxy.on('proxyReq', (proxyReq, req) => {
              console.log('Proxying request:', {
                path: proxyReq.path,
                method: proxyReq.method,
                headers: {
                  auth: !!req.headers.authorization,
                  orgId: !!req.headers['x-organization-id']
                }
              });

              if (proxyReq.path.startsWith('/api/api')) {
                proxyReq.path = proxyReq.path.replace('/api/api', '/api');
              }

              if (req.headers.authorization) {
                proxyReq.setHeader('Authorization', req.headers.authorization);
              }
              if (req.headers['x-organization-id']) {
                proxyReq.setHeader('x-organization-id', req.headers['x-organization-id']);
              }
            });
          },
          rewrite: (path) => {
            console.log('Rewriting path:', {
              from: path,
              to: path.replace(/^\/api/, '')
            });
            return path.replace(/^\/api/, '');
          }
        },
      },
    },
  };
});