# WindowsForum Store

React + TypeScript storefront UI for curated Windows, Surface, Xbox, and PC-upgrade picks, deployed in production as an embedded section of [windowsforum.com/store/](https://windowsforum.com/store/).

This repository contains the reusable storefront (UI, catalog types, validation, and affiliate-link helpers) and the XenForo add-on source that hosts it. It does not contain the production catalog or production product imagery.

## Affiliate disclosure

Outbound retailer links may contain an affiliate tag. The site operator may earn a commission from qualifying purchases, at no additional cost to the buyer. Product availability and terms are controlled by the retailer.

In code, Amazon links are derived at render time from a product's ASIN by `amazonUrl()` in [src/lib/affiliate.ts](src/lib/affiliate.ts), using the tag exported there as `AFFILIATE_TAG`. The same file defines the short disclosure shown on category pages (`DISCLOSURE_SHORT`) and the footer disclosure rendered by the app (`DISCLOSURE_FOOTER`: "As an Amazon Associate, WindowsForum.com earns from qualifying purchases."). Product cards link out with `rel="sponsored noopener noreferrer"`. To change the tag or wording, edit that one file — do not hard-code retailer URLs into catalog data or components.

## Standalone vs. production — read this first

The app has two modes, and the difference matters for local development:

| | Standalone (this repo, local dev) | Production (windowsforum.com) |
| --- | --- | --- |
| Catalog source | Fetches `public/catalog.json` over HTTP | XenForo controller inlines the catalog into the page as `<script type="application/json" id="store-catalog">` |
| Catalog location on disk | `public/catalog.json` (git-ignored, not in this repo) | `/js/Win11Store/catalog.json` on the host, read by `Store.php` |
| Assets served from | Vite dev server / `dist/` | `/js/Win11Store/` |
| Page shell | [index.html](index.html) dev harness | XenForo `win11store_index` template (see [addon/Win11Store/_data/templates.xml](addon/Win11Store/_data/templates.xml)) |

Why the production catalog is not here: it is maintained outside this repository because it contains site-specific affiliate content. Product imagery is also intentionally excluded unless its redistribution rights are documented. The loader in [src/lib/catalog.ts](src/lib/catalog.ts) (`loadCatalog()`) tries the inline `store-catalog` element first and falls back to fetching `${ASSET_BASE}catalog.json`, so the same build works in both modes. `ASSET_BASE` is `/js/Win11Store/` in production builds and `/` in dev.

For local development you must supply your own `public/catalog.json` (a minimal valid example is given under [Catalog format](#catalog-format) below). Without it, `npm run dev` renders the app's "catalog didn't load" fallback and `npm run validate-catalog` exits non-zero.

## Prerequisites

- **Node.js and npm** — required to install dependencies and run Vite. This repository pins no Node version: [package.json](package.json) has no `engines` field and there is no `.nvmrc` or `.node-version` file, so use a current Node release that can run the dependency versions locked in `package-lock.json`.
- **Git** — to clone the repository.

No other system dependencies are needed for the storefront itself. The XenForo export step additionally needs `rsync` and a XenForo installation on the target host (see [XenForo add-on](#xenforo-add-on)).

## Quick start

```sh
git clone https://github.com/faratech/win11store-app.git
cd win11store-app
npm ci
```

Then create a local catalog (the production catalog is not in this repo). Save the minimal example from [Catalog format](#catalog-format) as `public/catalog.json`, then:

```sh
npm run validate-catalog   # schema + policy gate for the catalog
npm run dev                # Vite dev server (port 3001, see vite.config.ts)
npm run build              # type-check (tsc) + production build into dist/
npm run preview            # serve the production build locally
```

Notes on verifying these commands:

- `npm run dev` is defined in [package.json](package.json) as `vite`; [vite.config.ts](vite.config.ts) sets `server.port` to `3001` with `host: true`. Open the URL Vite prints and the app will fetch `/catalog.json` from `public/`.
- `npm run build` runs `tsc && vite build`. A successful build emits hashed entry assets (currently `index-[hash].js` / `index-[hash].css`) plus `dist/.vite/manifest.json` — the manifest matters in production, where the host-side deploy script resolves the entry chunk from it instead of guessing filenames.
- **Install caveat (observed):** with the currently locked dependencies, a plain `npm ci` can fail with an `ERESOLVE` peer-dependency conflict (`typescript@^7` in the root project vs. `@typescript-eslint/*` peer ranges that cap TypeScript below 6.1). If you hit that, `npm ci --legacy-peer-deps` installs the locked tree and `npm run build` then succeeds. This is a dependency-metadata issue in the lockfile, not a step you can skip — the build itself type-checks with the installed TypeScript.
- `npm run lint` exists (ESLint over `ts,tsx` with `--max-warnings 0`), but at the time of writing it does not pass: the installed ESLint 10 expects a flat `eslint.config.*` file while the repo still ships a legacy [.eslintrc.cjs](.eslintrc.cjs). Treat lint as currently broken until the config is migrated; do not assume a clean lint run.

## npm scripts

Every script below is copied exactly from the `scripts` field of [package.json](package.json). Do not invent others.

| Script | Command | Purpose |
| --- | --- | --- |
| `npm run dev` | `vite` | Vite dev server for standalone development (port 3001). |
| `npm run build` | `tsc && vite build` | Type-check, then production build into `dist/` (with Vite manifest). |
| `npm run lint` | `eslint . --ext ts,tsx --report-unused-disable-directives --max-warnings 0` | ESLint over TypeScript sources (currently blocked — see Quick start). |
| `npm run preview` | `vite preview` | Preview the production build locally. |
| `npm run validate-catalog` | `node scripts/validate-catalog.mjs` | Validate `public/catalog.json` (or a path passed as an argument) against schema and editorial policy. |
| `npm run deploy` | `./build-full.sh` | Host-side full deploy (script not in this repo — see below). |
| `npm run build:full` | `./build-full.sh` | Same host-side full build/deploy entry point. |
| `npm run update:catalog` | `./update-catalog.sh` | Host-side catalog update (regenerates sitemap, redeploys assets). |
| `npm run update:controller` | `./update-controller.sh` | Host-side step that rewrites the hashed asset filenames in the XenForo controller after a deploy. |

The last four scripts delegate to shell scripts (`build-full.sh`, `update-catalog.sh`, `update-controller.sh`) that are deliberately **not** in this repository — they are listed in [.gitignore](.gitignore) as local deployment tooling and live only on the production host. The comments in [scripts/validate-catalog.mjs](scripts/validate-catalog.mjs) and [scripts/generate-sitemap.mjs](scripts/generate-sitemap.mjs) confirm the gate runs inside those host scripts before every deploy. Running `npm run deploy` from a fresh clone will fail with "no such file" — that is expected outside the host.

Two more Node scripts live in [scripts/](scripts/) but are not wired as npm scripts; the host deploy scripts invoke them directly:

- [scripts/validate-catalog.mjs](scripts/validate-catalog.mjs) — the catalog gate (also `npm run validate-catalog`).
- [scripts/generate-sitemap.mjs](scripts/generate-sitemap.mjs) — writes the store sitemap (one URL per category) from `public/catalog.json`, defaulting to `/web/public_html/store-sitemap.xml` or a path passed as an argument.

## Catalog format

The catalog is a single JSON file. Its TypeScript contract is [src/types/catalog.ts](src/types/catalog.ts); the enforcement gate is [scripts/validate-catalog.mjs](scripts/validate-catalog.mjs). The fields below are taken from those two files — nothing here is inferred.

### Top level (`Catalog`)

| Field | Type | Required by validator | Notes |
| --- | --- | --- | --- |
| `version` | number | Yes — must be an integer | Catalog schema version. |
| `updated` | string | Yes — must match `YYYY-MM-DD` | ISO date of the last editorial review; shown in the app footer. |
| `categories` | `Category[]` | Yes — non-empty array | Store sections (Surface, Xbox, …). |
| `products` | `Product[]` | Yes — must be an array (may be empty) | All product picks. |

### `Category`

| Field | Type | Required | Notes |
| --- | --- | --- | --- |
| `slug` | string | Yes | URL segment: `/store/{slug}/`. Must match `/^[a-z0-9-]+$/`, be unique, and not be a reserved slug (below). |
| `title` | string | Yes | Nav label. |
| `pageTitle` | string | Yes | `<title>` for the section (server-rendered; mirrored on client navigation). |
| `metaDescription` | string | Yes | Meta description for the section. |
| `blurb` | string | Yes | Intro line under the category heading. |
| `featured` | string[] | Optional | Product `id`s surfaced on the `/store/` landing page. Every id must resolve to a product. |

### `Product`

| Field | Type | Required | Notes |
| --- | --- | --- | --- |
| `id` | string | Yes | Stable unique slug; used as the DOM anchor and quick-view key. Must be unique. |
| `asin` | string | Yes | The only Amazon-derived field. Must match `/^B0[A-Z0-9]{8}$/` and be unique. Outbound URLs are built from it at render time — never store full retailer URLs. |
| `category` | string | Yes | Must match a `Category.slug`. |
| `title` | string | Yes | Product title. |
| `blurb` | string | Yes | Card one-liner. |
| `description` | string | Optional | Quick-view body paragraph. |
| `badges` | string[] | Optional | Editorial only (e.g. "Editor's pick", "Windows 11 ready") — never Amazon claims (see validation policy). |
| `features` | string[] | Yes — non-empty array | Feature bullet list; the card shows the first three. |
| `notes` | string[] | Optional | Caveats worth knowing before buying (OEM license limits, compatibility, …). |
| `images` | `CatalogImage[]` | Yes — array required, empty allowed | Product images; empty renders a category-tinted placeholder instead of a photo. |

### `CatalogImage`

| Field | Type | Required | Notes |
| --- | --- | --- | --- |
| `src` | string | Yes | Must be a **local** file under `public/` (e.g. `images/foo.jpg`). Remote `http(s)://` URLs are rejected, and the file must exist at validation time. Paths are stored relative and prefixed with the asset base at render time. |
| `alt` | string | Yes | Alt text. |
| `caption` | string | Optional | Image caption. |
| `source` | string | Optional | Provenance URL of the original asset (manufacturer page) — recorded for rights tracking, not rendered. |

### Minimal valid example

Save as `public/catalog.json` for local development (this exact shape passes `npm run validate-catalog` with no product images, which is valid — `images` may be empty):

```json
{
  "version": 1,
  "updated": "2026-01-15",
  "categories": [
    {
      "slug": "surface",
      "title": "Surface",
      "pageTitle": "Surface — WindowsForum Store",
      "metaDescription": "Curated Surface picks.",
      "blurb": "Surface devices picked by the forum.",
      "featured": ["surface-pro-example"]
    }
  ],
  "products": [
    {
      "id": "surface-pro-example",
      "asin": "B0EXAMPLE1",
      "category": "surface",
      "title": "Example Surface Device",
      "blurb": "A short card summary.",
      "description": "A longer quick-view description.",
      "badges": ["Editor's pick"],
      "features": ["Feature one", "Feature two"],
      "notes": ["Check port compatibility before buying."],
      "images": []
    }
  ]
}
```

Note that `asin` values must be real ASINs matching the `B0…` pattern above in a real catalog; the example value exists only to show the field shape and will fail validation if its format is wrong.

### Validation (`npm run validate-catalog`)

`npm run validate-catalog` runs [scripts/validate-catalog.mjs](scripts/validate-catalog.mjs) against `public/catalog.json` by default; pass an explicit path to validate another file (`node scripts/validate-catalog.mjs path/to/catalog.json`). It exits non-zero and prints every error it finds. Beyond the required-field and cross-reference checks in the tables above, it enforces:

- **Uniqueness** — category slugs, product `id`s, and ASINs must each be unique; `product.category` must match an existing category slug; `category.featured` ids must resolve to real products.
- **Reserved slugs** — `home`, `pro`, and `m365` are rejected as category slugs. The XenForo controller 301-redirects those legacy sections (see `LEGACY_SECTIONS` in [Store.php](addon/Win11Store/Pub/Controller/Store.php)), so a category using one would be unreachable.
- **Images are local** — every `images[].src` must exist under `public/`; remote URLs fail.
- **Amazon Associates editorial policy** — the store deliberately carries no prices, discounts, ratings, or Amazon merchandising claims (that data would belong in PA-API, which this store does not use). The validator scans catalog text fields (`title`, `blurb`, `description`, `features`, `notes`, `badges`, category text, image `alt`/`caption`, …) and fails the run on any of: a price (`$N`), a discount (`% off`), a savings claim (`save $N`), "Amazon's Choice", "Best Seller", a review count, or a star rating. Write editorial copy that avoids those patterns.

Run validation before committing any catalog change; on the production host it also runs as a gate inside the deploy scripts.

## Project architecture

```text
win11store-app/
├── index.html                  # Dev harness only (noindex; production uses the XenForo template)
├── package.json                # npm scripts + dependency versions (source of truth for commands)
├── vite.config.ts              # Vite + React plugin, dev port 3001, hashed prod assets + manifest
├── tsconfig.json               # Strict TS for src/ (noEmit; build runs tsc && vite build)
├── public/                     # NOT in repo (git-ignored): local catalog.json + product images
│   └── catalog.json            # You supply this locally; production keeps its own on the host
├── src/
│   ├── main.tsx                # Entry: mounts App under ThemeProvider on #win11-store-root
│   ├── App.tsx                 # Shell: loads catalog, client routing, footer disclosures
│   ├── index.css               # Tailwind v4 theme tokens + scoped preflight (no global reset)
│   ├── vite-env.d.ts           # Vite client types
│   ├── types/
│   │   └── catalog.ts          # Catalog / Category / Product / CatalogImage interfaces
│   ├── lib/
│   │   ├── catalog.ts          # loadCatalog(), ASSET_BASE, imageUrl(), category/product lookups
│   │   ├── affiliate.ts        # AFFILIATE_TAG, amazonUrl(), disclosure strings
│   │   └── categoryColor.ts    # Per-category accent color (CSS var with accent fallback)
│   ├── contexts/
│   │   └── ThemeContext.tsx    # Mirrors XenForo light/dark mode onto a .dark class
│   └── components/
│       ├── CategoryNav.tsx     # Category navigation bar
│       ├── StoreHome.tsx       # /store/ landing: hero, category tiles, featured picks
│       ├── CategoryPage.tsx    # /store/{slug}/ product grid (+ software comparison extras)
│       ├── ProductCard.tsx     # Product card: image/placeholder, badges, Amazon link, Details
│       ├── ProductQuickView.tsx# Quick-view modal for one product
│       ├── ImageGallery.tsx    # Product image gallery
│       ├── ComparisonTable.tsx # License comparison (software category)
│       ├── SystemRequirements.tsx # System requirements block (software category)
│       └── ui/Modal.tsx        # Accessible modal primitive (portal) used by quick view
├── scripts/
│   ├── validate-catalog.mjs    # Catalog schema + editorial-policy gate
│   └── generate-sitemap.mjs    # Store sitemap generator (invoked by host deploy scripts)
├── addon/
│   ├── README.md               # Add-on ownership note (canonical source is addon/Win11Store/)
│   └── Win11Store/             # XenForo add-on source — see XenForo add-on below
├── deploy-addon.sh             # Export addon/Win11Store/ into a XenForo installation
├── packaging/                  # Separate Windows PWA packaging artifacts — see packaging/RELEASE.md
├── SECURITY.md                 # Private vulnerability reporting
└── LICENSE                     # MIT License
```

### How the app runs

1. **Entry** — [src/main.tsx](src/main.tsx) finds `#win11-store-root` (falling back to `#root`), reads the server-stamped `data-section` attribute so `/store/xbox/` opens on Xbox instead of the landing view, and renders `<App>` inside `ThemeProvider`.
2. **Catalog loading** — [src/lib/catalog.ts](src/lib/catalog.ts) `loadCatalog()` first tries the inline `<script id="store-catalog">` JSON (production, zero extra requests); on parse failure or absence it fetches `${ASSET_BASE}catalog.json` with `cache: 'no-cache'`. A failed load shows a plain "catalog didn't load" message rather than a blank page.
3. **Routing** — [src/App.tsx](src/App.tsx) keeps the active section in state, seeds it from `data-section` or the `/store/{slug}/` path, intercepts plain left-clicks for client-side navigation (`pushState` + scroll to top) while leaving modified clicks to the real anchor, and syncs `document.title` and the canonical link per section. An unknown section falls back to the landing view on the client (the server 301s it on a full load).
4. **Theming** — [src/contexts/ThemeContext.tsx](src/contexts/ThemeContext.tsx) mirrors XenForo's theme rather than owning one: it resolves `data-color-scheme` → `data-variation` → the XenForo `style_variation` cookie → `<html>` classes → `prefers-color-scheme`, writes the result back as a `.dark` class, and watches for changes. [src/index.css](src/index.css) deliberately imports Tailwind without its global preflight (a global reset previously broke the host forum's chrome), re-applying an equivalent reset scoped to `#win11-store-root` and the modal portal.
5. **Category colors** — [src/lib/categoryColor.ts](src/lib/categoryColor.ts) maps a slug to a `--wfs-cat-{slug}` CSS variable with an accent fallback, so adding a category to the catalog never requires a code change to render. [ProductCard.tsx](src/components/ProductCard.tsx) additionally picks a Lucide icon for known slugs (`surface`, `xbox`, `pc-upgrades`, `accessories`, `software`) with a generic fallback — display only, not a catalog constraint.

Key dependencies (from [package.json](package.json)): React 19 + React DOM, Vite 8 with `@vitejs/plugin-react`, TypeScript, Tailwind CSS v4 (via `@tailwindcss/postcss`), `lucide-react` icons, and `clsx`. There is no router library, state library, or backend in this repo — routing and data loading are hand-rolled as described above.

## XenForo add-on

The XenForo add-on source is owned by this repository at [addon/Win11Store/](addon/Win11Store/) (see also [addon/README.md](addon/README.md)). It registers the public `/store/` route and renders the page shell that the React app hydrates into:

| Path | Contents |
| --- | --- |
| [addon/Win11Store/addon.json](addon/Win11Store/addon.json) | Add-on manifest — "Windows 11 Store", version `1.1.0` (`version_id` 1000100). |
| [addon/Win11Store/Pub/Controller/Store.php](addon/Win11Store/Pub/Controller/Store.php) | `Win11Store\Pub\Controller\Store` — the `/store/` controller (below). |
| [addon/Win11Store/_data/routes.xml](addon/Win11Store/_data/routes.xml) | Public route: prefix `store`, format `:str<section>/`, controller `Win11Store:Store`. |
| [addon/Win11Store/_data/templates.xml](addon/Win11Store/_data/templates.xml) | The `win11store_index` template: meta/OG/Twitter/JSON-LD head, SSR fallback list, `#win11-store-root` mount point. |
| [addon/Win11Store/_data/template_modifications.xml](addon/Win11Store/_data/template_modifications.xml) | `wf_store_suppress_default_meta` — suppresses XenForo's fallback OG/Twitter block on store pages so the store template's full set is not duplicated. |
| [addon/Win11Store/hashes.json](addon/Win11Store/hashes.json) | File hashes for the add-on files above. |

What `Store.php` does per request: 301-redirects the legacy sections `home`/`pro`/`m365` (the same slugs the catalog validator reserves), 301-redirects unknown sections to `/store/` instead of soft-404ing, canonicalizes section casing, loads the deployed catalog from `/js/Win11Store/catalog.json` (logging and rendering an empty catalog rather than erroring if it is unreadable), builds per-section meta/OG data and `CollectionPage` + `BreadcrumbList` JSON-LD (deliberately no Product/Offer nodes and no prices), and inlines the catalog JSON into the page with script-tag-safe escaping for the React loader.

### Exporting the add-on (`deploy-addon.sh`)

From the repository root:

```sh
./deploy-addon.sh
```

As evidenced by [deploy-addon.sh](deploy-addon.sh), the script:

- resolves the repo root from its own location and requires `addon/Win11Store/` to exist there;
- targets `${ADDON_DEST:-/web/public_html/src/addons/Win11Store/}` — override with the `ADDON_DEST` environment variable;
- **refuses any destination other than `/web/public_html/src/addons/Win11Store/`** (with or without trailing slash) as a safety check;
- creates the destination and syncs with `rsync -a --delete --exclude='.git'`, then prints the export destination.

That destination allow-list is hardcoded — if your XenForo root differs, you must edit the script's `case` check; `ADDON_DEST` alone cannot point it elsewhere. After exporting, install/upgrade the add-on through XenForo as usual. Note the two asset filenames hard-coded in `Store.php` (`index-*.css` / `index-*.js` under `/js/Win11Store/`) are rewritten on the host by `update-controller.sh` after each SPA deploy — keep their `'css' => '/js/Win11Store/index-…'` shape if you edit that file.

## Production integration summary

Putting the evidenced pieces together, a production deploy works like this (the host-side scripts themselves are not in this repo):

1. The storefront is built (`tsc && vite build`), producing hashed assets and `dist/.vite/manifest.json`; assets are served under `/js/Win11Store/` alongside the deployed `catalog.json` and product images.
2. The catalog is gated by [scripts/validate-catalog.mjs](scripts/validate-catalog.mjs) and the sitemap regenerated by [scripts/generate-sitemap.mjs](scripts/generate-sitemap.mjs) (URLs derived from the same catalog that drives the controller's route whitelist, written atomically via temp-file + rename).
3. The XenForo controller serves `/store/` and `/store/{slug}/`, server-renders meta, JSON-LD, and a fallback product list for crawlers and no-JS clients, stamps `data-section` on `#win11-store-root`, and inlines the catalog as `<script id="store-catalog">` so hydration needs no extra request.
4. The React app hydrates, mirrors XenForo's light/dark theme, and takes over navigation client-side; outbound Amazon links are generated from ASINs with the affiliate tag at click-render time.
5. The add-on itself reaches the XenForo installation only via `./deploy-addon.sh` (see above) — building the SPA does not deploy the add-on or vice versa.

The [packaging/](packaging/) directory is a separate distribution path (Windows PWA MSIX/AppX bundles for the forum itself, with its own release gate in [packaging/RELEASE.md](packaging/RELEASE.md)); it is not part of the storefront build.

## Security

See [SECURITY.md](SECURITY.md): report vulnerabilities privately to the repository owner via GitHub rather than in public issues, and never commit credentials.

## License

This project is licensed under the MIT License — see the [LICENSE](LICENSE) file in this repository (MIT License, Copyright (c) 2026 Faratech) for the full text.

> Accuracy note: an earlier version of this README stated that no license had been selected. That is superseded — a `LICENSE` file (MIT) is present in the repository and governs reuse.
