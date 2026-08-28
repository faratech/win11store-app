#!/bin/bash
#
# Full build + deploy for the WindowsForum Store SPA.
#
#   validate catalog → build → copy dist/ (assets + catalog + images) →
#   activate controller (update-controller.sh) → purge the store's edge cache
#
# Target: windowsforum.com/store/ only. (The former public_html2 /
# windowslatest.com leg was removed 2026-08-27 — that tree has no XenForo and
# the site is no longer hosted here.)
#
# For a content-only change (catalog.json / images, no code), use
# ./update-catalog.sh instead — no build required.
#
# If _data/*.xml changed this release (template/route edits), rebuild XF master
# data afterwards:
#     cd /web/public_html && echo y | php cmd.php xf:addon-rebuild Win11Store --force
#     php /web/regen_addon_hashes.php Win11Store
#
set -euo pipefail

APP_DIR="$(cd "$(dirname "$0")" && pwd)"
ASSETS_DIR="/web/public_html/js/Win11Store"

cd "$APP_DIR"

echo "🔎 Validating catalog…"
node scripts/validate-catalog.mjs

echo "🔨 Building React app…"
npm run build

echo "📦 Deploying to $ASSETS_DIR…"
mkdir -p "$ASSETS_DIR"
cp -r dist/* "$ASSETS_DIR"/
# dist/ files are written by root; the served tree is nobody:nobody.
chown -R nobody:nobody "$ASSETS_DIR"
chmod -R u+rwX,go+rX "$ASSETS_DIR"

echo "🎯 Activating controller…"
./update-controller.sh

echo "🗺  Regenerating store sitemap…"
node scripts/generate-sitemap.mjs
chown nobody:nobody /web/public_html/store-sitemap.xml

echo "🧹 Purging store caches…"
./purge-store-cache.sh || true

echo ""
echo "✅ Deployed. Verify https://windowsforum.com/store/ (and /store/xbox/),"
echo "   then prune stale assets:  ./update-controller.sh --prune"
