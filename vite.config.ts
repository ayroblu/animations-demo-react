import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      manifest: {
        name: "Animations Demo React",
        short_name: "Animations Demo React",
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
      srcDir: "src/service-worker",
      filename: "sw.ts",
      scope: "./",
      // injectRegister: "inline",
      devOptions: {
        enabled: true,
        type: "module",
      },
    }),
  ],
  base: process.env.BASE_PATH ?? "/",
});
