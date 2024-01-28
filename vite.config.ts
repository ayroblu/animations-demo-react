import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";
import { splitVendorChunkPlugin } from "vite";

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    splitVendorChunkPlugin(),
    VitePWA({
      manifest: {
        name: "Animations Demo React",
        short_name: "Animations Demo",
        theme_color: "#323232",
        background_color: "#323232",
        icons: [
          {
            src: "favicons/android-chrome-512x512.png",
            sizes: "512x512",
            type: "image/png",
          },
        ],
      },
      strategies: "injectManifest",
      injectManifest: {
        globPatterns: ["**/*.{js,css,html,jpg,svg}"],
      },
      srcDir: "src/service-worker",
      filename: "sw.ts",
      injectRegister: "inline",
      devOptions: {
        enabled: true,
        type: "module",
      },
    }),
  ],
  base: process.env.BASE_PATH ?? "/",
});
