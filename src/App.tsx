import React, { useCallback, useEffect, useState } from 'react'
import { DISCLOSURE_FOOTER } from './lib/affiliate'
import { getCategory, loadCatalog } from './lib/catalog'
import CategoryNav from './components/CategoryNav'
import CategoryPage from './components/CategoryPage'
import ProductQuickView from './components/ProductQuickView'
import StoreHome from './components/StoreHome'
import type { Catalog, Product } from './types/catalog'

interface AppProps {
  /** Section the server rendered, from data-section on the root div. */
  initialSection: string
}

const LANDING_TITLE = 'WindowsForum Store — Curated Windows Hardware & Software'

const sectionFromPath = (): string => {
  const match = window.location.pathname.match(/^\/store\/([a-z0-9-]+)\/?/)
  return match ? match[1] : ''
}

/** Keep <title> and the canonical link in step with client-side navigation. */
const syncDocumentMeta = (catalog: Catalog, slug: string) => {
  const category = slug ? getCategory(catalog, slug) : undefined
  document.title = category?.pageTitle ?? LANDING_TITLE
  const canonical = document.querySelector<HTMLLinkElement>('link[rel="canonical"]')
  if (canonical) {
    canonical.href = `https://windowsforum.com/store/${slug ? `${slug}/` : ''}`
  }
}

const App: React.FC<AppProps> = ({ initialSection }) => {
  const [catalog, setCatalog] = useState<Catalog | null>(null)
  const [loadFailed, setLoadFailed] = useState(false)
  const [activeSection, setActiveSection] = useState(initialSection || sectionFromPath())
  const [quickView, setQuickView] = useState<Product | null>(null)

  useEffect(() => {
    loadCatalog().then(setCatalog).catch(() => setLoadFailed(true))
  }, [])

  useEffect(() => {
    const onPopState = () => setActiveSection(sectionFromPath())
    window.addEventListener('popstate', onPopState)
    return () => window.removeEventListener('popstate', onPopState)
  }, [])

  useEffect(() => {
    if (catalog) syncDocumentMeta(catalog, activeSection)
  }, [catalog, activeSection])

  const navigate = useCallback((slug: string, event: React.MouseEvent) => {
    // Leave modified clicks (new tab, middle-click) to the real anchor.
    if (event.defaultPrevented || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey || event.button !== 0) {
      return
    }
    event.preventDefault()
    window.history.pushState({}, '', `/store/${slug ? `${slug}/` : ''}`)
    setActiveSection(slug)
    window.scrollTo({ top: 0 })
  }, [])

  if (loadFailed) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-16 text-center">
        <p className="text-base text-muted">
          The store catalog didn't load. Refresh the page to try again.
        </p>
      </div>
    )
  }

  if (!catalog) return null

  // A section that vanished from the catalog after a client-side nav simply
  // falls back to the landing view; the server 301s it on a full load.
  const section = getCategory(catalog, activeSection) ? activeSection : ''

  return (
    <div className="mx-auto max-w-[1280px] px-4 py-8">
      <div className="mb-8">
        <CategoryNav
          categories={catalog.categories}
          activeSection={section}
          onNavigate={navigate}
        />
      </div>

      {section === '' ? (
        <StoreHome catalog={catalog} onNavigate={navigate} onDetails={setQuickView} />
      ) : (
        <CategoryPage catalog={catalog} slug={section} onDetails={setQuickView} />
      )}

      <ProductQuickView product={quickView} onClose={() => setQuickView(null)} />

      <footer className="mt-16 border-t border-edge pt-6 text-center text-xs text-muted">
        <p>{DISCLOSURE_FOOTER}</p>
        <p className="mt-1">Windows, Surface, and Xbox are trademarks of Microsoft Corporation.</p>
        <p className="mt-1">Catalog last reviewed {catalog.updated}.</p>
      </footer>
    </div>
  )
}

export default App
