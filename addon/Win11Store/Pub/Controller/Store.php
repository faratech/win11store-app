<?php

namespace Win11Store\Pub\Controller;

use XF\Pub\Controller\AbstractController;
use XF\Mvc\ParameterBag;

class Store extends AbstractController
{
    /**
     * Pre-catalog sections, 301'd to their new home. These slugs are reserved:
     * scripts/validate-catalog.mjs refuses a category that reuses one.
     */
    protected const LEGACY_SECTIONS = [
        'home' => '',
        'pro'  => 'software',
        'm365' => 'software',
    ];

    public function actionIndex(ParameterBag $params)
    {
        $catalog = $this->loadCatalog();
        $base = \XF::options()->boardUrl . '/store/';

        $raw = (string) $params->section;
        $section = strtolower($raw);

        if ($section !== '')
        {
            if (isset(self::LEGACY_SECTIONS[$section]))
            {
                $target = self::LEGACY_SECTIONS[$section];
                return $this->redirectPermanently($base . ($target !== '' ? $target . '/' : ''));
            }

            $validSlugs = array_column($catalog['categories'] ?? [], 'slug');
            if (!in_array($section, $validSlugs, true))
            {
                // Unknown sections used to render HTTP 200 soft-404s; keep the 301.
                return $this->redirectPermanently($base);
            }
            if ($section !== $raw)
            {
                // Route matching is case-insensitive; canonicalize /store/Xbox/ etc.
                return $this->redirectPermanently($base . $section . '/');
            }
        }

        // Get React asset files. NOTE: these two lines are rewritten by
        // /web/win11store_app/update-controller.sh via sed after every SPA
        // deploy — keep the exact `'css' => '/js/Win11Store/index-BsqyTnAG.css'` shape.
        $assets = [
            'css' => '/js/Win11Store/index-BsqyTnAG.css',
            'js' => '/js/Win11Store/index-BbmXfLaA.js'
        ];

        $meta = $this->getSectionMeta($catalog, $section);
        $sectionProducts = $this->getSsrProducts($catalog, $section);

        $view = $this->view('Win11Store:Store\Index', 'win11store_index', [
            'assets'          => $assets,
            'section'         => $section,
            'meta'            => $meta,
            'categories'      => $catalog['categories'] ?? [],
            'sectionProducts' => $sectionProducts,
            'jsonLd'          => $this->buildJsonLd($catalog, $section, $meta, $sectionProducts),
            'catalogJson'     => $this->encodeForScriptTag($catalog),
        ]);
        $view->setPageParams([
            'pageTitle'       => $meta['title'],
            'pageDescription' => $meta['description'],
        ]);
        return $view;
    }

    /**
     * The deployed catalog is the single source of truth (shipped alongside the
     * SPA assets by build-full.sh / update-catalog.sh). On any failure the page
     * still renders — landing view, empty catalog — rather than 500ing.
     */
    protected function loadCatalog(): array
    {
        $path = \XF::getRootDirectory() . '/js/Win11Store/catalog.json';

        try
        {
            $raw = @file_get_contents($path);
            if ($raw === false)
            {
                throw new \RuntimeException("unreadable: $path");
            }
            $catalog = json_decode($raw, true, 32, JSON_THROW_ON_ERROR);
            if (!is_array($catalog))
            {
                throw new \RuntimeException('catalog is not an object');
            }
            return $catalog;
        }
        catch (\Throwable $e)
        {
            \XF::logError('Win11Store catalog load failed: ' . $e->getMessage());
            return ['categories' => [], 'products' => []];
        }
    }

    protected function getSectionMeta(array $catalog, string $section): array
    {
        $base = 'https://windowsforum.com/store/';

        if ($section !== '')
        {
            foreach ($catalog['categories'] ?? [] as $category)
            {
                if (($category['slug'] ?? '') === $section)
                {
                    $og = $this->pickOgImage($catalog, $category);
                    return [
                        'title'       => $category['pageTitle'] ?? $category['title'],
                        'heading'     => $category['title'],
                        'description' => $category['metaDescription'] ?? '',
                        'canonical'   => $base . $section . '/',
                        'ogImage'     => $og['url'],
                        'ogImageAlt'  => $og['alt'],
                    ];
                }
            }
        }

        return [
            'title'       => 'WindowsForum Store — Curated Windows Hardware & Software',
            'heading'     => 'WindowsForum Store',
            'description' => 'Hand-picked Surface hardware, Xbox gear, Windows 11-ready PC upgrades, and genuine Microsoft licenses — curated by the WindowsForum community.',
            'canonical'   => $base,
            'ogImage'     => self::ASSET_BASE_URL . 'images/win11-pro-1.jpg',
            'ogImageAlt'  => 'WindowsForum Store',
        ];
    }

    protected const ASSET_BASE_URL = 'https://windowsforum.com/js/Win11Store/';

