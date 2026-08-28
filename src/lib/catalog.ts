import type { Catalog, Category, Product } from '../types/catalog'

/**
 * Hashed assets and catalog images live under /js/Win11Store/ in production,
 * while the page itself is served at /store/ — so image paths in the catalog
 * are stored relative ("images/foo.jpg") and prefixed here. In dev, Vite
 * serves public/ from the root.
 */
export const ASSET_BASE = import.meta.env.PROD ? '/js/Win11Store/' : '/'

export const imageUrl = (src: string): string =>
  /^(https?:)?\//.test(src) ? src : ASSET_BASE + src

/**
 * Production: the XF controller inlines the catalog into the page as
 * <script type="application/json" id="store-catalog">, so hydration needs no
 * extra request. Dev: fall back to fetching public/catalog.json.
 */
export async function loadCatalog(): Promise<Catalog> {
  const inline = document.getElementById('store-catalog')
  if (inline?.textContent) {
    try {
      return JSON.parse(inline.textContent) as Catalog
    } catch {
      // fall through to fetch — a malformed inline blob should not blank the page
    }
  }
  const res = await fetch(`${ASSET_BASE}catalog.json`, { cache: 'no-cache' })
  if (!res.ok) throw new Error(`catalog fetch failed: ${res.status}`)
  return (await res.json()) as Catalog
}

export const getCategory = (catalog: Catalog, slug: string): Category | undefined =>
  catalog.categories.find(c => c.slug === slug)

export const productsFor = (catalog: Catalog, slug: string): Product[] =>
  catalog.products.filter(p => p.category === slug)

export const getProduct = (catalog: Catalog, id: string): Product | undefined =>
  catalog.products.find(p => p.id === id)

export const featuredProducts = (catalog: Catalog): Product[] => {
  const ids = catalog.categories.flatMap(c => c.featured ?? [])
  return ids
    .map(id => getProduct(catalog, id))
    .filter((p): p is Product => Boolean(p))
}
