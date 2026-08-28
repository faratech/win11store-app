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

# Cloudflare per-URL purge (global key from /web/.env). Effective for the
# static assets — image filenames are stable, so a replaced photo leaves stale
# bytes at the edge without this. The page URLs are included best-effort only:
# per-URL purge verifiably does NOT evict this zone's guest HTML (retested
# 2026-08-28 incl. CF-Device-Type variants) — those age out via s-maxage.
python3 - <<'PY' || echo "⚠ Cloudflare purge failed (origin layers are purged regardless)"
import json, os, requests
from dotenv import load_dotenv
load_dotenv("/web/.env")
zone = os.environ["CLOUDFLARE_ZONE_ID"]
catalog = json.load(open(os.environ.get("CATALOG", "/web/public_html/js/Win11Store/catalog.json")))
urls = ["https://windowsforum.com/store/"]
urls += [f"https://windowsforum.com/store/{c['slug']}/" for c in catalog["categories"]]
urls += ["https://windowsforum.com/js/Win11Store/catalog.json",
         "https://windowsforum.com/store-sitemap.xml"]
urls += sorted({f"https://windowsforum.com/js/Win11Store/{img['src']}"
                for p in catalog["products"] for img in p.get("images", [])})
headers = {"X-Auth-Email": os.environ["CLOUDFLARE_EMAIL"],
           "X-Auth-Key": os.environ["CLOUDFLARE_GLOBAL_TOKEN"]}
for i in range(0, len(urls), 30):  # API cap: 30 files per request
    r = requests.post(f"https://api.cloudflare.com/client/v4/zones/{zone}/purge_cache",
                      headers=headers, json={"files": urls[i:i + 30]}, timeout=15)
    r.raise_for_status()
    assert r.json().get("success"), r.text
print(f"   cloudflare: purged {len(urls)} URLs")
PY

echo "✅ Store caches purged (${#urls[@]} URLs + tag=ST + Cloudflare)"
