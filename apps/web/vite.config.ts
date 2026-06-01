import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";
import path from "path";

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: "autoUpdate",
      includeAssets: ["favicon.ico", "apple-touch-icon.png", "logo.png"],
      manifest: {
        name: "Le Corridor Club — Maquis Manager",
        short_name: "Corridor Club",
        description: "Gestion maquis ivoirien — commandes, caisse, stock",
        theme_color: "#C65A21",
        background_color: "#F3EAD6",
        display: "standalone",
        lang: "fr",
        icons: [
          { src: "/logo.png", sizes: "192x192", type: "image/png" },
          { src: "/logo.png", sizes: "512x512", type: "image/png", purpose: "any maskable" },
        ],
      },
      workbox: {
        globPatterns: ["**/*.{js,css,html,ico,png,svg}"],
      },
    }),
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
      "@maquis/shared": path.resolve(__dirname, "../../packages/shared/src/index.ts"),
      "@maquis/ui-tokens": path.resolve(__dirname, "../../packages/ui-tokens/src/tokens.css"),
    },
  },
  server: {
    port: 5173,
    proxy: {
      "/api": {
        target: "http://localhost:4000",
        changeOrigin: true,
      },
    },
  },
});
