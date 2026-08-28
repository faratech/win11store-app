#!/usr/bin/env node
/**
 * Generate the store sitemap from catalog.json — one URL per section, derived
 * from the same file that drives the controller's route whitelist, so the
 * sitemap can never advertise a URL that 301s. Runs inside update-catalog.sh
 * and build-full.sh; advertised via robots.txt (Sitemap: /store-sitemap.xml —
 * a top-level file deliberately, because a real docroot store/ directory could
 * shadow the XenForo /store/ route).
 *
 * tmp+rename write: a crawler fetching mid-write must never see a truncated
 * sitemap (same rule as WindowsBuilds/Service/Sitemap.php).
 */
import { readFileSync, writeFileSync, renameSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const appDir = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const outPath = process.argv[2] ?? '/web/public_html/store-sitemap.xml'
const catalog = JSON.parse(readFileSync(join(appDir, 'public/catalog.json'), 'utf8'))

const lastmod = `${catalog.updated}T00:00:00+00:00`
const urls = [
  { loc: 'https://windowsforum.com/store/', priority: '0.8' },
  ...catalog.categories.map(c => ({
    loc: `https://windowsforum.com/store/${c.slug}/`,
    priority: '0.7',
  })),
]

const xml = [
  '<?xml version="1.0" encoding="UTF-8"?>',
  '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
  ...urls.map(u => [
    '  <url>',
    `    <loc>${u.loc}</loc>`,
    `    <lastmod>${lastmod}</lastmod>`,
    '    <changefreq>weekly</changefreq>',
    `    <priority>${u.priority}</priority>`,
    '  </url>',
  ].join('\n')),
  '</urlset>',
  '',
].join('\n')

const tmp = `${outPath}.${process.pid}.tmp`
writeFileSync(tmp, xml)
renameSync(tmp, outPath)
console.log(`✅ store sitemap: ${urls.length} URLs → ${outPath} (lastmod ${catalog.updated})`)
