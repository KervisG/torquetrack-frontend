import { Phone, ShoppingCart } from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import { useEffect } from 'react'
import { Link, Outlet } from 'react-router-dom'

import { BrandMark } from '@/components/brand-mark'
import { CartPriceNotices } from '@/components/cart-price-notices'
import { CartQuantityLimit } from '@/components/cart-quantity-limit'
import { StorefrontAccountMenu } from '@/components/storefront-account-menu'
import { StorefrontButton } from '@/components/storefront-button'
import { Badge } from '@/components/ui/badge'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import { useSession } from '@/features/account/auth/hooks/use-session'
import { listProducts } from '@/features/storefront/catalog/api'
import { productPath } from '@/features/storefront/catalog/product-path'
import { catalogKeys } from '@/features/storefront/catalog/query-keys'
import { VehicleHeaderButton } from '@/features/storefront/garage/components/vehicle-header-button'
import { VehicleSelectorDialog } from '@/features/storefront/garage/components/vehicle-selector-dialog'
import { POLICY_PAGES } from '@/features/storefront/policies/policy-values'
import { formatMoney } from '@/lib/money'
import { STORE_EMAIL, STORE_PHONE } from '@/lib/store-contact'
import { MAX_CART_QUANTITY, syncCartOwner, useCartStore } from '@/stores/cart-store'

