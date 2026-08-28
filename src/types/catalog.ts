export interface CatalogImage {
  src: string
  alt: string
  caption?: string
  /** Provenance URL of the original asset (manufacturer page) — not rendered. */
  source?: string
}

export interface Product {
  /** Stable unique slug; used as the DOM anchor and quick-view key. */
  id: string
  /** The only Amazon-derived field. Outbound URLs are built from it at render time. */
  asin: string
  /** Must match a Category.slug. */
  category: string
  title: string
  /** Card one-liner. */
  blurb: string
  /** Quick-view body paragraph. */
  description?: string
  /** Editorial only ("Editor's pick", "Windows 11 ready") — never Amazon claims. */
  badges?: string[]
  features: string[]
  /** Caveats worth knowing before buying (OEM license limits, header compatibility…). */
  notes?: string[]
  images: CatalogImage[]
}

export interface Category {
  /** URL segment: /store/{slug}/ */
  slug: string
  /** Nav label. */
  title: string
  /** <title> for the section (server-rendered; mirrored on client nav). */
  pageTitle: string
  metaDescription: string
  /** Intro line under the category heading. */
  blurb: string
  /** Product ids surfaced on the /store/ landing page. */
  featured?: string[]
}

export interface Catalog {
  version: number
  /** ISO date of the last editorial review. */
  updated: string
  categories: Category[]
  products: Product[]
}
