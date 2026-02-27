FROM node:24-alpine AS builder
WORKDIR /app

# Install pnpm via corepack and build the app
COPY package.json pnpm-lock.yaml ./
RUN corepack enable && corepack prepare pnpm@latest --activate
COPY . .
RUN pnpm install --frozen-lockfile
RUN pnpm build

FROM node:24-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production

# Copy build output and installed deps from builder
COPY --from=builder /app/.output /app/.output
COPY --from=builder /app/node_modules /app/node_modules

EXPOSE 3000
CMD ["node", ".output/server/index.mjs"]
