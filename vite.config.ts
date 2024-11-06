// vite.config.ts
import { fileURLToPath } from 'url';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  const isDev = env.VITE_NODE_ENV === 'development';

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
            proxy.on('proxyReq', (proxyReq, req) => {
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
        },
      },
    },
  };
});