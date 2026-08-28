/**
 * Each category owns a rail/chip color, defined per theme in index.css as
 * --wfs-cat-{slug}. Unknown (future) slugs fall back to the accent, so adding
 * a category to catalog.json never requires a code change to render.
 */
export const categoryColor = (slug: string): string =>
  `var(--wfs-cat-${slug}, var(--wfs-accent))`
