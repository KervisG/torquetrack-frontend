---
name: frontend-feature-structure
description: "Trigger: crear componente, nueva feature, nueva pantalla, hook, donde va este archivo, estructura del frontend. Estructura de features y reglas de datos de src/."
license: Apache-2.0
metadata:
  author: Kervis
  version: "1.1"
---

## Activation Contract

Cargar antes de crear o mover cualquier archivo bajo `src/`: página, componente, hook, store, tipo, validador o llamada HTTP.

No aplica al backend (repo `torquetrack-backend`) ni a `src/components/ui/` (primitivas de shadcn, se toca solo para agregar una).

## Estructura — idéntica en TODAS las features

```
src/
  features/<audience>/<feature>/
    api.ts          llamadas HTTP; acá se reviven las fechas
    query-keys.ts   las claves de cache de esta feature
    types.ts        tipos que usan 2+ archivos de la feature
    pages/          <feature>-page.tsx
    components/     piezas que solo usa esta feature
    hooks/          use-*.ts
  components/       compartido por 2+ features (ui/ = shadcn)
  lib/
    api-client.ts   transporte: base URL, credenciales, unwrap de errores
    validators/     schemas de Zod
  stores/           stores de Zustand (cart, vehicle)
  router.tsx  main.tsx  index.css
```

`<audience>` es exactamente uno de `storefront`, `account` o `admin`. Nunca inventar un cuarto. Una carpeta aparece con su primer archivo; nunca inventar otra forma para una feature chica.

## Hard Rules

- El SPA nunca importa código del backend (repo `torquetrack-backend`); solo consume su API. Los tipos y la lógica de dominio viven en `src/`.
- Todo request pasa por `lib/api-client.ts`, que manda `credentials: "include"` — la sesión es la cookie de Django `sessionid`, nunca un bearer token. Los requests que mutan llevan `X-CSRFToken`, que agrega el mismo transporte.
- Los paths de la API SIEMPRE terminan en slash (`/api/admin/orders/`). Django no redirige un POST sin perder el body.
- Una feature de `features/admin/` llama solo a `/api/admin/**`; `features/storefront/` nunca llama un path de admin. Cruzar ese límite es un bug de autenticación, no un atajo.
- No existe un `api.ts` global. Cada feature tiene el suyo; `lib/api-client.ts` es solo transporte.
- Nunca escribir un `queryKey` literal. Salen del `query-keys.ts` de la feature dueña, así la invalidación cruzada queda visible en el import.
- `invalidateQueries` matchea por prefijo: `["orders"]` no alcanza a `["orders", "detail", id]`. Invalidar `.all` cuando una mutación desactualiza más de una vista.
- El carrito limita cada línea a `MAX_CART_QUANTITY` (99, el mismo tope que el backend) en `stores/cart-store.ts`: `add` y `setQty` recortan y el carrito guardado se recorta al rehidratar. Toda UI que cambie cantidades deshabilita el `+` en el tope y muestra `CartQuantityLimit` (`src/components/cart-quantity-limit.tsx`: "Maximum 99 per item. Request a quote for larger quantities.").
- El backend es la fuente de verdad del carrito. `stores/cart-store.ts` es optimista y su `persist` es solo caché: `hydrateCart()` lo lee de `GET /api/cart/` al montar `StorefrontShell` y cada vez que cambia el usuario de la sesión (login, logout); cada `add`/`setQty`/`remove`/`clear` agenda un `PUT /api/cart/` con `[{id, qty}]` y reconcilia con la respuesta repreciada solo si no hubo cambios locales después. Nunca mandar precios al carrito ni llamar a otro endpoint para guardarlo.
- Nunca recalcular dinero. El backend repricea el carrito en el checkout; mostrar los totales que devolvió la API. Un total calculado en el cliente que difiera es un bug incluso cuando se ve bien.
- Revivir toda fecha de la API con `new Date(...)` dentro del `api.ts` de la feature. TypeScript no avisa: el tipo dice `Date` y llega un string.
- La validación de formularios vive en `lib/validators/` como schemas de Zod, cableados con react-hook-form. Importar o extender un schema; nunca reescribir la regla en una página.
- El archivo de entrada se llama `<feature>-page.tsx` y exporta `<Feature>Page`.
- `any` y `as any` están prohibidos. Toda función de un `api.ts` declara su tipo de retorno; los componentes y hooks no.
- `export` solo si otro archivo lo importa, nunca por simetría.
- Registrar los handlers de MSW por feature contra `src/test/msw-server.ts`.
- Identificadores, archivos, rutas y textos de UI en inglés; comentarios en español. Ver `skills/language-convention/SKILL.md`.

## Decision Gates

| Qué es | Dónde va |
|---|---|
| La pantalla de la feature | `features/<a>/<f>/pages/<f>-page.tsx` |
| Pieza que solo usa esta feature | `features/<a>/<f>/components/` |
| Hook de esta feature | `features/<a>/<f>/hooks/` |
| Llamada HTTP | `features/<a>/<f>/api.ts` |
| Clave de cache | `features/<a>/<f>/query-keys.ts` |
| Tipo que usan 2+ archivos de la feature | `features/<a>/<f>/types.ts` |
| Tipo que usa un solo archivo | En ese archivo |
| Tipo que ya existe en otra feature | Importarlo. Nunca redeclararlo |
| Componente usado por 2+ features | `src/components/` |
| Helper usado por 2+ features | `src/lib/` |
| Primitiva de shadcn | `src/components/ui/` |
| Estado de cliente entre páginas (carrito, vehículo) | `src/stores/` |
| Schema de un formulario | `src/lib/validators/` |

## Execution Steps

1. Elegir la audiencia y después ubicar o crear `src/features/<audience>/<feature>/`.
2. Poner cada archivo donde manda la tabla. Sin barrels.
3. Imports: misma carpeta `./archivo`; cualquier otra cosa `@/...`.
4. Registrar la ruta en `src/router.tsx`, bajo el guard de esa audiencia.
5. Agregar handlers de MSW y un test de Vitest para el camino feliz y para el estado de error.
6. Verificar: `pnpm exec tsc -b && pnpm lint && pnpm test && pnpm build`.

## Output Contract

Reportar los archivos creados y en qué carpeta quedaron, la ruta registrada en `router.tsx`, la audiencia y el guard bajo el que quedó, los paths de API que llama y el resultado de la verificación. Señalar cualquier path de admin llamado desde una feature que no sea de admin, y cualquier cálculo de dinero en el cliente.

## References

- `references/feature-layout.md` — forma de `api-client` y de `query-keys`, mapa de audiencias con sus rutas y namespaces de API, y las dependencias que asume esta estructura.
