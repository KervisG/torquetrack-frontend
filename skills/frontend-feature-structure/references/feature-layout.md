# Estructura de features

## Dependencias que asume esta estructura

TanStack Query (datos del servidor), react-hook-form + Zod (formularios), Zustand (estado de cliente), React Router y Tailwind con primitivas de shadcn. Todas ya están en `package.json`.

## Mapa de audiencias

Hay una sola cuenta y una sola sesión: la cookie de Django `sessionid` (`__Host-sessionid` en producción). Lo que cambia entre audiencias es el Role del usuario, no la cookie.

| Audiencia | Rutas del SPA | Sesión | Namespace de API |
|---|---|---|---|
| `storefront` | `/`, `/product/:id`, `/checkout`, `/checkout-success` | opcional (`sessionid` si el cliente inició sesión) | `/api/products/`, `/api/cart/`, `/api/checkout/`, `/api/vin/`, `/api/fitment/`, `/api/tax/`, `/api/shipping/`, `/api/quote/` |
| `account` | `/login`, `/register`, `/forgot-password`, `/reset-password`, `/activate`, `/verify-email`, `/account` | `sessionid` (User sin Role); los enlaces del correo no la exigen | `/api/session/`, `/api/login/`, `/api/logout/`, `/api/register/`, `/api/activate/`, `/api/password-reset/**`, `/api/verify-email/**`, `/api/account/**` |
| `admin` | `/admin/**` (`/admin/login` redirige a `/login`) | `sessionid` (User con Role) | `/api/admin/**` |

El login es compartido: `/login` del SPA llama a `/api/login/` para clientes y staff, y el Role decide si el usuario puede entrar al panel.

`/activate`, `/reset-password` y `/verify-email` quedan fuera del `GuestGuard`: son enlaces del correo y tienen que funcionar aunque el navegador tenga otra sesión abierta. `/verify-email` llama a la API desde un `useQuery` sin reintentos: el token es de un solo uso y un segundo request mostraría "enlace vencido". `SessionUser.emailVerified` en `false` muestra el aviso con "Resend email" en `/account`.

## `lib/api-client.ts`

Un solo transporte para las tres audiencias. Es el dueño del slash final, de las credenciales, del token CSRF y del unwrap de errores; las features nunca llaman `fetch` directamente.

- Manda `credentials: "include"`: sin eso el navegador no envía `sessionid` y el backend responde 401.
- Agrega el slash final a todo path, porque Django no redirige un POST sin perder el body.
- En todo request que muta manda `X-CSRFToken` con el token que devolvió el backend en el body (`csrfToken`) de `/api/session/`, login, registro o activación. No lee la cookie, porque su nombre cambia en producción (`__Host-csrftoken`).
- Convierte `{ "error": "..." }` en un `ApiError` con el status.

Un `401` de `/api/admin/**` significa que la sesión expiró; el guard del admin redirige a `/login` en lugar de dejar que la página renderice vacía.

## `query-keys.ts`

```ts
export const orderKeys = {
  all: ['orders'] as const,
  list: (filters: OrderFilters) => [...orderKeys.all, 'list', filters] as const,
  detail: (id: string) => [...orderKeys.all, 'detail', id] as const,
}
```

`orderKeys.all` es el objetivo de invalidación después de cualquier mutación que cambie estado, pago o cancelación, porque esas aparecen tanto en el listado como en el detalle.

## Dinero

El backend repricea cada línea contra la base de datos en el checkout y vuelve a correr la verificación de fitment, así que un subtotal calculado en el cliente es decorativo en el mejor caso y un descuadre silencioso en el peor. Mostrar `totals.subtotal`, `totals.core`, `totals.shipping`, `totals.tax` y `totals.total` exactamente como los devolvió la API.

Los core charges son una línea aparte, nunca metidos dentro del precio unitario.

## Tests

`src/test/msw-server.ts` ya llama a `setupServer()` sin handlers. Cada feature registra los suyos:

```ts
server.use(http.get('/api/admin/orders/', () => HttpResponse.json([...])))
```

Cubrir el camino feliz y el estado de error de cada página. El estado de error importa más que de costumbre acá: cuatro flujos del storefront dependen de una API de terceros que puede estar sin configurar o caída — checkout con Stripe, impuestos con TaxJar, envíos con EasyPost y VIN con NHTSA — y el backend lo expone como un `502`, un `503` o un `200` que trae `{ configured: false }`. Ese último es la trampa: una respuesta exitosa que significa que la feature no está disponible.
