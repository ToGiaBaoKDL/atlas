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

Run the static quality gate:

```bash
pnpm check
```

The quality scripts build against the reserved `https://portfolio.example` origin so canonical,
sitemap, RSS-discovery and social metadata are exercised without pretending a production domain
has been chosen.

Run the release gate, including desktop/mobile browser, accessibility and visual regression tests:

```bash
pnpm exec playwright install chromium
pnpm check:release
```

The test config uses an installed system Chrome when available. Set
`PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH` to override the browser executable.

## Production build

Set the final production origin before building. This enables canonical URLs, sitemap generation,
RSS discovery and absolute social metadata.

```bash
SITE_URL=https://your-domain.tld pnpm build
```

The static output is written to `dist/`.

## Content

Project and writing entries live in `src/content/` and are validated by
`src/content.config.ts`.

```text
mini-lakehouse.md
vn-market-pulse.md
```

Use `src/content/writing/_template.md` as the authoring baseline. Draft entries remain available to
the content pipeline but do not generate pages, topic routes, homepage rows or RSS items.

```yaml
title:
description:
publishedAt: 2026-08-11
updatedAt: 2026-08-11 # optional
draft: true
topics: []
maturity: seed # seed | growing | evergreen
```

Core UI strings live in `src/data/site.ts`; canonical topic and maturity labels live in
`src/data/topics.ts`. Search remains intentionally disabled until the writing corpus is large enough
to make it useful.

The default social card is stored as both an editable SVG source and a 1200 × 630 PNG fallback in
`public/`.

## Deployment

Cloudflare Pages settings:

```text
Build command       pnpm build
Output directory    dist
Environment         SITE_URL=https://your-domain.tld
Node.js             24
```

The site uses no server adapter and no framework runtime. Cloudflare reads additional static security headers from `public/_headers`.

After deployment, smoke-check `/`, `/projects/mini-lakehouse/`, `/writing/`, `/rss.xml` and the PDF
resume on the production origin. Privacy-conscious analytics remain optional and are not loaded by
default.
