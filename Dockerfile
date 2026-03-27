# Build stage
FROM node:24-alpine AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./
COPY prisma ./prisma/

# Install dependencies
RUN npm ci

# Copy source code
COPY . .

# Generate Prisma client
RUN npx prisma generate

# Build application
RUN npm run build

# Production dependencies stage
FROM node:24-alpine AS deps

WORKDIR /app

COPY package*.json ./

# Install only production dependencies
RUN npm ci --omit=dev

# Production stage
FROM node:24-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production

# Copy production node_modules (includes prisma CLI and all deps)
COPY --from=deps /app/node_modules ./node_modules

# Copy built application
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/prisma ./prisma

# Copy generated Prisma client
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma

USER node

EXPOSE 3000

ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

CMD ["node", "server.js"]
