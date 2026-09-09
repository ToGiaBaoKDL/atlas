#!/bin/sh
# Runs a pnpm script inside the pinned Playwright image, which also serves as
# the baseline source for visual regression tests. Ownership of the mounted
# workspace is always restored to the host user, even when the command fails.
set -eu

docker run --rm --user root --workdir /work --volume "$PWD":/work \
  -e CI=true \
  -e COREPACK_ENABLE_DOWNLOAD_PROMPT=0 \
  -e npm_config_store_dir=/root/.pnpm-store \
  mcr.microsoft.com/playwright:v1.62.1-noble \
  sh -c "corepack enable && corepack install && pnpm install --frozen-lockfile && SITE_URL=https://portfolio.example pnpm $*; status=\$?; chown -R \$(stat -c '%u:%g' /work) /work/node_modules /work/test-results 2>/dev/null || true; exit \$status"
