#!/bin/bash
#
# Content-only deploy: push catalog.json (and any new images) live without a
# rebuild. This is the day-to-day path for adding/editing products.
#
#   1. edit public/catalog.json (schema: src/types/catalog.ts)
#   2. drop any new images into public/images/
#   3. ./update-catalog.sh
#
set -euo pipefail

APP_DIR="$(cd "$(dirname "$0")" && pwd)"
ASSETS_DIR="/web/public_html/js/Win11Store"

cd "$APP_DIR"

echo "🔎 Validating catalog…"
node scripts/validate-catalog.mjs

echo "📦 Copying catalog + images…"
# Atomic per-file (write temp, rename): a plain `cp` over a live-served file
# lets a concurrent request read a truncated body, which browsers and the CF
# edge then cache — happened on launch day 2026-08-28.
TMP_CATALOG="$ASSETS_DIR/.catalog.json.tmp"
cp public/catalog.json "$TMP_CATALOG"
chown nobody:nobody "$TMP_CATALOG" && chmod 644 "$TMP_CATALOG"
mv -f "$TMP_CATALOG" "$ASSETS_DIR/catalog.json"
mkdir -p "$ASSETS_DIR/images"
rsync -rt --delay-updates --chown=nobody:nobody --chmod=F644 public/images/ "$ASSETS_DIR/images/"

echo "🗺  Regenerating store sitemap…"
node scripts/generate-sitemap.mjs
chown nobody:nobody /web/public_html/store-sitemap.xml

echo "🧹 Purging store caches…"
./purge-store-cache.sh || true

echo ""
echo "✅ Catalog live. Spot-check https://windowsforum.com/store/"
