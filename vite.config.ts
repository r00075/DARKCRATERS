import { defineConfig } from "vite";

export default defineConfig({
  server: {
    allowedHosts: true,
  },
  resolve: {
    alias: {
      "@babylonjs/loaders/glTF": "@babylonjs/loaders/glTF/index.js",
    },
  },
});