import { defineConfig } from "vite";

// Relative base so the build drops into a subpath on GitHub Pages
// (e.g. /solved-games/explorer/) without rewriting asset URLs.
export default defineConfig({
  base: "./",
  build: { target: "es2022" },
});
