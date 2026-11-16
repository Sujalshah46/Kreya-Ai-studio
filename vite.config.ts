import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { handleApiRequest } from './server/apiRouter.js';

export default defineConfig({
  plugins: [
    react(),
    {
      name: 'api-server-middleware',
      configureServer(server) {
        server.middlewares.use(async (req, res, next) => {
          if (req.url && req.url.startsWith('/api/')) {
            const parsedUrl = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
            try {
              const handled = await handleApiRequest(req, res, parsedUrl.pathname, parsedUrl.searchParams);
              if (handled) return;
            } catch (err) {
              console.error('Dev API Error:', err);
            }
          }
          next();
        });
      }
    }
  ],
  server: {
    port: 3000,
    host: true
  }
});