    /**
     * Share image for a category: its first featured product carrying an image,
     * else the category's first product with one, else the store default.
     */
    protected function pickOgImage(array $catalog, array $category): array
    {
        $products = $catalog['products'] ?? [];
        $byId = array_column($products, null, 'id');

        $candidates = [];
        foreach ($category['featured'] ?? [] as $id)
        {
            if (isset($byId[$id]))
            {
                $candidates[] = $byId[$id];
            }
        }
        foreach ($products as $product)
        {
            if (($product['category'] ?? '') === ($category['slug'] ?? ''))
            {
                $candidates[] = $product;
            }
        }

        foreach ($candidates as $product)
        {
            $image = $product['images'][0] ?? null;
            if (!empty($image['src']))
            {
                return [
                    'url' => self::ASSET_BASE_URL . ltrim($image['src'], '/'),
                    'alt' => $image['alt'] ?? ($product['title'] ?? 'WindowsForum Store'),
                ];
            }
        }

        return [
            'url' => self::ASSET_BASE_URL . 'images/win11-pro-1.jpg',
            'alt' => 'WindowsForum Store',
        ];
    }

    /**
     * Products for the server-rendered fallback list: the section's products,
     * or every category's featured picks on the landing page.
     */
    protected function getSsrProducts(array $catalog, string $section): array
    {
        $products = $catalog['products'] ?? [];
        if ($section !== '')
        {
            return array_values(array_filter($products, function ($product) use ($section)
            {
                return ($product['category'] ?? '') === $section;
            }));
        }

        $featuredIds = [];
        foreach ($catalog['categories'] ?? [] as $category)
        {
            foreach ($category['featured'] ?? [] as $id)
            {
                $featuredIds[$id] = true;
            }
        }
        return array_values(array_filter($products, function ($product) use ($featuredIds)
        {
            return isset($featuredIds[$product['id'] ?? '']);
        }));
    }

    /**
     * ItemList JSON-LD pointing at windowsforum.com URLs only. Deliberately no
     * Product/Offer nodes and no prices: the store shows none (Amazon ToS), and
     * Product-without-offers just breeds Search Console warnings.
     */
    protected function buildJsonLd(array $catalog, string $section, array $meta, array $sectionProducts): string
    {
        $items = [];
        if ($section !== '')
        {
            foreach ($sectionProducts as $i => $product)
            {
                $item = [
                    '@type'    => 'ListItem',
                    'position' => $i + 1,
                    'name'     => $product['title'] ?? '',
                    'url'      => $meta['canonical'] . '#' . ($product['id'] ?? ''),
                ];
                if (!empty($product['images'][0]['src']))
                {
                    $item['image'] = self::ASSET_BASE_URL . ltrim($product['images'][0]['src'], '/');
                }
                $items[] = $item;
            }
        }
        else
        {
            foreach ($catalog['categories'] ?? [] as $i => $category)
            {
                $items[] = [
                    '@type'    => 'ListItem',
                    'position' => $i + 1,
                    'name'     => $category['title'] ?? '',
                    'url'      => 'https://windowsforum.com/store/' . ($category['slug'] ?? '') . '/',
                ];
            }
        }

        $page = [
            '@type'       => 'CollectionPage',
            'name'        => $meta['title'],
            'description' => $meta['description'],
            'url'         => $meta['canonical'],
            'publisher'   => [
                '@type' => 'Organization',
                'name'  => 'WindowsForum',
                'url'   => 'https://windowsforum.com',
            ],
        ];
        if ($items)
        {
            $page['mainEntity'] = [
                '@type'           => 'ItemList',
                'name'            => $meta['heading'],
                'numberOfItems'   => count($items),
                'itemListElement' => $items,
            ];
        }

        $crumbs = [
            ['name' => 'Forums', 'item' => 'https://windowsforum.com/'],
            ['name' => 'Store',  'item' => 'https://windowsforum.com/store/'],
        ];
        if ($section !== '')
        {
            $crumbs[] = ['name' => $meta['heading'], 'item' => $meta['canonical']];
        }
        $breadcrumbs = [
            '@type'           => 'BreadcrumbList',
            'itemListElement' => array_map(function ($crumb, $i)
            {
                return [
                    '@type'    => 'ListItem',
                    'position' => $i + 1,
                    'name'     => $crumb['name'],
                    'item'     => $crumb['item'],
                ];
            }, $crumbs, array_keys($crumbs)),
        ];

        return $this->encodeForScriptTag([
            '@context' => 'https://schema.org',
            '@graph'   => [$page, $breadcrumbs],
        ]);
    }

    /**
     * Emitted raw inside <script> blocks via |raw. JSON_HEX_TAG and companions
     * escape < > & ' " so catalog text can never break out of the script tag.
     * Do NOT add JSON_UNESCAPED_SLASHES — it would un-escape "</script>".
     */
    protected function encodeForScriptTag($data): string
    {
        return json_encode(
            $data,
            JSON_UNESCAPED_UNICODE | JSON_HEX_TAG | JSON_HEX_AMP | JSON_HEX_APOS | JSON_HEX_QUOT
        );
    }
}
