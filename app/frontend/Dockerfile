# =============================================================================
# Dockerfile Multi-Stage Hardened — Frontend React 19 + Vite
# =============================================================================

# ─────────────────────────────────────────────────────────────────────────────
# STAGE 1: Development (Vite Dev Server con Hot Reloading)
# ─────────────────────────────────────────────────────────────────────────────
FROM node:22-alpine AS development

WORKDIR /app

# Instalar dependencias con permisos adecuados
COPY package*.json ./
RUN npm ci

COPY . .

# Usar usuario sin privilegios 'node' incluido en la imagen base
RUN chown -R node:node /app
USER node

EXPOSE 3000

CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0", "--port", "3000"]

# ─────────────────────────────────────────────────────────────────────────────
# STAGE 2: Builder (Compilación estática SPA)
# ─────────────────────────────────────────────────────────────────────────────
FROM node:22-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

# ─────────────────────────────────────────────────────────────────────────────
# STAGE 3: Production (Nginx Unprivileged Hardened)
# ─────────────────────────────────────────────────────────────────────────────
FROM nginxinc/nginx-unprivileged:alpine AS production

COPY --from=builder /app/dist /usr/share/nginx/html

# Puerto no privilegiado por defecto de nginxinc/nginx-unprivileged
EXPOSE 8080

CMD ["nginx", "-g", "daemon off;"]
