import { defineConfig } from "astro/config";
import react from "@astrojs/react";

// Base do site no GitHub Pages. No Git Bash, rode com MSYS_NO_PATHCONV=1 se passar BASE.
const base = process.env.BASE || "/ls-campo/";

export default defineConfig({
  site: "https://italoleandrojs.github.io",
  base,
  trailingSlash: "always",
  integrations: [react()],
  build: { assets: "assets" },
});
