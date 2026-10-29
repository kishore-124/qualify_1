# syntax=docker/dockerfile:1
# Qualify — production image. The app listens on port 5000.
#
#   docker compose up --build        → app on http://localhost:5000 (+ PostgreSQL, migrations, demo data)
#
# Targets:
#   runner  (default) the Next.js server
#   migrate           one-off job: `prisma migrate deploy` + demo data on an empty database

FROM node:22-alpine AS base
RUN apk add --no-cache libc6-compat openssl
WORKDIR /app
ENV NEXT_TELEMETRY_DISABLED=1

# ── Dependencies (also generates the Prisma client) ──
FROM base AS deps
COPY package.json package-lock.json ./
COPY prisma ./prisma
RUN npm ci

# ── Build the Next.js app ──
FROM base AS builder
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npx prisma generate && npx next build

# ── Database migrations + first-run demo data ──
FROM base AS migrate
COPY --from=deps /app/node_modules ./node_modules
COPY package.json ./
COPY prisma ./prisma
CMD ["sh", "-c", "npx prisma migrate deploy && node prisma/seed-if-empty.js"]

# ── Runtime: small standalone server ──
FROM node:22-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production \
    NEXT_TELEMETRY_DISABLED=1 \
    PORT=5000 \
    HOSTNAME=0.0.0.0
RUN addgroup -S -g 1001 nodejs && adduser -S -u 1001 -G nodejs nextjs
COPY --from=builder --chown=nextjs:nodejs /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
USER nextjs
EXPOSE 5000
HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
  CMD wget -qO- http://127.0.0.1:5000/api/categories > /dev/null || exit 1
CMD ["node", "server.js"]
