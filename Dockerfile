# syntax=docker/dockerfile:1
# Multi-stage build for a slim production image (Next.js standalone output).

FROM node:20-alpine AS deps
WORKDIR /app
# Install OpenSSL for Prisma
RUN apk add --no-cache openssl
COPY package.json package-lock.json* ./
COPY prisma ./prisma
RUN npm ci

FROM node:20-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
# Ensure PDF worker is in public for Next.js build
RUN node -e "try{require('fs').cpSync('node_modules/pdfjs-dist/legacy/build/pdf.worker.min.mjs','public/pdf.worker.min.mjs')}catch(e){console.log(e)}"
ENV NEXT_TELEMETRY_DISABLED=1
RUN npm run build

FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
RUN addgroup --system --gid 1001 nodejs && adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs
EXPOSE 3000
ENV PORT=3000 HOSTNAME=0.0.0.0
CMD ["node", "server.js"]
