# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**WindowsForum Store** — a curated Amazon-affiliate storefront (React 19 + TypeScript + Vite 8 + Tailwind 4) served at **windowsforum.com/store/** through the `Win11Store` XenForo add-on. Categories: Surface, Xbox, PC Upgrades, Accessories, Software. Affiliate tag: `windowsfor081-20` (links are derived from ASINs at render time in `src/lib/affiliate.ts` — URLs are never stored in data).

**Rebuilt 2026-08-27** from a hardcoded 3-product page into a catalog-driven multi-category store. The former second deploy target (`/web/public_html2`, windowslatest.com) was removed — that tree has no XenForo and the site is not hosted here.

## The catalog is the single source of truth

`public/catalog.json` (schema: `src/types/catalog.ts`) drives everything:

- **The SPA** hydrates from it (inlined into the page by the controller as `<script id="store-catalog">`; dev falls back to fetching `/catalog.json`).
- **The XF controller** reads the deployed copy (`/web/public_html/js/Win11Store/catalog.json`) server-side and derives from it: the valid-section whitelist, per-category `<title>`/meta/canonical, the ItemList JSON-LD, and the no-JS SSR fallback list. **Adding a category or product never touches PHP.**

### Amazon ToS posture (why the schema has no price field)

No PA-API is used, so the store must not display prices, discounts, star ratings, review counts, or Amazon merchandising claims ("Amazon's Choice"), and must not hotlink Amazon images. `scripts/validate-catalog.mjs` enforces this — it rejects `$N`, "% off", review-count/star patterns, remote image URLs, and more. CTAs say "See price on Amazon". Keep it that way; the pre-2026-08 page violated most of these.

**Never invent an ASIN.** Verify every new ASIN against its live `amazon.com/dp/{ASIN}` page before adding it.

## Common commands

- `npm run dev` — dev server on port 3001 (theme toggle: `document.documentElement.setAttribute('data-variation','alternate')`; `index.html` is a dev-only harness — prod markup comes from the XF template)
- `npm run build` — tsc + Vite build (writes `dist/` + `dist/.vite/manifest.json`). **tsc is the only working static gate: `npm run lint` is broken** (ESLint 10 flat-config vs the legacy `.eslintrc.cjs`, plus the typescript-eslint↔TS7 cap documented in windowsbuilds_app/CLAUDE.md — that app moved to oxlint; do the same here rather than pinning ESLint back)
- `npm run validate-catalog` — catalog gate (schema + ToS tripwires + image existence)
- `./update-catalog.sh` — **day-to-day path**: content-only deploy (validate → copy catalog+images → purge). No build.
- `./build-full.sh` — full deploy: validate → build → copy `dist/` → activate controller → purge
- `./update-controller.sh` — activate controller against the current Vite manifest; `--prune` deletes stale hashed assets (run only after verifying the new deploy)

## Deploy architecture

