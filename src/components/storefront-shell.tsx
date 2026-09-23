import { ShoppingCart } from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import { useEffect } from 'react'
import { Link, Outlet } from 'react-router-dom'

import { StorefrontButton } from '@/components/storefront-button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import { useSession } from '@/features/account/auth/hooks/use-session'
import { useSignOut } from '@/features/account/auth/hooks/use-sign-out'
import { listProducts } from '@/features/storefront/catalog/api'
import { catalogKeys } from '@/features/storefront/catalog/query-keys'
import { formatMoney } from '@/lib/money'
import { syncCart, useCartStore } from '@/stores/cart-store'

export function StorefrontShell() {
  const items = useCartStore((state) => state.items)
  const drawerOpen = useCartStore((state) => state.drawerOpen)
  const setDrawerOpen = useCartStore((state) => state.setDrawerOpen)
  const remove = useCartStore((state) => state.remove)
  const count = items.reduce((sum, item) => sum + item.qty, 0)
  const products = useQuery({ queryKey: catalogKeys.products(), queryFn: listProducts })
  const rows = items
    .map((item) => {
      const product = products.data?.find((row) => row.id === item.id)
      return product ? { ...product, qty: item.qty } : undefined
    })
    .filter((row): row is NonNullable<typeof row> => Boolean(row))
  const subtotal = rows.reduce((sum, row) => sum + Number(row.price || 0) * row.qty, 0)

  useEffect(() => {
    if (!products.data) return
    const timer = window.setTimeout(() => {
      void syncCart(products.data).catch(() => undefined)
    }, 250)
    return () => window.clearTimeout(timer)
  }, [items, products.data])

  return (
    <div className="min-h-screen bg-muted/40 text-foreground">
      <header className="sticky top-0 z-30 border-b bg-background">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3">
          <Link to="/" className="text-lg font-semibold tracking-tight">
            TorqueTrack Diesel
          </Link>
          <nav className="flex items-center gap-4 text-sm">
            <Link to="/" className="text-muted-foreground hover:text-foreground">
              Shop
            </Link>
            <Link to="/checkout" className="text-muted-foreground hover:text-foreground">
              Checkout
            </Link>
            <AccountNav />
            <StorefrontButton type="button" tone="outline" onClick={() => setDrawerOpen(true)}>
              <ShoppingCart className="size-4" />
              Cart
              <Badge variant="secondary">{count}</Badge>
            </StorefrontButton>
          </nav>
        </div>
      </header>
      <Outlet />
      <footer className="mt-12 border-t bg-background">
        <div className="mx-auto grid max-w-6xl gap-8 px-4 py-10 sm:grid-cols-3">
          <div>
            <p className="font-semibold">TorqueTrack Diesel</p>
            <p className="mt-2 text-sm text-muted-foreground">
              OEM and aftermarket diesel parts for Ford, Chevrolet, GMC and RAM.
            </p>
          </div>
          <div>
            <p className="font-semibold">Shop without a VIN</p>
            <p className="mt-2 text-sm text-muted-foreground">
              Pick the truck brand, choose the component, then confirm fitment at checkout.
            </p>
          </div>
          <div>
            <p className="font-semibold">Need a hand?</p>
            <p className="mt-2 text-sm text-muted-foreground">
              Have the VIN, OEM number or aftermarket number ready. We price the part before
              shipping.
            </p>
          </div>
        </div>
      </footer>
      <Sheet open={drawerOpen} onOpenChange={setDrawerOpen}>
        <SheetContent side="right" className="flex w-full flex-col sm:max-w-md">
          <SheetHeader>
            <SheetTitle>Your Cart</SheetTitle>
            <SheetDescription>Review parts before continuing to checkout.</SheetDescription>
          </SheetHeader>
          <div className="flex-1 space-y-3 overflow-auto py-4">
            {rows.length ? (
              rows.map((row) => (
                <div key={row.id} className="space-y-2">
                  <div className="flex justify-between gap-3">
                    <div>
                      <p className="font-semibold">{row.title}</p>
                      <p className="text-sm text-muted-foreground">
                        {row.partNumber} · Qty {row.qty}
                      </p>
                    </div>
                    <div className="text-right">
                      <p>{formatMoney(Number(row.price || 0) * row.qty)}</p>
                      <StorefrontButton
                        type="button"
                        tone="danger"
                        className="h-auto p-0"
                        onClick={() => remove(row.id)}
                      >
                        Remove
                      </StorefrontButton>
                    </div>
                  </div>
                  <Separator />
                </div>
              ))
            ) : (
              <p className="text-muted-foreground">Your cart is empty.</p>
            )}
          </div>
          <SheetFooter className="flex-col gap-4 sm:flex-col">
            <p className="flex w-full justify-between font-semibold">
              <span>Parts subtotal</span>
              <span>{formatMoney(subtotal)}</span>
            </p>
            <StorefrontButton asChild className="w-full" onClick={() => setDrawerOpen(false)}>
              <Link to="/checkout">Continue to Checkout</Link>
            </StorefrontButton>
            {rows.length ? (
              <StorefrontButton
                asChild
                tone="outline"
                className="w-full"
                onClick={() => setDrawerOpen(false)}
              >
                <Link to="/quote">Request a Quote</Link>
              </StorefrontButton>
            ) : null}
          </SheetFooter>
        </SheetContent>
      </Sheet>
    </div>
  )
}

const navLink = 'text-muted-foreground hover:text-foreground'

// Con sesión se ofrece el portal (y el panel si la cuenta tiene Role); sin
// sesión, un solo acceso para clientes y staff.
function AccountNav() {
  const session = useSession()
  const signOut = useSignOut()
  const user = session.data?.user

  if (!user) {
    return (
      <Link to="/login" className={navLink}>
        Sign in
      </Link>
    )
  }

  return (
    <>
      <Link to="/account" className={navLink}>
        My account
      </Link>
      {user.isStaff ? (
        <Link to="/admin" className={navLink}>
          Admin
        </Link>
      ) : null}
      <StorefrontButton
        type="button"
        tone="link"
        className="h-auto p-0 text-muted-foreground"
        onClick={() => signOut.mutate()}
        disabled={signOut.isPending}
      >
        Sign out
      </StorefrontButton>
    </>
  )
}
