import React from 'react'
import { Check, ExternalLink, Gamepad2, Laptop, MemoryStick, Mouse, Package } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { amazonUrl } from '../lib/affiliate'
import { imageUrl } from '../lib/catalog'
import { categoryColor } from '../lib/categoryColor'
import type { Product } from '../types/catalog'

const categoryIcons: Record<string, LucideIcon> = {
  surface: Laptop,
  xbox: Gamepad2,
  'pc-upgrades': MemoryStick,
  accessories: Mouse,
  software: Package,
}

interface ProductCardProps {
  product: Product
  categoryTitle: string
  onDetails: (product: Product) => void
}

/**
 * The card's identity mark is its category rail: a 3px left rule + eyebrow
 * chip in the category color. Products without photos get a quiet paneled
 * fallback with the product initial — never a scraped Amazon image.
 */
const ProductCard: React.FC<ProductCardProps> = ({ product, categoryTitle, onDetails }) => {
  const railColor = categoryColor(product.category)
  const cover = product.images[0]

  return (
    <article
      id={product.id}
      className="store-card flex flex-col overflow-hidden rounded-lg border border-edge bg-panel shadow-[var(--shadow-depth)]"
      style={{ borderLeft: `3px solid ${railColor}` }}
    >
      {cover ? (
        // White tile in both themes — product photography standard, and most
        // manufacturer heroes are shot on white.
        <div className="aspect-[4/3] bg-white">
          <img
            src={imageUrl(cover.src)}
            alt={cover.alt}
            loading="lazy"
            className="h-full w-full object-contain p-4"
          />
        </div>
      ) : (
        // No photo yet: a quiet category-tinted band instead of a scraped image.
        <div
          className="flex aspect-video items-center justify-center"
          style={{ backgroundColor: `color-mix(in srgb, ${railColor} 9%, var(--wfs-panel-alt))` }}
          aria-hidden="true"
        >
          {React.createElement(categoryIcons[product.category] ?? Package, {
            className: 'h-12 w-12 opacity-70',
            style: { color: railColor },
            strokeWidth: 1.5,
          })}
        </div>
      )}

      <div className="flex flex-1 flex-col p-5">
        <div className="mb-2 flex flex-wrap items-center gap-2">
          <span
            className="rounded-sm px-2 py-0.5 text-xs font-semibold uppercase tracking-wide text-white"
            style={{ backgroundColor: railColor }}
          >
            {categoryTitle}
          </span>
          {product.badges?.map(badge => (
            <span
              key={badge}
              className="rounded-sm bg-accent-soft px-2 py-0.5 text-xs font-medium text-accent"
            >
              {badge}
            </span>
          ))}
        </div>

        <h3 className="text-lg font-semibold font-display leading-snug text-ink">
          {product.title}
        </h3>
        <p className="mt-1 text-sm text-muted">{product.blurb}</p>

        <ul className="mt-3 space-y-1.5">
          {product.features.slice(0, 3).map(feature => (
            <li key={feature} className="flex items-start gap-2 text-sm text-ink2">
              <Check className="mt-0.5 h-4 w-4 shrink-0 text-accent" aria-hidden="true" />
              <span>{feature}</span>
            </li>
          ))}
        </ul>

        <div className="mt-auto flex items-center gap-3 pt-5">
          <a
            href={amazonUrl(product.asin)}
            target="_blank"
            rel="sponsored noopener noreferrer"
            className="inline-flex flex-1 items-center justify-center gap-2 rounded-md bg-accent px-4 py-2.5 text-sm font-semibold text-on-accent hover:bg-accent-hover focus:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2"
          >
            See price on Amazon
            <ExternalLink className="h-4 w-4" aria-hidden="true" />
          </a>
          <button
            type="button"
            onClick={() => onDetails(product)}
            className="rounded-md border border-edge px-4 py-2.5 text-sm font-semibold text-ink2 hover:bg-panel-alt focus:outline-none focus-visible:ring-2 focus-visible:ring-accent"
          >
            Details
          </button>
        </div>
      </div>
    </article>
  )
}

export default ProductCard