1. Vite writes hashed `index-[hash].js/css` (+ manifest). `public/` (catalog.json, images/) rides along into `dist/`.
2. `build-full.sh` copies `dist/*` → `/web/public_html/js/Win11Store/` (ownership `nobody:nobody` — root-owned lsphp-served files can 500). **Overwrites of live-served files must be atomic** (tmp+rename / rsync `--delay-updates`, which the scripts already use): a plain `cp` let a request read a truncated image mid-copy on 2026-08-28, and browsers + the CF edge cached the bad bytes — the fix was renaming the files.
3. `update-controller.sh` (port of the hardened windowsbuilds_app version) resolves entry assets from the **manifest** (never `ls -t`), stages the controller rewrite, asserts the sed matched, `php -l`s it, preserves owner/mode, backs up to `/var/backups/win11store/` (never /tmp — tmpfs). Stale assets survive until `--prune` because opcache may still serve the old controller.
4. Purge: `./purge-store-cache.sh` (called by both deploy scripts). **Three layers can hold a stale store page** — learned the hard way on 2026-08-27:
   - XenForo's Redis guest page cache (DB 1, `xf:page_{sha1(fullUri)}_{len}_*`, ~600s): `pagecache.php` replays it into httpjet, so purging httpjet alone lets the stale copy bounce straight back. The script deletes these keys by sha1-URI prefix.
   - httpjet LSCache page entries + **capsule snapshots** (`--xf-capsule`, 3600s stale window): store pages carry `X-LiteSpeed-Tag: public, ST` and `X-WF-Capsule-Tags: public, ST` (the `store` case in SessionValidator's `CacheOptimizer::applyPathBasedHeaders()`), so one `tag=ST` purge evicts both. A capsule snapshot stored *before* the ST case existed needed `tag=xf_capsule` once — never again unless CacheOptimizer's store case is removed.
   - Cloudflare edge (`s-maxage` 1800) ages out on its own; per-URL CF purge can't evict guest HTML here.
   - **CacheOptimizer.php is in the opcache preload set** — after editing it, `systemctl restart httpjet-lsphp` (socket-activated, graceful) or the change never takes effect.

### XenForo add-on (`/web/public_html/src/addons/Win11Store/`)

- `Pub/Controller/Store.php` — section routing (dynamic whitelist from catalog; legacy 301s: `/store/home/`→`/store/`, `/store/pro/`|`/store/m365/`→`/store/software/`; case canonicalization; junk → 301 `/store/`), meta, JSON-LD, inline catalog. The two `'css' =>` / `'js' =>` lines are sed-rewritten by `update-controller.sh` — keep their exact shape.
- `_data/templates.xml` — `win11store_index`: meta from `$meta`, JSON-LD via `{$jsonLd|raw}`, SSR fallback (`.ws-ssr`), inline catalog script. **After editing `_data/`**: bump `version_id` in template + `addon.json`, then
  `cd /web/public_html && echo y | php cmd.php xf:addon-rebuild Win11Store --force && php /web/regen_addon_hashes.php Win11Store`
- JSON-LD is a `@graph` of **CollectionPage (+ItemList) and BreadcrumbList only** — no Product/Offer nodes, no prices (they'd be stale + Search Console warnings). ItemList entries carry absolute `image` URLs when the product has photos. Per-section `og:image` is picked by `Store.php::pickOgImage()` (first featured product with an image → first category product with one → store default), so it upgrades automatically when photos land. The slugs `home`, `pro`, `m365` are reserved by the legacy redirect map (validator enforces).
- **Sitemap**: `scripts/generate-sitemap.mjs` writes `/web/public_html/store-sitemap.xml` from catalog.json (runs inside both deploy scripts; tmp+rename). Advertised in `robots.txt`. Deliberately a top-level file — a real docroot `store/` directory could shadow the XF route.
- **IndexNow** (manual nudge after big catalog changes): the site key lives in the `indexNow` xf_option and the key file is served at `/indexNow-{key}.txt` — submissions MUST pass that as `keyLocation` or Bing's verification silently discards them (a bare-key-path submission returns 200 and still fails).

### Theme & design

- Dark mode mirrors XenForo: `src/contexts/ThemeContext.tsx` (ported from windowsbuilds_app) observes `<html>` attrs + `xf_style_variation` cookie and writes a `.dark` class; Tailwind 4 dark variant is declared in `src/index.css` (`@custom-variant dark`). There is no tailwind.config.js — TW4 CSS-first.
- Design tokens (`--wfs-*` in `src/index.css`) mirror the wf5 canonical layer (`public_html/src/styles/wf5/templates/public/extra.less`): Fluent, Segoe UI Variable, radii 4/6/8, accent `#0f6cbd`/dark `#7cb4f5`. Category rail colors: `--wfs-cat-{slug}` (fallback = accent, so new categories render without code changes).
- Modal/lightbox (`src/components/ui/Modal.tsx`) is the windowsbuilds a11y port (portal, focus trap, Escape, dual `<html>`+`<body>` scroll lock — jsdom would bless a body-only lock that does nothing on the real page).

## Product images

Manufacturer press images or owner-shot photos only, in `public/images/`; never Amazon CDN copies. Each catalog image carries a `source` provenance URL. Optimize new files to ≤1200px webp (`magick <in> -resize '1200x1200>' -strip -quality 82 <id>-1.webp`). Products without images get a category-tinted icon band automatically — shipping without a photo is fine. Caveat: the legacy `win11-*.jpg` / `m365-*.jpg` sets predate this rule and their provenance is unconfirmed — replace, don't imitate.

## Non-app directories

`design/` holds Claude Design canvas working files (`*.dc.html`, `canvas.json`) for the store-redesign mockups — not app code, not part of any build. The published canvas: https://claude.ai/code/artifact/97304b69-c32e-4168-97ae-fa3fe3b0be78
