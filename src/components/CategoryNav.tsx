import React from 'react'
import clsx from 'clsx'
import { categoryColor } from '../lib/categoryColor'
import type { Category } from '../types/catalog'

interface CategoryNavProps {
  categories: Category[]
  activeSection: string
  onNavigate: (slug: string, event: React.MouseEvent) => void
}

/**
 * Real anchors (middle-click / crawler friendly); left-clicks are intercepted
 * upstream for pushState navigation. The active pill takes its category color.
 */
const CategoryNav: React.FC<CategoryNavProps> = ({ categories, activeSection, onNavigate }) => (
  <nav aria-label="Store categories" className="flex flex-wrap gap-2">
    <a
      href="/store/"
      aria-current={activeSection === '' ? 'page' : undefined}
      onClick={event => onNavigate('', event)}
      className={clsx(
        'rounded-md px-4 py-2 text-sm font-semibold focus:outline-none focus-visible:ring-2 focus-visible:ring-accent',
        activeSection === ''
          ? 'bg-accent text-on-accent'
          : 'border border-edge bg-panel text-ink2 hover:bg-panel-alt',
      )}
    >
      All picks
    </a>
    {categories.map(category => {
      const active = activeSection === category.slug
      return (
        <a
          key={category.slug}
          href={`/store/${category.slug}/`}
          aria-current={active ? 'page' : undefined}
          onClick={event => onNavigate(category.slug, event)}
          className={clsx(
            'rounded-md px-4 py-2 text-sm font-semibold focus:outline-none focus-visible:ring-2 focus-visible:ring-accent',
            active
              ? 'text-white'
              : 'border border-edge bg-panel text-ink2 hover:bg-panel-alt',
          )}
          style={active ? { backgroundColor: categoryColor(category.slug) } : undefined}
        >
          {category.title}
        </a>
      )
    })}
  </nav>
)

export default CategoryNav
