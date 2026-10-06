// Google Analytics 4 opcional. Sin `VITE_GA_MEASUREMENT_ID` en el build todo
// es un no-op y gtag.js nunca se descarga. El script se inyecta recién con el
// primer evento del storefront: el panel y el portal no lo cargan.

type GtagItem = {
  item_id: string
  item_name?: string
  item_brand?: string
  item_category?: string
  price?: number
  quantity?: number
}

type AnalyticsProduct = {
  id: string
  title?: string
  manufacturer?: string
  category?: string
  price?: number
}

declare global {
  interface ImportMetaEnv {
    readonly VITE_GA_MEASUREMENT_ID?: string
  }
  interface Window {
    dataLayer?: unknown[]
    gtag?: (...args: unknown[]) => void
  }
}

const MEASUREMENT_ID: string = (import.meta.env.VITE_GA_MEASUREMENT_ID ?? '').trim()

// El panel y el portal son privados: no se mide su navegación.
const UNTRACKED_PREFIXES = ['/admin', '/account']

let initialized = false

export function isTrackedPath(pathname: string): boolean {
  return !UNTRACKED_PREFIXES.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`))
}

function gtag(...args: unknown[]): boolean {
  if (!MEASUREMENT_ID || typeof window === 'undefined') return false
  if (!initialized) {
    initialized = true
    window.dataLayer = window.dataLayer ?? []
    // gtag.js lee `arguments`, no un array: por eso la función clásica.
    window.gtag = function gtagShim() {
      window.dataLayer?.push(arguments)
    }
    window.gtag('js', new Date())
    // Las vistas de página las manda el router: el SPA no recarga la página.
    window.gtag('config', MEASUREMENT_ID, { send_page_view: false })
    const script = document.createElement('script')
    script.async = true
    script.src = `https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(MEASUREMENT_ID)}`
    document.head.appendChild(script)
  }
  window.gtag?.(...args)
  return true
}

function toItem(product: AnalyticsProduct, quantity?: number): GtagItem {
  return {
    item_id: product.id,
    item_name: product.title,
    item_brand: product.manufacturer,
    item_category: product.category,
    price: product.price || undefined,
    quantity,
  }
}

export function trackPageView(pathname: string, search = ''): void {
  if (!isTrackedPath(pathname)) return
  gtag('event', 'page_view', {
    page_path: `${pathname}${search}`,
    page_location: window.location.href,
    page_title: document.title,
  })
}

export function trackViewItem(product: AnalyticsProduct): void {
  gtag('event', 'view_item', {
    currency: 'USD',
    value: product.price || undefined,
    items: [toItem(product)],
  })
}

export function trackAddToCart(product: AnalyticsProduct, quantity = 1): void {
  gtag('event', 'add_to_cart', {
    currency: 'USD',
    items: [toItem(product, quantity)],
  })
}

// Sin `value`: el total lo calcula el backend y no se recalcula en el cliente.
export function trackBeginCheckout(lines: { product: AnalyticsProduct; quantity: number }[]): void {
  gtag('event', 'begin_checkout', {
    currency: 'USD',
    items: lines.map((line) => toItem(line.product, line.quantity)),
  })
}

// Recargar la página de confirmación no debe contar la compra dos veces.
export function trackPurchase(transactionId: string): void {
  if (!MEASUREMENT_ID) return
  const key = `ga:purchase:${transactionId}`
  try {
    if (sessionStorage.getItem(key)) return
    sessionStorage.setItem(key, '1')
  } catch {
    // Sin sessionStorage (modo privado estricto) se envía igual.
  }
  gtag('event', 'purchase', { transaction_id: transactionId, currency: 'USD' })
}

export function trackSearch(term: string): void {
  gtag('event', 'search', { search_term: term })
}
