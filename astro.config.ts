import sitemap from "@astrojs/sitemap";
import { defineConfig } from "astro/config";

const site = process.env.SITE_URL;

export default defineConfig({
  site,
  output: "static",
  trailingSlash: "always",
  markdown: {
    syntaxHighlight: false,
  },
  integrations: site ? [sitemap()] : [],
  security: {
    csp: {
      directives: [
        "default-src 'self'",
        "base-uri 'self'",
        "form-action 'self'",
        "img-src 'self' data:",
        "font-src 'self'",
        "connect-src 'self'",
      ],
    },
  },
});
