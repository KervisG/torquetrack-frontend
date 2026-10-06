# Imagen de producción: nginx sirve el SPA ya compilado y hace de proxy
# inverso hacia Django. Topología: proxy de Render -> este contenedor -> backend.

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
# Opcional: ID de medición de Google Analytics 4 (G-XXXXXXX). Vite lo inyecta
# en el bundle al compilar; vacío, el SPA no carga gtag.js.
ARG VITE_GA_MEASUREMENT_ID=""
RUN VITE_GA_MEASUREMENT_ID="${VITE_GA_MEASUREMENT_ID}" pnpm build

# --- Runtime ---------------------------------------------------------------
FROM nginx:stable-alpine

# El server propio reemplaza al de ejemplo de la imagen.
RUN rm /etc/nginx/conf.d/default.conf

COPY nginx/snippets/ /etc/nginx/snippets/
COPY nginx/templates/ /etc/nginx/templates/
# El entrypoint de la imagen ignora los scripts sin permiso de ejecución.
COPY nginx/entrypoint/ /docker-entrypoint.d/
RUN chmod 755 /docker-entrypoint.d/18-backend-upstream.envsh
COPY --from=build /app/dist /usr/share/nginx/html

# BACKEND_UPSTREAM: host:puerto de gunicorn. Se resuelve en cada request, así
# que no hace falta que exista al arrancar nginx.
# PORT: el de Render reemplaza este default, que sirve para docker run local.
# NGINX_ENTRYPOINT_LOCAL_RESOLVERS: activa 15-local-resolvers.envsh, que exporta
# NGINX_LOCAL_RESOLVERS con los nameserver de /etc/resolv.conf.
# El filtro limita envsubst a esas tres variables.
ENV BACKEND_UPSTREAM=backend:8000 \
    PORT=80 \
    NGINX_ENTRYPOINT_LOCAL_RESOLVERS=1 \
    NGINX_ENVSUBST_FILTER="^(BACKEND_UPSTREAM|PORT|NGINX_LOCAL_RESOLVERS)$"

# Sin TLS: el proxy de Render termina HTTPS. EXPOSE es solo informativo; el
# puerto real es PORT.
EXPOSE 80

# Forma shell para que se expanda el PORT del contenedor.
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD wget -q -O /dev/null "http://127.0.0.1:${PORT}/nginx-health" || exit 1
