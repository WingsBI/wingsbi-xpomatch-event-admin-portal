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

# Only copy necessary files for production
COPY --from=builder /app/package.json ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public

# If you have a next.config.js or other config files, copy them too:
COPY --from=builder /app/next.config.js* ./
COPY --from=builder /app/.env* ./

# Expose port (default for Next.js is 3000)
EXPOSE 3000

# Start the app
CMD ["npm", "start"]