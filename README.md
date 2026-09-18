# WindowsForum Store

React + TypeScript storefront UI for curated Windows, Surface, Xbox, and PC-upgrade picks.

## Development

```sh
npm ci
npm run build
npm run validate-catalog
```

The app expects `public/catalog.json` when running standalone. The production catalog is maintained outside this repository because it contains site-specific affiliate content. Product imagery is also intentionally excluded unless its redistribution rights are documented.

The production integration supplies the catalog inline and serves built assets under `/js/Win11Store/`. This public tree contains the reusable UI, catalog types, validation, and affiliate-link helpers. The XenForo add-on source is owned here at `addon/Win11Store/`; export it with `./deploy-addon.sh`. The production catalog remains host-specific and is not included.

## Affiliate disclosure

Outbound retailer links may contain an affiliate tag. The site operator may earn a commission from qualifying purchases, at no additional cost to the buyer. Product availability and terms are controlled by the retailer.

## License

No open-source license has been selected yet. Until a license is added, copyright remains with the project owner and reuse is not granted.
