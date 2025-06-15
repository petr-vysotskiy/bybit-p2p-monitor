# Bybit P2P Monitor - Simplified

A simple web application that displays P2P offers data from Bybit in a graph format.

## Features

- **No authentication required** - Simple, public access
- **Real-time chart visualization** - Shows P2P offer prices over time
- **Responsive design** - Works on desktop and mobile
- **Token pair summary** - Overview of available trading pairs

## Quick Start

### 1. Start the Backend

```bash
# Install dependencies (if needed)
deno install

# Run the backend server
deno run --allow-all app.ts
```

The backend will start on port 8000 (or as configured in your environment).

### 2. Start the Frontend

```bash
cd frontend
npm install
npm run dev
```

The frontend will start on port 5173 and automatically open in your browser.

## API Endpoints

### Public Endpoints

- `GET /api/p2p/health` - Health check
- `GET /api/p2p/offers?limit=100` - Get latest P2P offers (no auth required)

## Architecture

- **Backend**: Deno + Oak framework
- **Frontend**: React + TypeScript + Chart.js
- **Database**: SQLite (for data storage)

## Data Flow

1. Backend fetches P2P data from Bybit API
2. Data is stored in local SQLite database
3. Frontend calls `/api/p2p/offers` to get data
4. Chart.js renders the price data as a line graph

## Development

The app is designed to be minimal and straightforward:

- No user management
- No authentication
- Single chart view
- Automatic data refresh

## Environment Setup

Make sure you have:
- Deno installed
- Node.js/npm installed

## Original Complex Features (Removed)

This simplified version removes:
- User authentication and roles
- Admin endpoints
- Complex monitoring features
- Multiple chart types

For the full-featured version, check the git history or see the original documentation.
