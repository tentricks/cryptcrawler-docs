import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "node:path";

export default defineConfig(
{
  plugins: [react()],
  base: "/", // custom domain -> "/"
  build:
  {
    outDir: "../docs",
    emptyOutDir: false,
    cssCodeSplit: false,
    rollupOptions:
    {
      output:
      {
        manualChunks: undefined,
        entryFileNames: "assets/index.js",
        assetFileNames: (assetInfo) =>
        {
          const ext = path.extname(assetInfo.name ?? "");
          if (ext === ".css")
            return "assets/index.css";
          return "assets/[name][extname]";
        }
      }
    }
  }
});
