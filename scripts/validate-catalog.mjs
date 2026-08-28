#!/usr/bin/env node
/**
 * Catalog gate — runs before every deploy (build-full.sh, update-catalog.sh).
 *
 * Beyond schema shape, this enforces the Amazon Associates ToS posture the
 * store was built around: no prices, discounts, ratings, review counts, or
 * Amazon merchandising claims anywhere in catalog text. Product data that
 * needs those belongs in PA-API, which this store deliberately does not use.
 */
import { readFileSync, existsSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const appDir = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const catalogPath = process.argv[2] ?? join(appDir, 'public/catalog.json')
const publicDir = join(appDir, 'public')

const errors = []
const fail = msg => errors.push(msg)

let catalog
try {
  catalog = JSON.parse(readFileSync(catalogPath, 'utf8'))
} catch (e) {
  console.error(`❌ ${catalogPath}: ${e.message}`)
  process.exit(1)
}

const ASIN_RE = /^B0[A-Z0-9]{8}$/
const SLUG_RE = /^[a-z0-9-]+$/
// Reserved by the controller's legacy 301 map — a category with one of these
// slugs would be unreachable.
const RESERVED_SLUGS = new Set(['home', 'pro', 'm365'])

// Amazon-ToS tripwires. Any hit in any text field fails the run.
const TOS_PATTERNS = [
  [/\$\s?\d/, 'a price ("$N")'],
  [/%\s?off/i, 'a discount ("% off")'],
  [/save\s+\$\s?\d/i, 'a savings claim ("save $N")'],
  [/amazon'?s\s+choice/i, 'an "Amazon\'s Choice" claim'],
  [/best\s*seller/i, 'a "Best Seller" claim'],
  [/\d[\d,]*\s+reviews?/i, 'a review count'],
  [/\d(\.\d)?\s*(out of 5|stars?\b)/i, 'a star rating'],
]

const checkText = (where, value) => {
  if (typeof value !== 'string') return
  for (const [re, what] of TOS_PATTERNS) {
    if (re.test(value)) fail(`${where}: contains ${what}: ${JSON.stringify(value)}`)
  }
}

const requireString = (where, obj, key) => {
  if (typeof obj[key] !== 'string' || !obj[key].trim()) {
    fail(`${where}: missing or empty "${key}"`)
    return false
  }
  return true
}

if (!Number.isInteger(catalog.version)) fail('catalog: "version" must be an integer')
if (!/^\d{4}-\d{2}-\d{2}$/.test(catalog.updated ?? '')) fail('catalog: "updated" must be YYYY-MM-DD')
if (!Array.isArray(catalog.categories) || !catalog.categories.length) fail('catalog: "categories" must be a non-empty array')
if (!Array.isArray(catalog.products)) fail('catalog: "products" must be an array')

const slugs = new Set()
for (const [i, cat] of (catalog.categories ?? []).entries()) {
  const where = `categories[${i}]${cat?.slug ? ` (${cat.slug})` : ''}`
  for (const key of ['slug', 'title', 'pageTitle', 'metaDescription', 'blurb']) {
    if (requireString(where, cat, key)) checkText(`${where}.${key}`, cat[key])
  }
  if (typeof cat.slug === 'string') {
    if (!SLUG_RE.test(cat.slug)) fail(`${where}: slug must match ${SLUG_RE}`)
    if (RESERVED_SLUGS.has(cat.slug)) fail(`${where}: slug "${cat.slug}" is reserved by legacy redirects`)
    if (slugs.has(cat.slug)) fail(`${where}: duplicate slug`)
    slugs.add(cat.slug)
  }
  if (cat.featured !== undefined && !Array.isArray(cat.featured)) fail(`${where}: "featured" must be an array of product ids`)
}

const ids = new Set()
const asins = new Set()
for (const [i, product] of (catalog.products ?? []).entries()) {
  const where = `products[${i}]${product?.id ? ` (${product.id})` : ''}`
  for (const key of ['id', 'asin', 'category', 'title', 'blurb']) {
    if (requireString(where, product, key)) checkText(`${where}.${key}`, product[key])
  }
  checkText(`${where}.description`, product.description)

  if (typeof product.id === 'string') {
    if (ids.has(product.id)) fail(`${where}: duplicate id`)
    ids.add(product.id)
  }
  if (typeof product.asin === 'string') {
    if (!ASIN_RE.test(product.asin)) fail(`${where}: asin "${product.asin}" does not match ${ASIN_RE}`)
    if (asins.has(product.asin)) fail(`${where}: duplicate asin ${product.asin}`)
    asins.add(product.asin)
  }
  if (typeof product.category === 'string' && !slugs.has(product.category)) {
    fail(`${where}: category "${product.category}" matches no category slug`)
  }
  if (!Array.isArray(product.features) || !product.features.length) {
    fail(`${where}: "features" must be a non-empty array`)
  } else {
    product.features.forEach((f, j) => checkText(`${where}.features[${j}]`, f))
  }
  ;(product.notes ?? []).forEach((n, j) => checkText(`${where}.notes[${j}]`, n))
  ;(product.badges ?? []).forEach((b, j) => checkText(`${where}.badges[${j}]`, b))

  if (!Array.isArray(product.images)) {
    fail(`${where}: "images" must be an array (empty is allowed)`)
  } else {
    for (const [j, image] of product.images.entries()) {
      const imgWhere = `${where}.images[${j}]`
      if (!requireString(imgWhere, image, 'src')) continue
      requireString(imgWhere, image, 'alt')
      checkText(`${imgWhere}.alt`, image.alt)
      checkText(`${imgWhere}.caption`, image.caption)
      if (/^https?:\/\//.test(image.src)) {
        fail(`${imgWhere}: remote image "${image.src}" — catalog images must be local files under public/`)
      } else if (!existsSync(join(publicDir, image.src))) {
        fail(`${imgWhere}: file not found: public/${image.src}`)
      }
    }
  }
}

// Featured ids must resolve.
for (const cat of catalog.categories ?? []) {
  for (const id of cat.featured ?? []) {
    if (!ids.has(id)) fail(`categories (${cat.slug}): featured id "${id}" matches no product`)
  }
}

if (errors.length) {
  console.error(`❌ catalog validation failed (${errors.length} error${errors.length === 1 ? '' : 's'}):`)
  for (const error of errors) console.error(`   • ${error}`)
  process.exit(1)
}

console.log(`✅ catalog OK — ${catalog.products.length} products across ${catalog.categories.length} categories (updated ${catalog.updated})`)
