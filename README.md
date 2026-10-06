# TorqueTrack Diesel — frontend (Vite + React + TypeScript)

SPA de TorqueTrack: tienda, portal de cliente y panel de administración.
Consume la API REST del backend Django (`backend/`). Usa Vite, React,
TypeScript, Tailwind CSS y shadcn/ui; las rutas se declaran en
`src/routes.tsx` y cada pantalla vive en `src/features/*`.

## Desarrollo local

```bash
pnpm install
pnpm dev
```

## Tests

```bash
pnpm test          # vitest run
pnpm exec vitest    # modo watch
```

## Tipos, lint y build

```bash
pnpm exec tsc -b
pnpm lint
pnpm build
```

## Agregar primitivas de shadcn/ui

```bash
pnpm dlx shadcn@latest add <component>
```

`components.json` ya está configurado (alias y variables CSS de Tailwind).

## Imagen de producción (Docker + Nginx)

El `Dockerfile` compila el SPA y lo sirve con Nginx, que además hace de proxy
inverso hacia Django: proxy de Render (termina TLS) -> este contenedor (puerto
`PORT`, sin TLS) -> backend (gunicorn en el puerto 8000, servicio privado). La
configuración vive en `nginx/`. El `render.yaml` que despliega todo está en
`torquetrack-backend` y referencia este repo.

```bash
docker build -t torquetrack-frontend .
# Prueba local con el backend alcanzable.
docker run --rm -p 8080:80 \
  -e BACKEND_UPSTREAM=host.docker.internal:8010 torquetrack-frontend
```

| Variable | Default | Uso |
|---|---|---|
| `BACKEND_UPSTREAM` | `backend:8000` | `host:puerto` de gunicorn. En Render sale del `hostport` del servicio privado. |
| `PORT` | `80` | Puerto en el que escucha Nginx. Render lo define (10000 por defecto) y reemplaza el default. |

Nginx resuelve `BACKEND_UPSTREAM` en cada request (`resolver` con `valid=10s` y
una variable en `proxy_pass`), no una sola vez al arrancar: si el backend se
redespliega con otra IP, el proxy la sigue, y Nginx arranca aunque el backend
todavía no exista. Dos scripts de `/docker-entrypoint.d/` preparan eso antes de
que la imagen renderice el template con envsubst:

- `15-local-resolvers.envsh` (de la imagen oficial, activado con
  `NGINX_ENTRYPOINT_LOCAL_RESOLVERS=1`) exporta `NGINX_LOCAL_RESOLVERS` con los
  `nameserver` de `/etc/resolv.conf`.
- `18-backend-upstream.envsh` (`nginx/entrypoint/`) le agrega al host el
  dominio `search` de `/etc/resolv.conf` que lo resuelve, porque el `resolver`
  de Nginx no aplica esos dominios y el host interno de Render es un nombre
  corto. Si ninguno lo resuelve (docker compose), queda el nombre original.

`.gitattributes` fija LF en `nginx/` y en el `Dockerfile`: con CRLF el script
del entrypoint falla dentro del contenedor.

El SPA llama a `/api` en el mismo origen, así que el build no necesita la URL
del backend. Los `ARG` del build son:

| `ARG` | Default | Uso |
|---|---|---|
| `PNPM_VERSION` | `10.32.1` | Versión de pnpm con la que se generó el lockfile. |
| `VITE_GA_MEASUREMENT_ID` | vacío | ID de medición de Google Analytics 4 (`G-XXXXXXX`). Vacío, el SPA no carga gtag.js y el tracking es un no-op. |

```bash
docker build --build-arg VITE_GA_MEASUREMENT_ID=G-XXXXXXX -t torquetrack-frontend .
```

