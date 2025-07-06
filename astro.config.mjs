// @ts-check
import { defineConfig } from "astro/config";

import sitemap from "@astrojs/sitemap";
import robotsTxt from "astro-robots-txt";

import tailwindcss from "@tailwindcss/vite";

// https://astro.build/config
export default defineConfig({
  site: "https://yuanyuanyuan.github.io",
  base: "/Long_screenshot_splitting_tool/",

  integrations: [
    sitemap(),
    robotsTxt({
      policy: [{ userAgent: "*", allow: "/" }],
    }),
  ],

  vite: {
    plugins: [tailwindcss()],
  },
});