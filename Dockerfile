# Use a multi-stage build
FROM node:18-alpine AS frontend-builder

WORKDIR /app/frontend

# Copy frontend package files
COPY frontend/package.json frontend/package-lock.json ./

# Install frontend dependencies with legacy peer deps to handle React 19 compatibility
RUN npm ci --legacy-peer-deps

# Copy frontend source code
COPY frontend/ ./

# Build the frontend
RUN npm run build

# Main application stage
FROM denoland/deno:2.3.3

EXPOSE 9000

WORKDIR /app/deno-rest

# Set environment variables
ENV ENV=production
ENV APP_NAME="Bybit P2P Monitor"
ENV JWT_ACCESS_TOKEN_EXP=3600
ENV JWT_REFRESH_TOKEN_EXP=86400
ENV IP=0.0.0.0
ENV HOST=0.0.0.0
ENV PORT=9000
ENV PROTOCOL=http
ENV CLIENT_HOST=localhost
ENV CLIENT_PORT=9000
ENV CLIENT_PROTOCOL=http
ENV DB_PATH=./data/database.duckdb

# Copy package files first for better caching
COPY deno.json .
COPY deno.lock .

# Copy the entire project (excluding frontend node_modules due to .dockerignore)
COPY . .

# Copy the built frontend from the frontend-builder stage
COPY --from=frontend-builder /app/frontend/dist ./frontend/dist

CMD ["deno", "task", "start"]
