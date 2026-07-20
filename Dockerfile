# # Base image shared across stages
# FROM node:22-alpine AS base

# # Set working directory
# WORKDIR /app

# # Copy package files first to maximize layer cache reuse
# COPY package*.json ./

# # Build stage
# FROM base AS builder

# # Install all dependencies required for the build
# RUN npm i

# # Copy source code
# COPY . .

# # Build the application
# RUN npm run build

# # Remove development dependencies so the runtime image can reuse the install
# RUN npm prune --omit=dev --ignore-scripts

# # Production stage
# FROM base AS production

# # Set NODE_ENV
# ENV NODE_ENV=production

# # Copy package metadata and pruned runtime dependencies from builder
# COPY package*.json ./
# COPY --from=builder /app/node_modules ./node_modules

# # Copy built application from builder
# COPY --from=builder /app/dist ./dist

# # Copy sequelize config and migration files (needed by db-configurator)
# # COPY .sequelizerc ./
# COPY config ./config
# COPY migrations ./migrations
# # COPY seeders ./seeders

# # Create logs and uploads directories
# RUN mkdir -p logs uploads && chown -R node:node logs uploads

# # Use non-root user
# USER node

# # Expose port
# EXPOSE 3000

# # # Health check
# # HEALTHCHECK --interval=30s --timeout=3s --start-period=30s --retries=3 \
# #   CMD node -e "require('http').get('http://localhost:3000/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

# # Start the application
# CMD ["node", "dist/index.js"]
# Stage 1: Build
FROM node:22-alpine AS builder

WORKDIR /app

COPY package.json ./
COPY package-lock.json ./

RUN npm ci 

COPY . .

RUN npm run build

RUN npm prune --omit=dev

# Stage 2: Production
FROM node:22-alpine

RUN apk --no-cache add curl

#RUN npm install -g npm@latest

WORKDIR /app

COPY --from=builder --chown=node:node /app/dist ./dist
COPY --from=builder --chown=node:node /app/node_modules ./node_modules
COPY --from=builder --chown=node:node /app/package.json ./
COPY --from=builder --chown=node:node /app/package-lock.json ./
COPY --from=builder --chown=node:node /app/src/migrations ./src/migrations
COPY --from=builder --chown=node:node /app/src/seeders ./src/seeders
COPY --from=builder --chown=node:node /app/src/config ./src/config
# COPY --from=builder --chown=node:node /app/.sequelizerc ./.sequelizerc

EXPOSE 3000

USER node

CMD ["node", "dist/index.js"]