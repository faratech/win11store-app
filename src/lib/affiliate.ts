export const AFFILIATE_TAG = 'windowsfor081-20'

/** Outbound links are derived from the ASIN at render time so the tag can never drift. */
export const amazonUrl = (asin: string): string =>
  `https://www.amazon.com/dp/${asin}?tag=${AFFILIATE_TAG}`

export const DISCLOSURE_SHORT =
  'Paid link — WindowsForum may earn a commission if you buy through this link.'

export const DISCLOSURE_FOOTER =
  'As an Amazon Associate, WindowsForum.com earns from qualifying purchases.'
