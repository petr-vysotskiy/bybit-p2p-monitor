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

## 🏗️ Architecture

### Backend
- **Runtime**: Deno with Oak framework
- **Database**: DuckDB for high-performance analytics and data persistence
- **API**: RESTful endpoints with CORS support
- **Background Jobs**: Automated P2P data fetching with configurable intervals

### Frontend
- **Framework**: React 19 with TypeScript
- **Build Tool**: Vite for fast development and building
- **Charts**: Chart.js and Visx for data visualization
- **Routing**: React Router for navigation
- **Styling**: Modern responsive CSS

## 📦 Installation & Setup

### Prerequisites

- [Deno](https://deno.land/) (latest version)
- [Node.js](https://nodejs.org/) (for frontend dependencies)
- [Docker](https://docker.com/) (optional, for containerized deployment)

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
cd frontend
npm install
npm run dev
```

### Production Deployment

#### Using Docker Compose (Recommended)

```bash
# Start the full stack with automated data collection
docker-compose up -d

# For development with Docker
docker-compose -f docker-compose.dev.yml up
```

#### Manual Production Build

```bash
# Build frontend
cd frontend
npm run build

# Start backend in production mode
deno task start
```

## 🔧 Available Scripts

### Backend (Deno Tasks)
- `deno task start` - Start production server
- `deno task dev:backend` - Start backend with hot reload
- `deno task check` - Run formatting, linting, and type checking
- `deno task dev` - Start both backend and frontend

### Frontend (NPM Scripts)
- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint

## 📡 API Endpoints

### Health & Status
- `GET /api/p2p/health` - Service health check

### P2P Data
- `GET /api/p2p/offers` - Get P2P offers
  - Query params: `limit` (default: 100)
- Additional endpoints available in the routers directory

## 🐳 Docker Configuration

The project includes multiple Docker configurations:

### Services
- **deno-rest**: Main backend API server
- **p2p-cron**: Background service for automated data fetching

### Environment Variables
- `FETCH_INTERVAL`: Data fetching interval in minutes (default: 5)
- `API_URL`: Backend API URL for cron service

## 📁 Project Structure

```
bybit-p2p-monitor/
├── app.ts                 # Main application entry point
├── controllers/           # API route controllers
├── services/             # Business logic services
├── models/               # Data models and database schemas
├── routers/              # API route definitions
├── middlewares/          # Express/Oak middlewares
├── config/               # Configuration files
├── db/                   # Database utilities and migrations
├── scripts/              # Utility scripts
├── tests/                # Test files
├── frontend/             # React frontend application
│   ├── src/              # Frontend source code
│   ├── package.json      # Frontend dependencies
│   └── vite.config.ts    # Vite configuration
├── docker-compose.yml    # Production Docker setup
├── docker-compose.dev.yml # Development Docker setup
├── Dockerfile            # Backend container definition
├── Dockerfile.cron       # Cron service container
├── deno.json             # Deno configuration and dependencies
└── start_dev.sh          # Development startup script
```

## 🔄 Data Flow

1. **Data Collection**: Cron service periodically fetches P2P data from Bybit API
2. **Data Storage**: Raw data is processed and stored in DuckDB database
3. **API Layer**: Backend exposes RESTful endpoints for data access
4. **Visualization**: Frontend fetches data and renders interactive charts
5. **Real-time Updates**: Automatic refresh ensures latest data is displayed

## 🧪 Testing

```bash
# Run tests
./run_tests.sh

# Manual testing with Deno
deno test --allow-all
```

## 🛠️ Development

### Code Quality
- ESLint for JavaScript/TypeScript linting
- Deno's built-in formatter and linter
- TypeScript for type safety
- Comprehensive error handling

### Hot Reload
- Backend: Automatic restart on file changes
- Frontend: Vite HMR for instant updates

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
