# 1. Build stage
FROM node:18-alpine AS builder
WORKDIR /app

# Install dependencies
COPY package.json package-lock.json* yarn.lock* ./
RUN \
  if [ -f yarn.lock ]; then yarn install --frozen-lockfile; \
  else npm ci; \
  fi

# Copy source code
COPY . .

# Build the app (for Next.js, this creates .next)
RUN npm run build

# 2. Production stage
FROM node:18-alpine AS runner
WORKDIR /app

# Add curl for health checks
RUN apk add --no-cache curl

# Create non-root user for security
RUN addgroup -g 1001 -S nodejs
RUN adduser -S nextjs -u 1001

# Only copy necessary files for production
COPY --from=builder /app/package.json ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/.next ./.next

# Copy public directory if it exists
COPY --from=builder /app/public ./public

# Copy config files
COPY --from=builder /app/next.config.js* ./
COPY --from=builder /app/next.config.ts* ./
COPY --from=builder /app/.env* ./

# Change ownership to nextjs user
RUN chown -R nextjs:nodejs /app
USER nextjs

# Expose port
EXPOSE 3000

# Set environment variables
ENV NODE_ENV=production
ENV PORT=3000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
  CMD curl -f http://localhost:3000/api/health || exit 1

# Start the app
CMD ["npm", "start"]