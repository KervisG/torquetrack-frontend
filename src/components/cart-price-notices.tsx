import { useCartStore } from '@/stores/cart-store'

// El texto lo arma el backend (`The price of X has changed from $A to $B.`).
export function CartPriceNotices() {
  const notices = useCartStore((state) => state.notices)
  if (!notices.length) return null
  return (
    <div
      role="status"
      className="mb-3 space-y-1 rounded-md border border-amber-300 bg-amber-50 px-3 py-2 text-sm text-neutral-950"
    >
      {notices.map((notice) => (
        <p key={notice}>{notice}</p>
      ))}
    </div>
  )
}