export function StorefrontShell() {
  const items = useCartStore((state) => state.items)
  const priceChanges = useCartStore((state) => state.priceChanges)
  const drawerOpen = useCartStore((state) => state.drawerOpen)
  const setDrawerOpen = useCartStore((state) => state.setDrawerOpen)
  const remove = useCartStore((state) => state.remove)
  const setQty = useCartStore((state) => state.setQty)
  const count = items.reduce((sum, item) => sum + item.qty, 0)
  const products = useQuery({ queryKey: catalogKeys.products(), queryFn: listProducts })
  const rows = items
    .map((item) => {
      const product = products.data?.find((row) => row.id === item.id)
      return product ? { ...product, qty: item.qty } : undefined
    })
    .filter((row): row is NonNullable<typeof row> => Boolean(row))
  const subtotal = rows.reduce((sum, row) => sum + Number(row.price || 0) * row.qty, 0)

  const session = useSession()
  const sessionKnown = !session.isPending
  const userId = session.data?.user?.id ?? null

  // El carrito vive en el backend: se lee al cargar la tienda y cada vez que
  // cambia la cuenta de la sesión (login, logout), así se ve el fusionado.
  useEffect(() => {
    if (sessionKnown) void syncCartOwner(userId)
  }, [sessionKnown, userId])

  return (
    <div className="min-h-screen bg-muted/40 text-foreground">
      <header className="sticky top-0 z-30 border-b border-white/10 bg-neutral-950/85 text-white backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-3 px-4">
          <Link to="/" className="flex shrink-0 items-center gap-2.5">
            <BrandMark className="h-6 w-auto text-white" />
            <span className="leading-none">
              <span className="block text-[13px] font-semibold tracking-[0.16em]">TORQUETRACK</span>
              <span className="mt-1 block text-[10px] font-medium tracking-[0.32em] text-amber-400">
                DIESEL
              </span>
            </span>
          </Link>
          {/* El logo ya lleva al catálogo y al checkout se llega desde el carrito. */}
          <nav className="flex items-center gap-1 sm:gap-2" aria-label="Store">
            <a href={STORE_PHONE.href} className={`${navLink} inline-flex items-center`} aria-label={`Call ${STORE_PHONE.display}`}>
              <Phone className="inline size-4 sm:mr-1.5" />
              <span className="max-sm:hidden">{STORE_PHONE.display}</span>
            </a>
            <VehicleHeaderButton />
            <AccountNav />
            <StorefrontButton
              type="button"
              tone="outline"
              className="h-9 border-white/15 bg-white/10 px-3 text-white hover:bg-white/15 hover:text-white"
              onClick={() => setDrawerOpen(true)}
            >
              <ShoppingCart className="size-4" />
              <span className="max-sm:sr-only">Cart</span>
              {/* Vacío no lleva contador: un "0" naranja parece un aviso. */}
              {count > 0 ? (
                <Badge className="border-transparent bg-amber-500 text-neutral-950 hover:bg-amber-500">
                  {count}
                </Badge>
              ) : null}
            </StorefrontButton>
          </nav>
        </div>
      </header>
      <Outlet />
      <footer className="mt-12 border-t bg-background">
        <div className="mx-auto grid max-w-6xl gap-8 px-4 py-10 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <p className="font-semibold">TorqueTrack Diesel</p>
            <a className="mt-2 block text-sm text-sky-900 hover:underline" href={STORE_PHONE.href}>
              {STORE_PHONE.display}
            </a>
            <a className="mt-2 block text-sm text-sky-900 hover:underline" href={`mailto:${STORE_EMAIL}`}>
              {STORE_EMAIL}
            </a>
            <p className="mt-2 text-sm text-muted-foreground">Open 8:00 AM – 9:00 PM</p>
          </div>
          <div>
            <p className="font-semibold">Shipping</p>
            <p className="mt-2 text-sm text-muted-foreground">
              Calculated at checkout, before you pay.
            </p>
          </div>
          <div>
            <p className="font-semibold">Returns</p>
            <p className="mt-2 text-sm text-muted-foreground">
              Contact us before sending a part back. Fitment is confirmed at checkout.
            </p>
          </div>
          <nav aria-label="Policies">
            <p className="font-semibold">Policies</p>
            <ul className="mt-2 space-y-2 text-sm">
              {POLICY_PAGES.map((page) => (
                <li key={page.to}>
                  <Link to={page.to} className="text-sky-900 hover:underline">
                    {page.title}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        </div>
      </footer>
      <VehicleSelectorDialog />
      <Sheet open={drawerOpen} onOpenChange={setDrawerOpen}>
        <SheetContent side="right" className="flex w-full flex-col sm:max-w-md">
          <SheetHeader>
            <SheetTitle>Your Cart</SheetTitle>
            <SheetDescription>
              {count === 1 ? '1 part' : `${count} parts`}
            </SheetDescription>
          </SheetHeader>
          <div className="flex-1 overflow-auto py-4">
            <CartPriceNotices />
            {rows.length ? (
              <ul className="divide-y">
                {rows.map((row) => (
                  <li key={row.id} className="flex gap-3 py-3">
                    <Link
                      to={productPath(row)}
                      className="grid size-16 shrink-0 place-items-center overflow-hidden rounded-md bg-muted"
                      onClick={() => setDrawerOpen(false)}
                    >
                      {row.image ? (
                        <img src={row.image} alt="" className="max-h-full max-w-full object-contain" />
                      ) : null}
                    </Link>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-start justify-between gap-3">
                        <p className="font-medium leading-snug">{row.title}</p>
                        <div className="shrink-0 text-right text-sm">
                          {priceChanges[row.id] != null ? (
                            <p className="text-xs text-muted-foreground line-through">
                              {formatMoney(priceChanges[row.id])}
                            </p>
                          ) : null}
                          <p className="font-semibold">{formatMoney(Number(row.price || 0) * row.qty)}</p>
                        </div>
                      </div>
                      <p className="text-sm text-muted-foreground">Part # {row.partNumber}</p>
                      <div className="mt-2 flex items-center gap-2">
                        <StorefrontButton
                          type="button"
                          size="sm"
                          tone="outline"
                          className="size-8 px-0"
                          aria-label={`Decrease ${row.title}`}
                          onClick={() => setQty(row.id, row.qty - 1)}
                        >
                          −
                        </StorefrontButton>
                        <span className="w-6 text-center text-sm">{row.qty}</span>
                        <StorefrontButton
                          type="button"
                          size="sm"
                          tone="outline"
                          className="size-8 px-0"
                          aria-label={`Increase ${row.title}`}
                          disabled={row.qty >= MAX_CART_QUANTITY}
                          onClick={() => setQty(row.id, row.qty + 1)}
                        >
                          +
                        </StorefrontButton>
                        <StorefrontButton
                          type="button"
                          tone="danger"
                          className="ml-auto h-auto p-0 text-sm"
                          onClick={() => remove(row.id)}
                        >
                          Remove
                        </StorefrontButton>
                      </div>
                      <CartQuantityLimit qty={row.qty} />
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="flex h-full flex-col items-start justify-center gap-3">
                <p className="text-muted-foreground">Your cart is empty.</p>
                <StorefrontButton asChild tone="outline" onClick={() => setDrawerOpen(false)}>
                  <Link to="/">Continue shopping</Link>
                </StorefrontButton>
              </div>
            )}
          </div>
          <SheetFooter className="flex-col gap-3 border-t pt-4 sm:flex-col">
            <p className="flex w-full justify-between font-semibold">
              <span>Parts subtotal</span>
              <span>{formatMoney(subtotal)}</span>
            </p>
            <StorefrontButton
              asChild
              className="w-full rounded-full bg-amber-400 text-neutral-950 hover:bg-amber-500"
              onClick={() => setDrawerOpen(false)}
            >
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

const navLink =
  'shrink-0 whitespace-nowrap rounded-md px-2.5 py-1.5 text-sm text-white/75 transition-colors hover:bg-white/10 hover:text-white'

// Con sesión, un solo menú de cuenta (portal, panel si la cuenta tiene Role y
// salida); sin sesión, un solo acceso para clientes y staff.
function AccountNav() {
  const session = useSession()
  const user = session.data?.user

  if (!user) {
    return (
      <Link to="/login" className={navLink}>
        Sign in
      </Link>
    )
  }

  return <StorefrontAccountMenu user={user} />
}
