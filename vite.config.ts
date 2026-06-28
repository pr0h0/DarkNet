import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

import { fileURLToPath } from "node:url";

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "node:zlib": fileURLToPath(new URL("./src/shims/zlib.ts", import.meta.url)),
    },
  },
});
