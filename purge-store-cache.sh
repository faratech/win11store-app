#!/bin/bash
#
# Purge every cache layer that can hold a stale /store/ page:
#
#   1. XenForo's Redis guest page cache (DB 1, key xf:page_{sha1(uri)}_{len}_*)
#      — pagecache.php replays it into httpjet, so purging httpjet alone lets
#      the stale copy bounce straight back for up to ~600s.
#   2. httpjet's LSCache page cache + capsule snapshots — both tagged ST for
#      store pages (CacheOptimizer's `store` case; capsule snapshots inherit
#      the tag via X-WF-Capsule-Tags), one tag purge evicts both.
#
# URLs are derived from the deployed catalog so new categories are covered
# automatically. Cloudflare's edge (s-maxage 1800) ages out on its own.
#
set -euo pipefail

CATALOG="${CATALOG:-/web/public_html/js/Win11Store/catalog.json}"

urls=("https://windowsforum.com/store/")
while IFS= read -r slug; do
    urls+=("https://windowsforum.com/store/${slug}/")
done < <(python3 -c 'import json,sys; [print(c["slug"]) for c in json.load(open(sys.argv[1]))["categories"]]' "$CATALOG")

for uri in "${urls[@]}"; do
    hash="$(printf '%s' "$uri" | sha1sum | cut -d' ' -f1)"
    prefix="xf:page_${hash}_${#uri}_"
    redis-cli -n 1 --scan --pattern "${prefix}*" | while IFS= read -r key; do
        redis-cli -n 1 DEL "$key" > /dev/null
        echo "   redis: $key"
    done
done

curl -s 'http://127.0.0.1/lscache_purge.php?tag=ST' -H 'Host: windowsforum.com'
echo ""
echo "✅ Store caches purged (${#urls[@]} URLs + tag=ST)"
