import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      strategies: "injectManifest",
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
