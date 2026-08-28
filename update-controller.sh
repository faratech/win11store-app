#!/bin/bash
#
# Point the XenForo controller at the freshly-built React entry assets.
# Ported from /web/windowsbuilds_app/update-controller.sh — same guarantees:
#
#   - entry chunk resolved from Vite's manifest (dist/.vite/manifest.json),
#     never `ls -t`
#   - rewrite staged in a temp file, asserted, syntax-checked with `php -l`
#   - moved into place preserving owner and mode (an lsphp-served file that
#     flips to a restrictive owner 500s the page)
#   - any failure restores the previous controller from BACKUP_DIR
#
# Stale hashed assets are NOT purged here: opcache may still serve the previous
# controller, which references them. Purge later, deliberately:
#
#     ./update-controller.sh --prune
#
set -euo pipefail

APP_DIR="${APP_DIR:-/web/win11store_app}"
CONTROLLER_PATH="${CONTROLLER_PATH:-/web/public_html/src/addons/Win11Store/Pub/Controller/Store.php}"
ASSETS_DIR="${ASSETS_DIR:-/web/public_html/js/Win11Store}"
MANIFEST="${MANIFEST:-$APP_DIR/dist/.vite/manifest.json}"
# Never /tmp: it is tmpfs (RAM) on this node.
BACKUP_DIR="${BACKUP_DIR:-/var/backups/win11store}"

PRUNE_ONLY=0
[ "${1:-}" = "--prune" ] && PRUNE_ONLY=1

if [ ! -f "$MANIFEST" ]; then
    echo "❌ Vite manifest not found: $MANIFEST"
    echo "   Build with manifest enabled first (npm run build)."
    exit 1
fi

# Emit: <js basename>\n<css basename>\n<space-separated full keep set>
read_manifest() {
    python3 - "$MANIFEST" <<'PY'
import json, os, sys
m = json.load(open(sys.argv[1]))
entry = next((v for v in m.values() if v.get('isEntry')), None)
if not entry:
    sys.exit("no entry chunk in manifest")
css = (entry.get('css') or [None])[0]
keep = [entry['file']]
if css:
    keep.append(css)
for k in entry.get('imports', []):
    f = m.get(k, {}).get('file')
    if f:
        keep.append(f)
print(os.path.basename(entry['file']))
print(os.path.basename(css) if css else '')
print(' '.join(os.path.basename(f) for f in keep))
PY
}

mapfile -t MF < <(read_manifest)
JS_FILE="${MF[0]}"
CSS_FILE="${MF[1]}"
KEEP="${MF[2]}"

if [ -z "$JS_FILE" ] || [ -z "$CSS_FILE" ]; then
    echo "❌ Could not resolve entry js/css from manifest"
    exit 1
fi

# ---------------------------------------------------------------- prune mode
if [ "$PRUNE_ONLY" -eq 1 ]; then
    keepset=" $KEEP "
    purged=0
    shopt -s nullglob
    for f in "$ASSETS_DIR"/index-*.js "$ASSETS_DIR"/index-*.css \
             "$ASSETS_DIR"/vendor-*.js "$ASSETS_DIR"/rolldown-runtime-*.js; do
        b="$(basename "$f")"
        case "$keepset" in
            *" $b "*) : ;;
            *) rm -f "$f"; purged=$((purged + 1)); echo "   purged $b" ;;
        esac
    done
    shopt -u nullglob
    echo "✅ Pruned $purged stale asset(s); kept: $KEEP"
    exit 0
fi

# ------------------------------------------------------------- activate mode
for asset in $KEEP; do
    if [ ! -f "$ASSETS_DIR/$asset" ]; then
        echo "❌ Entry chunk '$asset' is missing from $ASSETS_DIR. Refusing to activate."
        echo "   Run './build-full.sh' (or copy dist/ over) first."
        exit 1
    fi
done

echo "📄 JS:  $JS_FILE"
echo "📄 CSS: $CSS_FILE"

mkdir -p "$BACKUP_DIR"
BACKUP_PATH="$BACKUP_DIR/Store.php.$(date +%Y%m%dT%H%M%S)"
cp -p "$CONTROLLER_PATH" "$BACKUP_PATH"

# Stage the rewrite; never edit the live file in place.
CANDIDATE="$(mktemp "${BACKUP_DIR}/Store.php.candidate.XXXXXX")"
trap 'rm -f "$CANDIDATE"' EXIT

sed -e "s|'css' => '/js/Win11Store/index-[^']*'|'css' => '/js/Win11Store/$CSS_FILE'|" \
    -e "s|'js' => '/js/Win11Store/index-[^']*'|'js' => '/js/Win11Store/$JS_FILE'|" \
    "$CONTROLLER_PATH" > "$CANDIDATE"

# The sed above is silent when its pattern does not match. Assert the result.
if ! grep -qF "'/js/Win11Store/$JS_FILE'" "$CANDIDATE" \
   || ! grep -qF "'/js/Win11Store/$CSS_FILE'" "$CANDIDATE"; then
    echo "❌ Controller rewrite did not take — asset path pattern not found."
    echo "   Left $CONTROLLER_PATH untouched. Backup: $BACKUP_PATH"
    exit 1
fi

if ! php -l "$CANDIDATE" >/dev/null 2>&1; then
    echo "❌ Rewritten controller is not valid PHP. Left $CONTROLLER_PATH untouched."
    php -l "$CANDIDATE" || true
    exit 1
fi

OWNER="$(stat -c '%U:%G' "$CONTROLLER_PATH")"
MODE="$(stat -c '%a' "$CONTROLLER_PATH")"

if ! (chown "$OWNER" "$CANDIDATE" && chmod "$MODE" "$CANDIDATE" && mv -f "$CANDIDATE" "$CONTROLLER_PATH"); then
    echo "❌ Activation failed; restoring previous controller."
    cp -p "$BACKUP_PATH" "$CONTROLLER_PATH"
    exit 1
fi
trap - EXIT

echo "✅ Controller activated (backup: $BACKUP_PATH)."
echo ""
echo "💡 Stale assets were intentionally kept so opcache can finish serving the"
echo "   previous controller. Once /store/ is confirmed healthy:"
echo "     ./update-controller.sh --prune"
