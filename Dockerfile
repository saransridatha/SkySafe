# ----- Stage 1: Dependencies -----
FROM node:20-alpine AS deps
WORKDIR /app

# better-sqlite3 requires native build tools
RUN apk add --no-cache python3 make g++

COPY package.json package-lock.json ./
RUN npm ci

# ----- Stage 2: Build -----
FROM node:20-alpine AS builder
WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Build Next.js in standalone mode
ENV NEXT_TELEMETRY_DISABLED=1
RUN npm run build

# ----- Stage 3: Production -----
FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV HOSTNAME=0.0.0.0
ENV PORT=3000

# Create non-root user
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs

# Copy standalone output
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/public ./public

# Copy static data files (aircraft profiles, conflict zones, etc.)
COPY --from=builder /app/data ./data

# Create writable directory for SQLite database
RUN mkdir -p /app/db && chown nextjs:nodejs /app/db

# Set ownership
RUN chown -R nextjs:nodejs /app

USER nextjs

EXPOSE 3000

CMD ["node", "server.js"]
