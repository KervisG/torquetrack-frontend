export type DashboardCounts = {
  orders: number
  activeQuotes: number
  buildingQuotes: number
  activeCarts: number
  abandonedCarts: number
  salesToday: number
}

export type DashboardResponse = {
  counts: DashboardCounts
}

export const ANALYTICS_RANGES = ['7d', '30d', '90d', '12m'] as const

export type AnalyticsRange = (typeof ANALYTICS_RANGES)[number]

export type AnalyticsGranularity = 'day' | 'month'

export type RevenuePoint = {
  date: string
  revenue: number
  orders: number
}

// `changePercent` llega en null cuando el período anterior fue cero: no hay
// base contra la cual comparar.
export type KpiValue = {
  value: number
  previous: number
  changePercent: number | null
}

export type StatusCount = {
  status: string
  count: number
}

export type TopProduct = {
  productId: string
  title: string
  partNumber: string
  units: number
  revenue: number
}

export type QuoteFunnel = {
  created: number
  sent: number
  converted: number
  conversionRate: number
}

export type CartFunnel = {
  created: number
  checkoutStarted: number
  converted: number
  abandoned: number
}

// Las fechas quedan como `YYYY-MM-DD` del día de la tienda (`timeZone`): un
// `new Date` las movería al huso del navegador y correría los puntos un día.
export type DashboardAnalytics = {
  range: AnalyticsRange
  granularity: AnalyticsGranularity
  timeZone: string
  start: string
  end: string
  revenueSeries: RevenuePoint[]
  kpis: {
    revenue: KpiValue
    orders: KpiValue
    averageOrderValue: KpiValue
    refunds: KpiValue
  }
  ordersByStatus: StatusCount[]
  topProducts: TopProduct[]
  quoteFunnel: QuoteFunnel
  cartFunnel: CartFunnel
}
