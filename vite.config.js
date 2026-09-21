import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

const CACHE_IMMUTABLE = 'public, max-age=31536000, immutable';

const staticCachePlugin = () => ({
  name: 'static-cache-headers',
  configureServer(server) {
    server.middlewares.use((req, res, next) => {
      const url = req.url || '';
      if (/\.(mp4|webm|ogg|mov|jpg|jpeg|png|webp|avif|gif|svg|ico|ttf|woff|woff2|otf)$/i.test(url)) {
        res.setHeader('Cache-Control', CACHE_IMMUTABLE);
        res.setHeader('X-Content-Type-Options', 'nosniff');
        if (/\.(mp4|webm|ogg|mov)$/i.test(url)) {
          res.setHeader('Accept-Ranges', 'bytes');
        }
      }
      next();
    });
  },
  configurePreviewServer(server) {
    server.middlewares.use((req, res, next) => {
      const url = req.url || '';
      if (/\.(mp4|webm|ogg|mov|jpg|jpeg|png|webp|avif|gif|svg|ico|ttf|woff|woff2|otf)$/i.test(url)) {
        res.setHeader('Cache-Control', CACHE_IMMUTABLE);
      }
      next();
    });
  },
});

export default defineConfig({
  plugins: [react(), tailwindcss(), staticCachePlugin()],
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true,
      },
      '/socket.io': {
        target: 'http://localhost:5000',
        ws: true,
        changeOrigin: true,
      },
    }
  }
})
