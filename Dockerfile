# Use Node.js 20 LTS as base image
FROM node:20-alpine

# Set working directory
WORKDIR /app

# Install system dependencies for PostgreSQL client and image processing
RUN apk add --no-cache \
    python3 \
    make \
    g++ \
    postgresql-client

# Copy package files
COPY package*.json ./

# Install dependencies
# Use npm install instead of npm ci to handle lock file mismatches
RUN npm install --only=production && npm cache clean --force

# Copy application files
# Use .dockerignore to exclude unnecessary files
COPY . .

# Verify critical files are present (for debugging in case of issues)
RUN ls -la assets/fonts/static/ 2>/dev/null || echo "Note: Fonts will be checked at runtime"

# Verify memberships PDFs are present
RUN echo "Checking memberships folder:" && ls -la memberships/ || echo "Note: memberships folder check"

# Create necessary directories (not including memberships - it's already copied)
RUN mkdir -p uploads/profiles uploads/images uploads/documents uploads/vouchers uploads/memberships uploads/reels uploads/ads uploads/chat uploads/logos assets/fonts

# Set proper permissions (memberships folder is already present from COPY)
RUN chmod -R 755 uploads assets && chmod -R 755 memberships 2>/dev/null || true

# Expose port (Cloud Run uses PORT env var)
EXPOSE ${PORT:-8080}

# Health check (uses PORT env var, defaults to 8080)
HEALTHCHECK --interval=30s --timeout=3s --start-period=40s --retries=3 \
  CMD node -e "const port = process.env.PORT || 8080; require('http').get(`http://localhost:${port}/api/health`, (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

# Start the application
CMD ["node", "server.js"]

