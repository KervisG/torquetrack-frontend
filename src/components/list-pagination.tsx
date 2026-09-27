import { useState } from 'react'

import { Button } from '@/components/ui/button'

export const ADMIN_PAGE_SIZE = 25

type PageView<T> = {
  items: T[]
  page: number
  pageCount: number
  total: number
  from: number
  to: number
  setPage: (page: number) => void
}

// `resetKey` cambia con los filtros: la página vuelve a 1 en el mismo render,
// no en un efecto, para no mostrar un instante la página anterior.
export function usePagedRows<T>(rows: T[], resetKey: string): PageView<T> {
  const [page, setPage] = useState(1)
  const [key, setKey] = useState(resetKey)
  const currentPage = key === resetKey ? page : 1
  if (key !== resetKey) {
    setKey(resetKey)
    setPage(1)
  }
  const pageCount = Math.max(1, Math.ceil(rows.length / ADMIN_PAGE_SIZE))
  const safePage = Math.min(currentPage, pageCount)
  const start = (safePage - 1) * ADMIN_PAGE_SIZE
  const items = rows.slice(start, start + ADMIN_PAGE_SIZE)
  return {
    items,
    page: safePage,
    pageCount,
    total: rows.length,
    from: rows.length === 0 ? 0 : start + 1,
    to: Math.min(start + ADMIN_PAGE_SIZE, rows.length),
    setPage,
  }
}

type ListPaginationProps = {
  page: number
  pageCount: number
  total: number
  from: number
  to: number
  onPage: (page: number) => void
}

export function ListPagination({ page, pageCount, total, from, to, onPage }: ListPaginationProps) {
  if (total <= ADMIN_PAGE_SIZE) return null
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 text-sm">
      <p className="text-muted-foreground">
        {from}–{to} of {total}
      </p>
      <div className="flex gap-2">
        <Button type="button" variant="outline" size="sm" disabled={page <= 1} onClick={() => onPage(page - 1)}>
          Previous
        </Button>
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={page >= pageCount}
          onClick={() => onPage(page + 1)}
        >
          Next
        </Button>
      </div>
    </div>
  )
}
