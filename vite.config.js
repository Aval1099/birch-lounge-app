import react from '@vitejs/plugin-react'
import { visualizer } from 'rollup-plugin-visualizer'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    visualizer({
      filename: 'dist/stats.html',
      open: false,
      gzipSize: true,
      brotliSize: true
    })
  ],
  define: {
    global: 'globalThis',
  },
  resolve: {
    alias: {
      // Node.js polyfills for browser compatibility
      'node:stream': 'stream-browserify',
      'node:process': 'process/browser',
      'node:buffer': 'buffer',
      'node:util': 'util',
      'node:path': 'path-browserify',
      'node:fs': 'browserify-fs',
      'node:crypto': 'crypto-browserify',
    }
  },
  build: {
    sourcemap: true,
    chunkSizeWarningLimit: 350, // Reduced warning threshold
    rollupOptions: {
      output: {
        manualChunks: (id) => {
          // Core React libraries
          if (id.includes('node_modules/react') || id.includes('node_modules/react-dom')) {
            return 'vendor-react';
          }

          // Large UI libraries
          if (id.includes('lucide-react') || id.includes('@headlessui') ||
            id.includes('framer-motion') || id.includes('react-spring')) {
            return 'vendor-ui';
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
            id.includes('aiService') || id.includes('mlService') || id.includes('openai')) {
            return 'feature-ai';
          }

          // Modern UI components (our custom components)
          if (id.includes('ModernButton') || id.includes('ModernCard') ||
            id.includes('ModernInput') || id.includes('ModernRecipe') ||
            id.includes('ModernMobile') || id.includes('ModernHeader') ||
            id.includes('ModernUIDemo')) {
            return 'feature-modern-ui';
          }

          // Vibrant UI components (new design system)
          if (id.includes('VibrantButton') || id.includes('VibrantCard') ||
            id.includes('VibrantInput') || id.includes('VibrantNavigation') ||
            id.includes('VibrantHeader') || id.includes('VibrantRecipe')) {
            return 'feature-vibrant-ui';
          }

          // Heavy feature components - separate chunks
          if (id.includes('MenuBuilder') || id.includes('BatchScaling')) {
            return 'feature-menu-batch';
          }

          if (id.includes('TechniquesManager') || id.includes('ServiceMode')) {
            return 'feature-techniques-service';
          }

          if (id.includes('IngredientsManager') || id.includes('OfflineManager')) {
            return 'feature-ingredients-offline';
          }

          // Core recipe components (keep in main bundle)
          if (id.includes('RecipeGrid') || id.includes('RecipeFilters') ||
            id.includes('RecipeModal') || id.includes('RecipeCard')) {
            return 'core-recipes';
          }

          // Virtualization libraries
          if (id.includes('react-window') || id.includes('react-virtualized')) {
            return 'feature-virtualization';
          }

          // Performance monitoring
          if (id.includes('performanceService') || id.includes('cachePerformanceMonitor') ||
            id.includes('web-vitals')) {
            return 'feature-performance';
          }

          // Search and filtering
          if (id.includes('searchService') || id.includes('filterService') ||
            id.includes('fuse.js')) {
            return 'feature-search';
          }

          // Cache management
          if (id.includes('cacheService') || id.includes('offlineManager') ||
            id.includes('idb')) {
            return 'feature-cache';
          }

          // UI utilities and base components
          if (id.includes('src/components/ui') && !id.includes('Modern')) {
            return 'ui-base';
          }

          // Service utilities
          if (id.includes('src/services')) {
            return 'app-services';
          }

          // Remaining application components (should be much smaller now)
          if (id.includes('src/components')) {
            return 'app-components';
          }

          // Utilities and hooks
          if (id.includes('src/hooks') || id.includes('src/utils')) {
            return 'app-utils';
          }
        }
      }
    },
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
    host: true,
    open: false
  },
  preview: {
    port: 3000,
    host: true
  }
})
