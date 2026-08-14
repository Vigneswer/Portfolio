import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

export default defineConfig({
  plugins: [react(), tailwindcss()],
  build: {
    // Heavy, below-the-fold work (the physics engine, scroll rig) is code-split
    // at the import site with React.lazy rather than being force-chunked here,
    // so the hero's critical path stays as small as possible.
    target: "es2022",
  },
});
