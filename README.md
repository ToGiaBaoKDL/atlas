# Tô Gia Bảo — Portfolio

A bilingual, static-first engineering portfolio and knowledge site built with Astro. English is the default locale; Vietnamese lives under `/vi`.

## Requirements

- Node.js 22.12 or newer
- Corepack
- pnpm 11.21.0 (pinned through `packageManager`)

## Local development

```bash
corepack prepare pnpm@11.21.0 --activate
pnpm install
pnpm dev
```

Run the complete local quality gate:

```bash
pnpm check
```

## Production build

Set the final production origin before building. This enables canonical URLs, alternate-language URLs and sitemap generation.

```bash
SITE_URL=https://your-domain.tld pnpm build
```

The static output is written to `dist/`.

## Content

Localized project entries live in `src/content/projects/` and are validated by `src/content.config.ts`.

```text
mini-lakehouse.en.md
mini-lakehouse.vi.md
```

Each language variant shares a `translationKey` and has a unique content ID generated from `lang/slug`. Core UI strings live in `src/data/site.ts`; canonical topic labels live in `src/data/topics.ts`.

## Deployment

Cloudflare Pages settings:

```text
Build command       pnpm build
Output directory    dist
Environment         SITE_URL=https://your-domain.tld
Node.js             24
```

The site uses no server adapter and no framework runtime. Cloudflare reads additional static security headers from `public/_headers`.
