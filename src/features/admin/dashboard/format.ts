import type { AnalyticsGranularity, AnalyticsRange } from './types'

export const RANGE_LABELS: Record<AnalyticsRange, { short: string; long: string }> = {
  '7d': { short: '7D', long: 'Last 7 days' },
  '30d': { short: '30D', long: 'Last 30 days' },
  '90d': { short: '90D', long: 'Last 90 days' },
  '12m': { short: '12M', long: 'Last 12 months' },
}

const compactMoney = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  notation: 'compact',
  maximumFractionDigits: 1,
})

const percent = new Intl.NumberFormat('en-US', { maximumFractionDigits: 1 })

// Las fechas del backend ya son días de la tienda. Se arman en UTC y se
// formatean en UTC para que el huso del navegador no las corra un día.
function parseDay(value: string): Date {
  const [year, month, day] = value.split('-').map(Number)
  return new Date(Date.UTC(year, (month || 1) - 1, day || 1))
}

const dayAxis = new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', timeZone: 'UTC' })
const monthAxis = new Intl.DateTimeFormat('en-US', { month: 'short', timeZone: 'UTC' })
const dayLong = new Intl.DateTimeFormat('en-US', { dateStyle: 'medium', timeZone: 'UTC' })
const monthLong = new Intl.DateTimeFormat('en-US', { month: 'long', year: 'numeric', timeZone: 'UTC' })

export function formatAxisDate(value: string, granularity: AnalyticsGranularity): string {
  return (granularity === 'month' ? monthAxis : dayAxis).format(parseDay(value))
}

export function formatLongDate(value: string, granularity: AnalyticsGranularity): string {
  return (granularity === 'month' ? monthLong : dayLong).format(parseDay(value))
}

export function formatCompactMoney(value: number): string {
  return compactMoney.format(value)
}

export function formatPercent(value: number): string {
  return `${percent.format(value)}%`
}

// `PARTIALLY_REFUNDED` -> "Partially refunded".
export function statusLabel(status: string): string {
  const text = status.replace(/_/g, ' ').toLowerCase()
  return text.charAt(0).toUpperCase() + text.slice(1)
}
