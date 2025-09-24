import react from '@vitejs/plugin-react'
import { visualizer } from 'rollup-plugin-visualizer'
import { defineConfig } from 'vite'
import { VitePWA } from 'vite-plugin-pwa'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    visualizer({
      filename: 'dist/stats.html',
      open: false,
      gzipSize: true,
      brotliSize: true
    }),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.ico', 'apple-touch-icon.png', 'masked-icon.svg'],
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'google-fonts-cache',
              expiration: {
                maxEntries: 10,
                maxAgeSeconds: 60 * 60 * 24 * 365 // 1 year
              }
            }
          },
          {
            urlPattern: /^https:\/\/fonts\.gstatic\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'gstatic-fonts-cache',
              expiration: {
                maxEntries: 10,
                maxAgeSeconds: 60 * 60 * 24 * 365 // 1 year
              }
            }
          },
          {
            urlPattern: /\.(?:png|jpg|jpeg|svg|gif|webp)$/,
            handler: 'CacheFirst',
            options: {
              cacheName: 'images-cache',
              expiration: {
                maxEntries: 100,
                maxAgeSeconds: 60 * 60 * 24 * 30 // 30 days
              }
            }
          },
          {
            urlPattern: /\/api\/.*$/,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'api-cache',
              expiration: {
                maxEntries: 50,
                maxAgeSeconds: 60 * 60 * 24 // 24 hours
              },
              networkTimeoutSeconds: 3
            }
          }
        ],
        skipWaiting: true,
        clientsClaim: true
      },
      manifest: {
        name: 'Birch Lounge - Cocktail Recipe Manager',
        short_name: 'Birch Lounge',
        description: 'Professional cocktail recipe management with offline capabilities',
        theme_color: '#d97706',
        background_color: '#f9fafb',
        display: 'standalone',
        orientation: 'portrait-primary',
        scope: '/',
        start_url: '/',
        categories: ['food', 'lifestyle', 'productivity'],
        icons: [
          {
            src: 'pwa-64x64.png',
            sizes: '64x64',
            type: 'image/png'
          },
          {
            src: 'pwa-192x192.png',
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: 'pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any'
          },
          {
            src: 'pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable'
          }
        ],
        shortcuts: [
          {
            name: 'New Recipe',
            short_name: 'New Recipe',
            description: 'Create a new cocktail recipe',
            url: '/?action=new-recipe',
            icons: [{ src: 'pwa-192x192.png', sizes: '192x192' }]
          },
          {
            name: 'Search Recipes',
            short_name: 'Search',
            description: 'Search your recipe collection',
            url: '/?action=search',
            icons: [{ src: 'pwa-192x192.png', sizes: '192x192' }]
          }
        ]
      }
    })
  ],
  build: {
    sourcemap: true,
    rollupOptions: {
      output: {
        manualChunks: (id) => {
          // Core React libraries
          if (id.includes('node_modules/react') || id.includes('node_modules/react-dom')) {
            return 'vendor-react';
          }

          // Supabase and database utilities
          if (id.includes('@supabase') || id.includes('postgrest')) {
            return 'vendor-supabase';
          }

          // PDF processing (heavy library)
          if (id.includes('pdfjs-dist') || id.includes('pdf')) {
            return 'feature-pdf';
          }

          // AI and ML services
          if (id.includes('geminiService') || id.includes('enhancedRecipeParser') ||
            id.includes('aiService') || id.includes('mlService')) {
            return 'feature-ai';
          }

          // Virtualization libraries
          if (id.includes('react-window') || id.includes('react-virtualized')) {
            return 'feature-virtualization';
          }

          // UI component libraries
          if (id.includes('lucide-react') || id.includes('ui-components')) {
            return 'vendor-ui';
          }

          // Performance monitoring
          if (id.includes('web-vitals') || id.includes('performance')) {
            return 'feature-performance';
          }

          // Advanced search and filtering
          if (id.includes('advancedSearchEngine') || id.includes('advancedFilterEngine') ||
            id.includes('searchService') || id.includes('filterService')) {
            return 'feature-search';
          }

          // Service workers and caching
          if (id.includes('cacheService') || id.includes('offlineService') ||
            id.includes('syncService') || id.includes('intelligentCache')) {
            return 'feature-cache';
          }

          // Other vendor libraries
          if (id.includes('node_modules')) {
            return 'vendor-misc';
          }

          // Application services
          if (id.includes('src/services')) {
            return 'app-services';
          }

          // Application components
          if (id.includes('src/components')) {
            return 'app-components';
          }
        }
      }
    },
    chunkSizeWarningLimit: 500, // More aggressive warning threshold
    target: 'esnext', // Modern browsers for better optimization
    minify: 'terser', // Better minification
    terserOptions: {
      compress: {
        drop_console: true, // Remove console.log in production
        drop_debugger: true,
        pure_funcs: ['console.log', 'console.info', 'console.debug']
      }
    }
  },
  server: {
    port: 3000,
    open: true
  },
  preview: {
    port: 4173,
    open: true
  }
})
