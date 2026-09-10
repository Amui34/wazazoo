import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: "autoUpdate",
      // Désactivé en dev (le service worker ne s'enregistre pas dans certains
      // environnements d'aperçu et pollue la console) ; actif au build de prod.
      devOptions: { enabled: false },
      includeAssets: ["favicon.svg", "apple-touch-icon.png", "line-art.svg"],
      manifest: {
        name: "WAZAZOO — Le live près de chez toi",
        short_name: "WAZAZOO",
        description:
          "Concerts, DJ sets, soirées et festivals autour de toi, en temps réel. Trouve quoi faire ce soir et suis tes lieux et artistes préférés.",
        lang: "fr",
        start_url: "/",
        display: "standalone",
        background_color: "#0a0a0a",
        theme_color: "#0a0a0a",
        icons: [
          { src: "/pwa-192.png", sizes: "192x192", type: "image/png" },
          { src: "/pwa-512.png", sizes: "512x512", type: "image/png" },
          {
            src: "/pwa-maskable-512.png",
            sizes: "512x512",
            type: "image/png",
            purpose: "maskable",
          },
        ],
      },
      workbox: {
        globPatterns: ["**/*.{js,css,html,svg,png,ico}"],
        navigateFallbackDenylist: [/^\/api\//, /^\/uploads\//],
        maximumFileSizeToCacheInBytes: 4 * 1024 * 1024,
      },
    }),
  ],
  server: {
    port: 5173,
    host: true,
    allowedHosts: ["host.docker.internal", "localhost"],
    proxy: {
      "/api": {
        target: process.env.API_PROXY_TARGET ?? "http://localhost:4000",
        changeOrigin: true,
      },
      "/uploads": {
        target: process.env.API_PROXY_TARGET ?? "http://localhost:4000",
        changeOrigin: true,
      },
    },
  },
});