En desarrollo local va en `.env.local` (`VITE_GA_MEASUREMENT_ID=G-XXXXXXX`).
Con el ID definido, `src/lib/analytics.ts` manda `page_view` en cada cambio de
ruta y los eventos `view_item`, `add_to_cart`, `begin_checkout`, `purchase`
(página `/checkout-success`, solo con la referencia del pedido) y `search`
(búsqueda del catálogo). No mide `/admin` ni `/account`, y gtag.js se descarga
recién con el primer evento de la tienda. Nginx no define
Content-Security-Policy; si se agrega una, tiene que permitir
`https://www.googletagmanager.com` en `script-src` y
`https://*.google-analytics.com` en `connect-src`.

Rutas:

- `/api/`, `/django-admin/` y `/static/` van a Django. `/api/` tiene un tope de
  10 req/s por IP (ráfaga de 20, luego 429), salvo `/api/webhooks/stripe/` y
  `/api/health/`. Los throttles de DRF siguen siendo la segunda capa.
  `/django-admin/` comparte ese tope, y los POST a `/django-admin/login/`
  tienen uno propio de 5 por minuto por IP (ráfaga de 5), porque Django no
  limita los intentos de login del admin.
- `/assets/*` (con hash) se cachea 15 días como `immutable`; `index.html` va con
  `no-cache`. Cualquier otra ruta cae en `index.html` (React Router).
- `/sitemap.xml` se reescribe a `/api/sitemap.xml` y lo genera Django.
  `public/robots.txt` lo anuncia con un path relativo (`Sitemap: /sitemap.xml`)
  porque el build no conoce el dominio público; conviene cambiarlo por la URL
  absoluta cuando el dominio quede fijo.
- `/nginx-health` responde 200 para el `HEALTHCHECK` del contenedor y el health
  check HTTP de Render.

Render manda la IP real del cliente en `X-Forwarded-For`
([docs](https://render.com/articles/how-render-handles-ddos-attacks)). Nginx no
usa realip porque Render no publica los rangos de sus proxies: `$remote_addr`
es la IP del proxy, y por eso los topes de `limit_req` pueden ser compartidos
entre clientes. Nginx agrega esa IP al final de `X-Forwarded-For` y la manda
también en `X-Real-IP`. Con eso, el backend en producción necesita:

| Variable del backend | Valor | Por qué |
|---|---|---|
| `CLIENT_IP_HEADER` | vacío | `X-Real-IP` es la IP del proxy de Render, no la del cliente. |
| `NUM_PROXIES` | proxies que agregan entrada a `X-Forwarded-For` | Los throttles por IP usan el cliente real. Cuenta este Nginx más los proxies de Render; Render no documenta cuántos son, así que se confirma con el header que llega: el log de acceso de Nginx (formato `main` de la imagen) lo imprime al final de cada línea, y Nginx le suma una entrada más. Un valor mayor que el real deja que el cliente elija su IP. |
| `USE_X_FORWARDED_PROTO` | `True` | Django sabe que el request original fue HTTPS y `SECURE_SSL_REDIRECT` no entra en bucle. |
| `DJANGO_ALLOWED_HOSTS` | el dominio público | Nginx conserva el `Host` original. |
| `APP_URL` | `https://<dominio>` | El SPA y la API comparten origen; de ahí sale `CSRF_TRUSTED_ORIGINS`. |

El backend no debe ser público: en Render es un servicio privado, alcanzable
solo por la red privada, porque cualquiera que llegue directo podría enviarle
`X-Real-IP` o `X-Forwarded-Proto` falsos.

---

_Generado con `pnpm create vite@latest frontend --template react-ts`; las
secciones siguientes son las notas por defecto de la plantilla de Vite._

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the Oxlint configuration

If you are developing a production application, we recommend enabling type-aware lint rules by installing `oxlint-tsgolint` and editing `.oxlintrc.json`:

```json
{
  "$schema": "./node_modules/oxlint/configuration_schema.json",
  "plugins": ["react", "typescript", "oxc"],
  "options": {
    "typeAware": true
  },
  "rules": {
    "react/rules-of-hooks": "error",
    "react/only-export-components": ["warn", { "allowConstantExport": true }]
  }
}
```

See the [Oxlint rules documentation](https://oxc.rs/docs/guide/usage/linter/rules) for the full list of rules and categories.
