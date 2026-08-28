import React from 'react'
import { AlertCircle, Check, ExternalLink } from 'lucide-react'
import { Modal } from './ui/Modal'
import ImageGallery from './ImageGallery'
import { amazonUrl, DISCLOSURE_SHORT } from '../lib/affiliate'
import type { Product } from '../types/catalog'

interface ProductQuickViewProps {
  product: Product | null
  onClose: () => void
}

const ProductQuickView: React.FC<ProductQuickViewProps> = ({ product, onClose }) => (
  <Modal
    isOpen={product !== null}
    onClose={onClose}
    title={product?.title}
    size="xl"
  >
    {product && (
      <div className="space-y-6">
        {product.description && (
          <p className="text-sm leading-relaxed text-ink2">{product.description}</p>
        )}

        <div>
          <h3 className="mb-2 text-sm font-semibold uppercase tracking-wide text-muted">
            What you get
          </h3>
          <ul className="space-y-1.5">
            {product.features.map(feature => (
              <li key={feature} className="flex items-start gap-2 text-sm text-ink2">
                <Check className="mt-0.5 h-4 w-4 shrink-0 text-accent" aria-hidden="true" />
                <span>{feature}</span>
              </li>
            ))}
          </ul>
        </div>

        {product.notes && product.notes.length > 0 && (
          <div className="rounded-md border border-edge bg-panel-alt p-4">
            <h3 className="mb-2 flex items-center gap-2 text-sm font-semibold text-ink">
              <AlertCircle className="h-4 w-4 text-accent" aria-hidden="true" />
              Worth knowing before you buy
            </h3>
            <ul className="space-y-1 text-sm text-ink2">
              {product.notes.map(note => (
                <li key={note} className="flex items-start gap-2">
                  <span className="text-muted" aria-hidden="true">•</span>
                  <span>{note}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {product.images.length > 0 && (
          <ImageGallery images={product.images} productTitle={product.title} />
        )}

        <div>
          <a
            href={amazonUrl(product.asin)}
            target="_blank"
            rel="sponsored noopener noreferrer"
            className="inline-flex w-full items-center justify-center gap-2 rounded-md bg-accent px-6 py-3 text-base font-semibold text-on-accent hover:bg-accent-hover focus:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2"
          >
            See price on Amazon
            <ExternalLink className="h-4 w-4" aria-hidden="true" />
          </a>
          <p className="mt-2 text-center text-xs text-muted">{DISCLOSURE_SHORT}</p>
        </div>
      </div>
    )}
  </Modal>
)

export default ProductQuickView
