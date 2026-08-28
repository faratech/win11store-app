import React, { useCallback, useState } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { Modal } from './ui/Modal'
import { imageUrl } from '../lib/catalog'
import type { CatalogImage } from '../types/catalog'

interface ImageGalleryProps {
  images: CatalogImage[]
  productTitle: string
}

/**
 * Thumbnail grid + lightbox. The lightbox rides the shared Modal primitive
 * (dialog role, focus trap, Escape, scroll lock) and adds arrow-key navigation.
 */
const ImageGallery: React.FC<ImageGalleryProps> = ({ images, productTitle }) => {
  const [openIndex, setOpenIndex] = useState<number | null>(null)

  const step = useCallback((delta: number) => {
    setOpenIndex(current => {
      if (current === null) return current
      return (current + delta + images.length) % images.length
    })
  }, [images.length])

  const handleKeyDown = useCallback((event: React.KeyboardEvent) => {
    if (event.key === 'ArrowLeft') { event.preventDefault(); step(-1) }
    if (event.key === 'ArrowRight') { event.preventDefault(); step(1) }
  }, [step])

  if (!images.length) return null

  const open = openIndex === null ? null : images[openIndex]

  return (
    <>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {images.map((image, idx) => (
          <button
            key={image.src}
            type="button"
            onClick={() => setOpenIndex(idx)}
            className="group relative overflow-hidden rounded-md border border-edge bg-panel-alt focus:outline-none focus-visible:ring-2 focus-visible:ring-accent"
          >
            <img
              src={imageUrl(image.src)}
              alt={image.alt}
              loading="lazy"
              className="aspect-[4/3] w-full bg-white object-contain transition-transform duration-150 group-hover:scale-[1.03] motion-reduce:transition-none motion-reduce:group-hover:scale-100"
            />
            {image.caption && (
              <span className="absolute inset-x-0 bottom-0 bg-black/60 px-2 py-1 text-left text-xs text-white">
                {image.caption}
              </span>
            )}
          </button>
        ))}
      </div>

      <Modal
        isOpen={open !== null}
        onClose={() => setOpenIndex(null)}
        ariaLabel={`${productTitle} image viewer`}
        size="xl"
      >
        {open && (
          <div onKeyDown={handleKeyDown}>
            <img
              src={imageUrl(open.src)}
              alt={open.alt}
              className="mx-auto max-h-[60vh] w-auto rounded-md"
            />
            <div className="mt-4 flex items-center justify-between gap-4">
              <button
                type="button"
                onClick={() => step(-1)}
                aria-label="Previous image"
                className="rounded-md border border-edge p-2 text-ink2 hover:bg-panel-alt focus:outline-none focus-visible:ring-2 focus-visible:ring-accent"
              >
                <ChevronLeft className="h-5 w-5" aria-hidden="true" />
              </button>
              <p className="text-center text-sm text-muted">
                {open.caption ?? open.alt}
                <span className="ml-2 tabular-nums">({(openIndex ?? 0) + 1}/{images.length})</span>
              </p>
              <button
                type="button"
                onClick={() => step(1)}
                aria-label="Next image"
                className="rounded-md border border-edge p-2 text-ink2 hover:bg-panel-alt focus:outline-none focus-visible:ring-2 focus-visible:ring-accent"
              >
                <ChevronRight className="h-5 w-5" aria-hidden="true" />
              </button>
            </div>
          </div>
        )}
      </Modal>
    </>
  )
}

export default ImageGallery
