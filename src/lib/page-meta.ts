import { useEffect } from 'react'

export const SITE_NAME = 'TorqueTrack Diesel'

type PageMeta = {
  // Sin el sufijo del sitio; el hook lo agrega salvo que `fullTitle` sea true.
  title: string
  fullTitle?: boolean
  description?: string
  // Path del SPA (`/product/cp3-pump`); se vuelve absoluto con el origen actual.
  canonicalPath?: string
  image?: string
  type?: 'website' | 'product'
  noindex?: boolean
}

type ManagedTag = { selector: string; create: () => HTMLElement; attr: 'content' | 'href' }

function metaTag(attr: 'name' | 'property', key: string): ManagedTag {
  return {
    selector: `meta[${attr}="${key}"]`,
    create: () => {
      const element = document.createElement('meta')
      element.setAttribute(attr, key)
      return element
    },
    attr: 'content',
  }
}

const TAGS = {
  description: metaTag('name', 'description'),
  robots: metaTag('name', 'robots'),
  ogTitle: metaTag('property', 'og:title'),
  ogDescription: metaTag('property', 'og:description'),
  ogType: metaTag('property', 'og:type'),
  ogUrl: metaTag('property', 'og:url'),
  ogImage: metaTag('property', 'og:image'),
  twitterCard: metaTag('name', 'twitter:card'),
  twitterTitle: metaTag('name', 'twitter:title'),
  twitterDescription: metaTag('name', 'twitter:description'),
  twitterImage: metaTag('name', 'twitter:image'),
  canonical: {
    selector: 'link[rel="canonical"]',
    create: () => {
      const element = document.createElement('link')
      element.setAttribute('rel', 'canonical')
      return element
    },
    attr: 'href',
  },
} satisfies Record<string, ManagedTag>

type TagKey = keyof typeof TAGS

// Valores de `index.html` al cargar el SPA. Al salir de una página se vuelve a
// ellos, así una ruta sin meta propia no hereda la de la anterior.
let defaults: { title: string; tags: Partial<Record<TagKey, string>> } | null = null

function readDefaults() {
  if (defaults) return defaults
  const tags: Partial<Record<TagKey, string>> = {}
  for (const key of Object.keys(TAGS) as TagKey[]) {
    const tag = TAGS[key]
    const value = document.head.querySelector(tag.selector)?.getAttribute(tag.attr)
    if (value != null) tags[key] = value
  }
  defaults = { title: document.title, tags }
  return defaults
}

function setTag(key: TagKey, value: string | undefined) {
  const tag = TAGS[key]
  let element = document.head.querySelector(tag.selector)
  if (value === undefined) {
    element?.remove()
    return
  }
  if (!element) {
    element = tag.create()
    document.head.appendChild(element)
  }
  element.setAttribute(tag.attr, value)
}

function absoluteUrl(path: string): string {
  return new URL(path, window.location.origin).toString()
}

// React 19 hoistea `<title>` y `<meta>` al `<head>`, pero los agrega junto a
// los de `index.html` en vez de reemplazarlos y quedarían dos descripciones.
// Este hook actualiza los mismos tags y restaura los valores por defecto al
// desmontar.
export function usePageMeta(meta: PageMeta) {
  const { title, fullTitle, description, canonicalPath, image, type, noindex } = meta

  useEffect(() => {
    const base = readDefaults()
    const documentTitle = fullTitle ? title : `${title} | ${SITE_NAME}`
    const pageDescription = description ?? base.tags.description
    const url = canonicalPath ? absoluteUrl(canonicalPath) : undefined
    const fallbackImage = base.tags.ogImage
    const imageUrl = image ? absoluteUrl(image) : fallbackImage ? absoluteUrl(fallbackImage) : undefined

    document.title = documentTitle
    setTag('description', pageDescription)
    setTag('robots', noindex ? 'noindex, nofollow' : base.tags.robots)
    setTag('canonical', url)
    setTag('ogTitle', documentTitle)
    setTag('ogDescription', pageDescription)
    setTag('ogType', type ?? base.tags.ogType)
    setTag('ogUrl', url)
    setTag('ogImage', imageUrl)
    // La tarjeta grande solo con foto propia; el ícono por defecto va en la chica.
    setTag('twitterCard', image ? 'summary_large_image' : base.tags.twitterCard)
    setTag('twitterTitle', documentTitle)
    setTag('twitterDescription', pageDescription)
    setTag('twitterImage', imageUrl)

    return () => {
      document.title = base.title
      for (const key of Object.keys(TAGS) as TagKey[]) setTag(key, base.tags[key])
    }
  }, [title, fullTitle, description, canonicalPath, image, type, noindex])
}
