# Imagen de producción: nginx sirve el SPA ya compilado y hace de proxy
# inverso hacia Django. Topología: Cloudflare -> este contenedor -> backend.

# --- Build del SPA ---------------------------------------------------------
FROM node:24-alpine AS build

# package.json no declara `packageManager`: se fija la versión de pnpm con la
# que se generó pnpm-lock.yaml para que --frozen-lockfile sea reproducible.
ARG PNPM_VERSION=10.32.1
RUN corepack enable && corepack prepare pnpm@${PNPM_VERSION} --activate

WORKDIR /app

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
RUN pnpm install --frozen-lockfile

COPY . .
RUN pnpm build

# --- Runtime ---------------------------------------------------------------
FROM nginx:stable-alpine

# El server propio reemplaza al de ejemplo de la imagen.
RUN rm /etc/nginx/conf.d/default.conf

COPY nginx/cloudflare-ips.conf /etc/nginx/cloudflare/realip.conf
# El bloque `geo` necesita los mismos rangos con otra sintaxis: se derivan de
# la única lista mantenida a mano para que nunca diverjan.
RUN sed -n 's/^set_real_ip_from \(.*\);$/\1 1;/p' /etc/nginx/cloudflare/realip.conf \
        > /etc/nginx/cloudflare/geo.conf \
    && test -s /etc/nginx/cloudflare/geo.conf

COPY nginx/snippets/ /etc/nginx/snippets/
COPY nginx/templates/ /etc/nginx/templates/
COPY --from=build /app/dist /usr/share/nginx/html

# BACKEND_UPSTREAM: host:puerto de gunicorn. Debe resolver al arrancar nginx.
# CLOUDFLARE_ONLY: `on` rechaza con 403 lo que no llega desde Cloudflare; `off`
# solo para pruebas locales.
# El filtro limita envsubst a estas dos variables.
ENV BACKEND_UPSTREAM=backend:8000 \
    CLOUDFLARE_ONLY=on \
    NGINX_ENVSUBST_FILTER="^(BACKEND_UPSTREAM|CLOUDFLARE_ONLY)$"

# Puerto 80 sin TLS: Cloudflare termina HTTPS.
EXPOSE 80

HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD wget -q -O /dev/null http://127.0.0.1/nginx-health || exit 1
