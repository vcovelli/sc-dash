# --- Build Stage ---
FROM node:20-alpine AS builder

WORKDIR /app

# Install dependencies first for better Docker caching
COPY package.json package-lock.json ./
RUN npm ci

# Copy all sources (including env files for build!)
COPY . .

# If your .env.local or .env is outside your frontend dir, adjust the path accordingly!
COPY .env.local .env.local

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
COPY --from=builder /app/next.config.js ./next.config.js

# Copy env files for runtime (OPTIONAL, but usually not needed for Next.js unless you use runtime envs in custom server)
COPY --from=builder /app/.env.local ./.env.local
#COPY --from=builder /app/.env ./.env

EXPOSE 3000

CMD ["npm", "start"]
