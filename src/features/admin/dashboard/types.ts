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
