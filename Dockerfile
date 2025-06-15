FROM denoland/deno:2.1.9

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

# Copy the entire project (with pre-built frontend/dist)
COPY . .

CMD ["deno", "task", "start"]
