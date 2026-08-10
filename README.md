# Tô Gia Bảo — Portfolio

A static-first engineering portfolio and knowledge site built with Astro.

## Requirements

- Node.js 22.12 or newer
- Corepack
- pnpm 11.21.0 (pinned through `packageManager`)

## Local development

```bash
corepack enable pnpm
corepack install
pnpm install
pnpm dev
```

`packageManager` in `package.json` pins the pnpm version Corepack installs for this project.

Run the complete local quality gate:

```bash
pnpm check
```

## Production build

Set the final production origin before building. This enables canonical URLs and sitemap generation.

```bash
SITE_URL=https://your-domain.tld pnpm build
```

The static output is written to `dist/`.

## Content

Project entries live in `src/content/projects/` and are validated by `src/content.config.ts`.

```text
mini-lakehouse.md
vn-market-pulse.md
```

Core UI strings live in `src/data/site.ts`; canonical topic labels live in `src/data/topics.ts`.

## Deployment

Cloudflare Pages settings:

```text
Build command       pnpm build
Output directory    dist
Environment         SITE_URL=https://your-domain.tld
Node.js             24
```

The site uses no server adapter and no framework runtime. Cloudflare reads additional static security headers from `public/_headers`.
