import React from 'react'
import { DISCLOSURE_SHORT } from '../lib/affiliate'
import { getCategory, productsFor } from '../lib/catalog'
import ProductCard from './ProductCard'
import ComparisonTable from './ComparisonTable'
import SystemRequirements from './SystemRequirements'
import type { Catalog, Product } from '../types/catalog'

interface CategoryPageProps {
  catalog: Catalog
  slug: string
  onDetails: (product: Product) => void
}

const CategoryPage: React.FC<CategoryPageProps> = ({ catalog, slug, onDetails }) => {
  const category = getCategory(catalog, slug)
  const products = productsFor(catalog, slug)

  if (!category) return null

  return (
    <section aria-labelledby={`section-${slug}`}>
      <header className="mb-6">
        <h1 id={`section-${slug}`} className="text-3xl font-semibold font-display text-ink">
          {category.title}
        </h1>
        <p className="mt-2 max-w-3xl text-base text-muted">{category.blurb}</p>
        <p className="mt-2 text-xs text-muted">{DISCLOSURE_SHORT}</p>
      </header>

      {products.length > 0 ? (
        <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
          {products.map(product => (
            <ProductCard
              key={product.id}
              product={product}
              categoryTitle={category.title}
              onDetails={onDetails}
            />
          ))}
        </div>
      ) : (
        <p className="rounded-lg border border-edge bg-panel p-6 text-sm text-muted">
          Picks for this category are being curated — check back soon.
        </p>
      )}

      {slug === 'software' && (
        <div className="mt-12 space-y-10">
          <div>
            <h2 className="mb-4 text-2xl font-semibold font-display text-ink">
              Which license fits?
            </h2>
            <ComparisonTable />
          </div>
          <SystemRequirements />
        </div>
      )}
    </section>
  )
}

export default CategoryPage
