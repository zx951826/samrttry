import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig(({ mode }) => {
  // Load env file based on `mode` in the current working directory.
  // Set the third parameter to '' to load all env regardless of the `VITE_` prefix.
  const env = loadEnv(mode, process.cwd(), '');

  return {
    base: './', // Use relative paths for assets
    plugins: [
      react(),
      VitePWA({
        registerType: 'autoUpdate',
        includeAssets: ['favicon.ico', 'apple-touch-icon.png', 'masked-icon.svg'],
        manifest: {
          name: 'SmartLook AI',
          short_name: 'SmartLook',
          description: 'AI 智能衣櫥與虛擬試穿',
          theme_color: '#ffffff',
          background_color: '#F8FAFC',
          display: 'standalone',
          orientation: 'portrait',
          scope: './',
          start_url: './index.html',
          icons: [
            {
              src: 'pwa-192x192.png',
              sizes: '192x192',
              type: 'image/png',
              purpose: 'any maskable'
            },
            {
              src: 'pwa-512x512.png',
              sizes: '512x512',
              type: 'image/png',
              purpose: 'any maskable'
            }
          ]
        }
      })
    ],
    define: {
      // This allows process.env.API_KEY to be replaced by the actual value during build
      'process.env.API_KEY': JSON.stringify(env.API_KEY),
      // Prevents "process is not defined" error in browser
      'process.env': {}
    }
  };
});