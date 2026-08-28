import React from 'react'
import { ArrowRight } from 'lucide-react'
import { DISCLOSURE_SHORT } from '../lib/affiliate'
import { featuredProducts, getCategory, productsFor } from '../lib/catalog'
import { categoryColor } from '../lib/categoryColor'
import ProductCard from './ProductCard'
import type { Catalog, Product } from '../types/catalog'

interface StoreHomeProps {
  catalog: Catalog
  onNavigate: (slug: string, event: React.MouseEvent) => void
  onDetails: (product: Product) => void
}

const StoreHome: React.FC<StoreHomeProps> = ({ catalog, onNavigate, onDetails }) => {
  const featured = featuredProducts(catalog)

  return (
    <div>
      {/* Hero: quiet Mica-style panel, the thesis in one line. */}
      <section
        aria-labelledby="store-heading"
        className="rounded-lg border border-edge bg-panel/85 p-8 shadow-[var(--shadow-depth)] backdrop-blur-md sm:p-10"
      >
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-accent">
          WindowsForum Store
        </p>
        <h1 id="store-heading" className="mt-2 max-w-2xl text-3xl font-semibold font-display leading-tight text-ink sm:text-4xl">
          Gear we'd put in our own machines.
        </h1>
        <p className="mt-3 max-w-2xl text-base text-muted">
          Hand-picked Surface hardware, Xbox gear, Windows 11-ready upgrades, and genuine
          Microsoft licenses — curated by the forum, bought on Amazon.
        </p>
        <p className="mt-4 text-xs text-muted">{DISCLOSURE_SHORT}</p>
      </section>

      {/* Category tiles */}
      <section aria-label="Browse by category" className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {catalog.categories.map(category => (
          <a
            key={category.slug}
            href={`/store/${category.slug}/`}
            onClick={event => onNavigate(category.slug, event)}
            className="store-card group rounded-lg border border-edge bg-panel p-5 shadow-[var(--shadow-depth)] focus:outline-none focus-visible:ring-2 focus-visible:ring-accent"
            style={{ borderLeft: `3px solid ${categoryColor(category.slug)}` }}
          >
            <h2 className="flex items-center justify-between text-lg font-semibold font-display text-ink">
              {category.title}
              <ArrowRight
                className="h-4 w-4 text-muted transition-transform duration-150 group-hover:translate-x-1 motion-reduce:transition-none motion-reduce:group-hover:translate-x-0"
                aria-hidden="true"
              />
            </h2>
            <p className="mt-1 text-sm text-muted">{category.blurb}</p>
            <p className="mt-3 text-xs font-medium text-ink2">
              {productsFor(catalog, category.slug).length} picks
            </p>
          </a>
        ))}
      </section>

      {/* Featured picks */}
      {featured.length > 0 && (
        <section aria-labelledby="featured-heading" className="mt-12">
          <h2 id="featured-heading" className="mb-5 text-2xl font-semibold font-display text-ink">
            This month's picks
          </h2>
          <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
            {featured.map(product => (
              <ProductCard
                key={product.id}
                product={product}
                categoryTitle={getCategory(catalog, product.category)?.title ?? product.category}
                onDetails={onDetails}
              />
            ))}
          </div>
        </section>
      )}
    </div>
  )
}

export default StoreHome
