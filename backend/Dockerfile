# ==============================================================================
# Backend Dockerfile for Society Maintenance System
# Multi-stage / lightweight Node.js Alpine runtime
# ==============================================================================
FROM node:20-alpine AS runner

# Create app directory
WORKDIR /usr/src/app

# Install wget/curl for health check
RUN apk --no-cache add curl

# Set production environment
ENV NODE_ENV=production

# Install dependencies based on package-lock.json
COPY package*.json ./
RUN npm ci --omit=dev

# Copy application code
COPY . .

# Ensure permissions for the non-root node user
RUN chown -R node:node /usr/src/app

# Run as non-privileged user
USER node

# Expose backend port
EXPOSE 5000

# Container healthcheck
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD curl -f http://localhost:5000/health || exit 1

# Start the application
CMD ["node", "server.js"]

