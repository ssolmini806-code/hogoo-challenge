import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { resolve } from 'path'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
        give: resolve(__dirname, 'give-test.html'),
        hogoo: resolve(__dirname, 'hogoo-test.html'),
        about: resolve(__dirname, 'about.html'),
        privacy: resolve(__dirname, 'privacy.html'),
        terms: resolve(__dirname, 'terms.html'),
        affiliate: resolve(__dirname, 'affiliate.html'),
        // Articles
        'article-burnout': resolve(__dirname, 'articles/giver-burnout.html'),
        'article-boundaries': resolve(__dirname, 'articles/setting-boundaries.html'),
        'article-signals': resolve(__dirname, 'articles/taker-signals.html'),
        'article-guide': resolve(__dirname, 'articles/smart-giver-guide.html'),
      },
    },
  },
})
