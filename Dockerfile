FROM node:20-alpine AS builder

WORKDIR /app

# Copy package files
COPY services/nexus-prosecreator-marketing/package*.json ./
COPY services/nexus-prosecreator-marketing/tsconfig.json ./

# Install ALL dependencies (including TypeScript for build)
RUN npm install

# Copy source
COPY services/nexus-prosecreator-marketing/src ./src

# Build TypeScript
RUN npm run build

# Production image
FROM node:20-alpine

WORKDIR /app

# Copy package files
COPY services/nexus-prosecreator-marketing/package*.json ./

# Install production dependencies only
RUN npm install --omit=dev

# Copy built application
COPY --from=builder /app/dist ./dist

# Create logs directory
RUN mkdir -p logs

# Non-root user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001
USER nodejs

# Expose port
EXPOSE 9105

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:9105/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

# Start server
CMD ["node", "dist/server.js"]
