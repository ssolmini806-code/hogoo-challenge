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
        'give-prologue': resolve(__dirname, 'give-prologue.html'),
        'result-sequence': resolve(__dirname, 'result-sequence.html'),
        hogoo: resolve(__dirname, 'hogoo-test.html'),
        'hogoo-check': resolve(__dirname, 'hogoo-check.html'),
        'relationship-risk': resolve(__dirname, 'relationship-risk.html'),
        'refusal-test': resolve(__dirname, 'refusal-test.html'),
        'selfless-otherish-test': resolve(__dirname, 'selfless-otherish-test.html'),
        reviews: resolve(__dirname, 'reviews.html'),
        about: resolve(__dirname, 'about.html'),
        'white-psychology': resolve(__dirname, 'white-psychology.html'),
        privacy: resolve(__dirname, 'privacy.html'),
        terms: resolve(__dirname, 'terms.html'),
        affiliate: resolve(__dirname, 'affiliate.html'),
        // Articles
        'article-burnout': resolve(__dirname, 'articles/giver-burnout.html'),
        'article-boundaries': resolve(__dirname, 'articles/setting-boundaries.html'),
        'article-signals': resolve(__dirname, 'articles/taker-signals.html'),
        'article-guide': resolve(__dirname, 'articles/smart-giver-guide.html'),
        'article-loss': resolve(__dirname, 'articles/loss-aversion-relationships.html'),
        'article-curiosity': resolve(__dirname, 'articles/curiosity-gap-patterns.html'),
        'article-lace': resolve(__dirname, 'articles/lace-refusal-framework.html'),
        'article-korean-pressure': resolve(__dirname, 'articles/korean-cultural-pressure.html'),
        'article-refusal-selfish': resolve(__dirname, 'articles/refusal-is-not-selfish.html'),
        'article-kindness-burnout': resolve(__dirname, 'articles/not-kindness-burnout.html'),
      },
      output: {
        manualChunks(id) {
          if (id.includes('node_modules')) {
            if (id.includes('@supabase')) return 'vendor-supabase';
            if (id.includes('lucide-react')) return 'vendor-icons';
            if (id.includes('react-dom')) return 'vendor-react';
            if (id.includes('react')) return 'vendor-react';
            if (id.includes('html-to-image')) return 'vendor-html-to-image';
          }
        },
      },
    },
  },
})
