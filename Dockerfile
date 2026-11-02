# ─── OpticsKhan Store — Production Dockerfile ───
FROM node:20-alpine AS base

WORKDIR /app

# Install production dependencies only (uses lockfile for reproducibility)
COPY package.json package-lock.json ./
RUN npm ci --omit=dev

# Copy application source
COPY . .

# Don't run as root
RUN addgroup -S faboptic && adduser -S faboptic -G faboptic
USER faboptic

ENV NODE_ENV=production
ENV PORT=3000
EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget -qO- http://localhost:3000/api/health || exit 1

CMD ["node", "server.js"]
