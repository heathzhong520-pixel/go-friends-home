ARG NODE_IMAGE=docker.m.daocloud.io/library/node:22-alpine

FROM ${NODE_IMAGE} AS dependencies

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

FROM ${NODE_IMAGE} AS production-dependencies

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci --omit=dev

FROM ${NODE_IMAGE} AS builder

WORKDIR /app

ENV NEXT_TELEMETRY_DISABLED=1

COPY --from=dependencies /app/node_modules ./node_modules
COPY . .

RUN npm run build

FROM ${NODE_IMAGE} AS runner

WORKDIR /app

ENV NODE_ENV=production \
    NEXT_TELEMETRY_DISABLED=1 \
    HOST=0.0.0.0 \
    PORT=3000

RUN addgroup --system --gid 1001 nodejs \
    && adduser --system --uid 1001 gofriends

COPY --from=builder --chown=gofriends:nodejs /app/dist/standalone ./
COPY --from=production-dependencies --chown=gofriends:nodejs /app/node_modules ./node_modules
COPY --from=builder --chown=gofriends:nodejs /app/drizzle ./drizzle
COPY --from=builder --chown=gofriends:nodejs /app/scripts/bootstrap.mjs ./scripts/bootstrap.mjs

USER gofriends

EXPOSE 3000

CMD ["sh", "-c", "node scripts/bootstrap.mjs && node server.js"]
