import { Clock, Mail, Phone, ShoppingCart, UserRound } from 'lucide-react'
import { useEffect } from 'react'
import { Link, Outlet } from 'react-router-dom'

import { BrandMark } from '@/components/brand-mark'
import { CartPriceNotices } from '@/components/cart-price-notices'
import { CartQuantityLimit } from '@/components/cart-quantity-limit'
import { ContactMenu } from '@/components/contact-menu'
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
import { useCartProducts } from '@/features/storefront/catalog/hooks/use-cart-products'
import { productPath } from '@/features/storefront/catalog/product-path'
import { VehicleHeaderButton } from '@/features/storefront/garage/components/vehicle-header-button'
import { VehicleSelectorDialog } from '@/features/storefront/garage/components/vehicle-selector-dialog'
import { POLICY_PAGES } from '@/features/storefront/policies/policy-values'
import { formatMoney } from '@/lib/money'
import { STORE_EMAIL, STORE_HOURS, STORE_PHONE } from '@/lib/store-contact'

const footerHeading = 'text-sm font-semibold uppercase tracking-[0.14em] text-white'
import { MAX_CART_QUANTITY, syncCartOwner, useCartStore } from '@/stores/cart-store'

export function StorefrontShell() {
  const items = useCartStore((state) => state.items)
  const priceChanges = useCartStore((state) => state.priceChanges)
  const drawerOpen = useCartStore((state) => state.drawerOpen)
  const setDrawerOpen = useCartStore((state) => state.setDrawerOpen)
  const remove = useCartStore((state) => state.remove)
  const setQty = useCartStore((state) => state.setQty)
  const count = items.reduce((sum, item) => sum + item.qty, 0)
  const products = useCartProducts()
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
        <div className="flex h-16 items-center justify-between gap-3 px-4 lg:px-6">
          <Link to="/" className="flex shrink-0 items-center gap-2.5">
            <BrandMark className="h-6 w-auto text-white" />
            <span className="leading-none">
              <span className="block text-[13px] font-semibold tracking-[0.16em]">TORQUETRACK</span>
              <span className="mt-1 block text-[10px] font-medium tracking-[0.32em] text-amber-400">
                DIESEL
              </span>
            </span>
          </Link>
          {/* El logo lleva a la portada y al checkout se llega desde el carrito. */}
          <nav className="flex items-center gap-1 sm:gap-2" aria-label="Store">
            <Link to="/shop" className={navLink}>
              Shop
            </Link>
            <ContactMenu triggerClassName={`${navLink} inline-flex items-center gap-1.5`} />
            <VehicleHeaderButton />
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
            {/* La cuenta siempre al final, a la derecha, separada de las acciones de compra. */}
            <span aria-hidden="true" className="mx-1 hidden h-6 w-px bg-white/15 sm:block" />
            <AccountNav />
          </nav>
        </div>
      </header>
      <Outlet />
      {/* Mismo tono que el header; el contenido va centrado con ancho máximo
          para que no quede pegado al borde izquierdo en pantallas anchas. */}
      <footer className="mt-12 bg-neutral-950 text-neutral-300">
        <div className="mx-auto grid max-w-6xl gap-10 px-6 py-12 sm:grid-cols-2 lg:grid-cols-[1.4fr_1fr_1fr_1fr] lg:px-8">
          <div>
            <Link to="/" className="inline-flex items-center gap-2.5 text-white">
              <BrandMark className="h-6 w-auto text-white" />
              <span className="leading-none">
                <span className="block text-[13px] font-semibold tracking-[0.16em]">TORQUETRACK</span>
                <span className="mt-1 block text-[10px] font-medium tracking-[0.32em] text-amber-400">
                  DIESEL
                </span>
              </span>
            </Link>
            <ul className="mt-5 space-y-2.5 text-sm">
              <li className="flex items-center gap-2">
                <Phone className="size-4 text-amber-400" aria-hidden="true" />
                {STORE_PHONE.display}
              </li>
              <li className="flex items-center gap-2">
                <Mail className="size-4 text-amber-400" aria-hidden="true" />
                <a className="hover:text-white hover:underline" href={`mailto:${STORE_EMAIL}`}>
                  {STORE_EMAIL}
                </a>
              </li>
              <li className="flex items-center gap-2">
                <Clock className="size-4 text-amber-400" aria-hidden="true" />
                {STORE_HOURS}
              </li>
            </ul>
          </div>
          <div>
            <p className={footerHeading}>Shipping</p>
            <p className="mt-3 text-sm leading-relaxed">Calculated at checkout, before you pay.</p>
          </div>
          <div>
            <p className={footerHeading}>Returns</p>
            <p className="mt-3 text-sm leading-relaxed">
              Contact us before sending a part back. Fitment is confirmed at checkout.
            </p>
          </div>
          <nav aria-label="Policies">
            <p className={footerHeading}>Policies</p>
            <ul className="mt-3 space-y-2 text-sm">
              {POLICY_PAGES.map((page) => (
                <li key={page.to}>
                  <Link to={page.to} className="hover:text-white hover:underline">
                    {page.title}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        </div>
        <div className="border-t border-white/10">
          <p className="mx-auto max-w-6xl px-6 py-5 text-xs text-neutral-500 lg:px-8">
            © {new Date().getFullYear()} TorqueTrack Diesel. All rights reserved.
          </p>
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
                  <Link to="/shop">Continue shopping</Link>
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
      <Link to="/login" className={`${navLink} inline-flex items-center gap-1.5`}>
        <UserRound className="size-4" aria-hidden="true" />
        Sign in
      </Link>
    )
  }

  return <StorefrontAccountMenu user={user} />
}
