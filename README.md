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
inverso hacia Django: Cloudflare -> este contenedor (puerto 80, sin TLS) ->
backend (gunicorn en el puerto 8000). La configuración vive en `nginx/`.

```bash
docker build -t torquetrack-frontend .
# Prueba local: sin la restricción de Cloudflare y con el backend alcanzable.
docker run --rm -p 8080:80 -e CLOUDFLARE_ONLY=off \
  -e BACKEND_UPSTREAM=host.docker.internal:8010 torquetrack-frontend
```

| Variable | Default | Uso |
|---|---|---|
| `BACKEND_UPSTREAM` | `backend:8000` | `host:puerto` de gunicorn. Debe resolver al arrancar; si no, Nginx no inicia. |
| `CLOUDFLARE_ONLY` | `on` | Con `on` responde 403 a lo que no llega desde un rango de Cloudflare. Solo `off` la desactiva, para pruebas locales. |

El build no necesita variables `VITE_*`: el SPA llama a `/api` en el mismo
origen. El único `ARG` es `PNPM_VERSION` (la versión con la que se generó el
lockfile).

Rutas:

- `/api/`, `/django-admin/` y `/static/` van a Django. `/api/` tiene un tope de
  10 req/s por IP (ráfaga de 20, luego 429), salvo `/api/webhooks/stripe/` y
  `/api/health/`. Los throttles de DRF siguen siendo la segunda capa.
  `/django-admin/` comparte ese tope, y los POST a `/django-admin/login/`
  tienen uno propio de 5 por minuto por IP (ráfaga de 5), porque Django no
  limita los intentos de login del admin.
- `/assets/*` (con hash) se cachea 15 días como `immutable`; `index.html` va con
  `no-cache`. Cualquier otra ruta cae en `index.html` (React Router).
- `/nginx-health` responde 200 para el `HEALTHCHECK` del contenedor.

La IP real del cliente sale de `CF-Connecting-IP`, aceptado solo desde los
rangos de `nginx/cloudflare-ips.conf` (el archivo explica cómo refrescarlos).
Nginx la reenvía en `X-Real-IP`, que siempre sobrescribe. Con eso, el backend
en producción necesita:

| Variable del backend | Valor | Por qué |
|---|---|---|
| `CLIENT_IP_HEADER` | `HTTP_X_REAL_IP` | Los throttles por IP usan el cliente real y no la IP de Nginx. |
| `NUM_PROXIES` | `1` | Respaldo si falta el header: la última entrada de `X-Forwarded-For` es la que agrega Nginx. |
| `USE_X_FORWARDED_PROTO` | `True` | Django sabe que el request original fue HTTPS y `SECURE_SSL_REDIRECT` no entra en bucle. |
| `DJANGO_ALLOWED_HOSTS` | el dominio público | Nginx conserva el `Host` original. |
| `APP_URL` | `https://<dominio>` | El SPA y la API comparten origen; de ahí sale `CSRF_TRUSTED_ORIGINS`. |

El contenedor del backend no debe publicar su puerto: solo este Nginx tiene que
alcanzarlo, o cualquiera podría enviarle `X-Real-IP` o `X-Forwarded-Proto` falsos.

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
