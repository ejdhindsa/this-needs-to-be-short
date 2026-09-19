import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";
import { unwreck } from "@unwreck/core/vite";

export default defineConfig({
  plugins: [vue(), unwreck()],
  optimizeDeps: {
    exclude: ["@unwreck/core"],
  },
  server: {
    proxy: {
      "/api": {
        target: "http://localhost:3000",
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, ""),
      },
    },
    fs: {
      allow: ["../.."],
    },
  },
});
