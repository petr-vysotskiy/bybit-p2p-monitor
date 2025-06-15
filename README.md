# Bybit P2P Monitor

A comprehensive web application that monitors and visualizes P2P trading offers from Bybit in real-time with interactive charts and analytics.

## 🚀 Features

- **Real-time Data Monitoring** - Continuous fetching of P2P offers from Bybit API
- **Interactive Charts** - Beautiful visualizations using Chart.js and Visx
- **Responsive Design** - Works seamlessly on desktop and mobile devices
- **RESTful API** - Well-structured backend with comprehensive endpoints
- **Docker Support** - Easy deployment with Docker and Docker Compose
- **Automated Data Collection** - Background cron jobs for continuous data updates
- **TypeScript Support** - Full TypeScript implementation for better code quality
- **Pure Deno Stack** - Runs entirely on Deno runtime without Node.js dependency

## 🏗️ Architecture

### Backend
- **Runtime**: Deno with Oak framework
- **Database**: DuckDB for high-performance analytics and data persistence
- **API**: RESTful endpoints with CORS support
- **Background Jobs**: Automated P2P data fetching with configurable intervals
- **Static Serving**: Production frontend served directly by Deno

### Frontend
- **Framework**: React 19 with TypeScript
- **Build Tool**: Vite (via Deno's npm compatibility)
- **Charts**: Chart.js and Visx for data visualization
- **Routing**: React Router for navigation
- **Styling**: Modern responsive CSS
- **Runtime**: Built and served using pure Deno (no Node.js required)

## 📦 Installation & Setup

### Prerequisites

- [Deno](https://deno.land/) (version 2.1.9 or later)
- [Docker](https://docker.com/) (optional, for containerized deployment)

**Note**: Node.js is no longer required! The entire stack runs on Deno.

### Development Setup

#### Option 1: Quick Start (Recommended)

```bash
# Clone the repository
git clone <repository-url>
cd bybit-p2p-monitor

# Start both backend and frontend in development mode
./start_dev.sh
```

This will start:
- Backend server on `http://localhost:9000`
- Frontend development server on `http://localhost:5173`

#### Option 2: Manual Setup

```bash
# Start Backend
deno task dev:backend
# or
deno run --allow-read --allow-write --allow-net --allow-env --allow-ffi --node-modules-dir=auto --watch app.ts

# Start Frontend (in a new terminal)
deno task dev:frontend
```

### Production Deployment

#### Using Docker Compose (Recommended)

```bash
# Start the full stack with automated data collection
docker compose up -d

# For development with Docker
docker compose -f docker-compose.dev.yml up
```

The frontend will be accessible at `http://localhost:9000` (served by the Deno backend).

#### Manual Production Build

```bash
# Build frontend using Deno
deno task frontend:build

# Start backend in production mode (includes serving the frontend)
deno task start
```

## 🔧 Available Scripts

### Deno Tasks
- `deno task start` - Start production server (serves both API and frontend)
- `deno task dev:backend` - Start backend with hot reload
- `deno task dev:frontend` - Start frontend development server
- `deno task dev` - Start both backend and frontend
- `deno task frontend:build` - Build frontend for production using Deno
- `deno task frontend:preview` - Preview production frontend build
- `deno task check` - Run formatting, linting, and type checking

## 📡 API Endpoints

### Health & Status
- `GET /api/p2p/health` - Service health check

### P2P Data
- `GET /api/p2p/offers` - Get P2P offers
  - Query params: `limit` (default: 100)
- `GET /api/p2p/aggregations/:tokenId/:currencyId` - Get price aggregations (requires auth)
- `GET /api/p2p/summary/:tokenId/:currencyId` - Get market summary (requires auth)
- `POST /api/p2p/fetch` - Manually trigger data fetch
- `DELETE /api/p2p/cleanup` - Cleanup old data (admin only)

### Frontend
- `GET /` - React application (production)
- `GET /assets/*` - Static assets (CSS, JS, images)

## 🐳 Docker Configuration

The project includes multiple Docker configurations:

### Services
- **deno-rest**: Main backend API server and frontend host
- **p2p-cron**: Background service for automated data fetching

### Environment Variables
- `ENV`: Environment mode (production/development)
- `PORT`: Server port (default: 9000)
- `FETCH_INTERVAL`: Data fetching interval in seconds (default: 5)
- `API_URL`: Backend API URL for cron service (`http://deno-rest:9000`)

## 📁 Project Structure

```
bybit-p2p-monitor/
├── app.ts                 # Main application entry point
├── controllers/           # API route controllers
├── services/             # Business logic services
├── models/               # Data models and database schemas
├── routers/              # API route definitions
├── middlewares/          # Oak middlewares
├── config/               # Configuration files
├── db/                   # Database utilities and migrations
├── scripts/              # Utility scripts
├── tests/                # Test files
├── frontend/             # React frontend application
│   ├── src/              # Frontend source code
│   ├── dist/             # Built frontend files (generated)
│   ├── package.json      # Frontend dependencies metadata
│   └── vite.config.ts    # Vite configuration
├── docker-compose.yml    # Production Docker setup
├── docker-compose.dev.yml # Development Docker setup
├── Dockerfile            # Backend + Frontend container definition
├── Dockerfile.cron       # Cron service container
├── .dockerignore         # Docker ignore patterns
├── deno.json             # Deno configuration and dependencies
└── start_dev.sh          # Development startup script
```

## 🔄 Data Flow

1. **Data Collection**: Cron service periodically fetches P2P data from Bybit API
2. **Data Storage**: Raw data is processed and stored in DuckDB database
3. **API Layer**: Backend exposes RESTful endpoints for data access
4. **Static Serving**: Frontend is built with Vite and served by Deno in production
5. **Visualization**: Frontend fetches data and renders interactive charts
6. **Real-time Updates**: Automatic refresh ensures latest data is displayed

## 🧪 Testing

```bash
# Run tests
./run_tests.sh

# Manual testing with Deno
deno test --allow-all
```

## 🛠️ Development

### Pure Deno Architecture
- **No Node.js required**: Entire stack runs on Deno runtime
- **npm compatibility**: Frontend dependencies handled via Deno's npm compatibility layer
- **Unified tooling**: Single runtime for both backend and frontend building
- **TypeScript native**: Full TypeScript support without additional configuration

### Code Quality
- ESLint for JavaScript/TypeScript linting
- Deno's built-in formatter and linter
- TypeScript for type safety
- Comprehensive error handling

### Hot Reload
- Backend: Automatic restart on file changes
- Frontend: Vite HMR for instant updates in development

## 🚀 Key Technical Features

### Deno-First Frontend Building
- Vite runs through Deno's npm compatibility (`npm:vite@^6.3.5`)
- TypeScript compilation via Deno (`npm:typescript@~5.8.3`)
- No Node.js installation required
- Build command: `deno task frontend:build`

### Production Architecture
- Single Docker container serves both API and static files
- Optimized routing for SPA (Single Page Application)
- Efficient static asset serving with proper caching headers
- Environment-based configuration (development vs production)

## 📄 License

This project is licensed under the terms specified in the [LICENSE](LICENSE) file.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Run tests and ensure code quality
5. Submit a pull request

## 📞 Support

For issues and questions, please check the existing issues or create a new one in the project repository.

---

**Note**: This project demonstrates a modern approach to web development using Deno as the primary runtime for both backend services and frontend building, eliminating the need for Node.js while maintaining full compatibility with the npm ecosystem.
