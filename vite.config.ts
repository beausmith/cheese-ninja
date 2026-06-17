import { defineConfig } from "vite";
import { VitePWA } from "vite-plugin-pwa";

// Vite + PWA config. vite-plugin-pwa generates the manifest and a service
// worker that precaches every built asset so the game works offline and is
// installable to the home screen.
//
// `base` matters for GitHub Pages: the project site is served from
// https://beausmith.github.io/cheese-ninja/, so production builds live under
// "/cheese-ninja/". Dev stays at "/". The plugin derives the manifest's
// scope/start_url from this base, and the icon paths below are relative so they
// resolve correctly under either base.
export default defineConfig(({ command }) => ({
  base: command === "build" ? "/cheese-ninja/" : "/",
  plugins: [
    VitePWA({
      registerType: "autoUpdate",
      // Precache the SVG sprites and audio that live in /public/assets.
      includeAssets: ["assets/**/*"],
      workbox: {
        // Cache everything we ship, including the SVG + audio assets.
        globPatterns: ["**/*.{js,css,html,svg,png,ico,mp3,wav,ogg,webmanifest}"],
        // Audio clips can push past the default 2 MiB cap.
        maximumFileSizeToCacheInBytes: 8 * 1024 * 1024,
      },
      manifest: {
        name: "Cheese Ninja",
        short_name: "Cheese Ninja",
        description: "Slice flying cheese, dodge the wine. Each slice farts.",
        theme_color: "#2a1a07",
        background_color: "#2a1a07",
        display: "standalone",
        orientation: "portrait",
        // start_url / scope are left to the plugin so they inherit `base`.
        icons: [
          {
            src: "assets/icons/icon-192.png",
            sizes: "192x192",
            type: "image/png",
          },
          {
            src: "assets/icons/icon-512.png",
            sizes: "512x512",
            type: "image/png",
          },
          {
            src: "assets/icons/icon-maskable-512.png",
            sizes: "512x512",
            type: "image/png",
            purpose: "maskable",
          },
        ],
      },
    }),
  ],
}));
