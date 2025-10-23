# Sketchy Chain

A collaborative web application that allows multiple users to create and modify P5.js sketches through AI-processed text prompts. The application integrates real-time collaboration, version history tracking, and automatic code commits to GitHub.

## Project Structure

The project is organized as a monorepo with the following components:

```
sketchychain/
├── frontend/           # React.js frontend application
├── backend/            # Express API server
├── websocket/          # Socket.IO real-time server
├── ai-worker/          # AI prompt processing worker
└── docker-compose.yml  # Docker Compose configuration
```

### Frontend

The React.js frontend application that provides the user interface for creating, viewing, and collaborating on P5.js sketches.

Key components:
- P5Canvas: Renders P5.js sketches
- PromptInput: Interface for submitting text prompts
- HistoryViewer: Browse sketch version history
- ActiveUsers: Show who's currently viewing/editing the sketch

### Backend

The Express API server that handles sketch management, prompt submission, and version control.

Key features:
- RESTful API for sketch management
- Prompt validation and processing
- Version history tracking
- GitHub integration for code persistence

### WebSocket

The Socket.IO server that enables real-time collaboration and updates.

Key features:
- Room-based collaboration
- Real-time event broadcasting
- User presence tracking
- Activity indicators

### AI Worker

The worker service that processes prompts and generates P5.js code modifications.

Key features:
- AI service integration
- Code validation and sanitization
- Content moderation
- GitHub commit integration

## Technologies Used

- **Frontend**: React.js, P5.js, Socket.IO client
- **Backend**: Node.js, Express, MongoDB, Redis
- **Real-time**: Socket.IO, Redis adapter
- **AI**: OpenAI API (configurable to use other providers)
- **DevOps**: Docker, Docker Compose

## Getting Started

### Prerequisites

- Docker and Docker Compose
- Node.js 16+ (for local development)
- MongoDB (or use the Docker Compose configuration)
- Redis (or use the Docker Compose configuration)
- API keys for:
  - AI service (e.g., OpenAI)
  - GitHub (for repository integration)

### Environment Setup

Create `.env` files for each service:

#### Backend `.env`

```
NODE_ENV=development
PORT=4000
MONGODB_URI=mongodb://mongodb:27017/sketchychain
REDIS_URI=redis://redis:6379
WS_SERVICE_URL=http://websocket:4001
GITHUB_TOKEN=your-github-token
GITHUB_USERNAME=your-github-username
AI_SERVICE_KEY=your-ai-service-key
CORS_ORIGINS=http://localhost:3000
```

#### WebSocket `.env`

```
NODE_ENV=development
PORT=4001
REDIS_URI=redis://redis:6379
CORS_ORIGINS=http://localhost:3000
```

#### AI Worker `.env`

```
NODE_ENV=development
MONGODB_URI=mongodb://mongodb:27017/sketchychain
REDIS_URI=redis://redis:6379
AI_SERVICE_KEY=your-ai-service-key
GITHUB_TOKEN=your-github-token
GITHUB_USERNAME=your-github-username
```

### Running with Docker

Start the entire application stack:

```bash
docker-compose up
```

Or start individual services:

```bash
# Frontend
docker-compose up frontend

# Backend
docker-compose up backend

# WebSocket
docker-compose up websocket

# AI Worker
docker-compose up ai-worker
```

### Running Locally (Development)

Install dependencies in the root directory and each service:

```bash
npm install
```

Start each service:

```bash
# Frontend
cd frontend && npm run dev

# Backend
cd backend && npm run dev

# WebSocket
cd websocket && npm run dev

# AI Worker
cd ai-worker && npm run dev
```

## Development Workflow

1. The frontend runs on http://localhost:3000
2. The backend API is available at http://localhost:4000
3. The WebSocket server runs on http://localhost:4001
4. The AI Worker runs in the background processing prompts

## Features

- **Collaborative Editing**: Multiple users can work on the same sketch in real-time
- **AI-powered Code Generation**: Natural language prompts are transformed into P5.js code
- **Version History**: Browse through all changes made to a sketch
- **GitHub Integration**: Automatic code commits for version control and persistence
- **Content Moderation**: Filtering of inappropriate or malicious prompts
- **Code Sanitization**: Ensuring generated code is safe and valid

## Architecture

The application follows a microservices architecture:

- **Frontend**: React SPA communicating with backend via REST API and WebSockets
- **Backend API**: Stateless service handling CRUD operations and business logic
- **WebSocket Server**: Handles real-time communication and event broadcasting
- **AI Worker**: Processes prompts asynchronously using a queue
- **Shared Data Layer**: MongoDB for persistent storage, Redis for caching and pub/sub

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is licensed under the MIT License - see the LICENSE file for details.