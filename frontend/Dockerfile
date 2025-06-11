# --- Build Stage ---
FROM node:20-alpine AS builder

WORKDIR /app

# Install dependencies first for better Docker caching
COPY package.json package-lock.json ./
RUN npm ci

# Copy all sources
COPY . .

# Build Next.js app (skip lint for prod build speed)
ENV NEXT_DISABLE_ESLINT true
RUN npm run build

# --- Production Stage ---
FROM node:20-alpine AS runner

WORKDIR /app

# Install only production deps
COPY package.json package-lock.json ./
RUN npm ci --omit=dev

# Copy build output and other needed files
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
COPY --from=builder /app/next.config.* ./
# Or, if you want, just the .ts: 
# COPY --from=builder /app/next.config.ts ./next.config.ts

# If you use env files, copy them here:
# COPY .env ./

EXPOSE 3000

CMD ["npm", "start"]
