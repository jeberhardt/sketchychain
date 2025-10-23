# SketchyChain - System Architecture

## Overview

SketchyChain is a collaborative web application that allows users to modify P5.js sketches through AI-processed text prompts. The system architecture is designed to handle real-time collaboration, persistent storage of sketches and their history, and secure integration with AI services and GitHub.

```mermaid
graph TD
    User[User Browser] -->|Interacts with| Frontend[Frontend Application]
    Frontend -->|WebSocket| RealTime[Real-time Service]
    Frontend -->|REST API| Backend[Backend API Service]
    RealTime <-->|Event Streaming| Backend
    Backend -->|Processes Prompts| AI[AI Service]
    Backend -->|Stores/Retrieves Data| DB[(Database)]
    Backend -->|Commits Changes| GitHub[GitHub API]
    
    subgraph "Client-Side"
        Frontend
        User
    end
    
    subgraph "Server-Side"
        Backend
        RealTime
        DB
        AI
        GitHub
    end
```

## Component Architecture

### Frontend Application

The frontend is a single-page application that handles rendering the P5.js sketch, collecting user prompts, and displaying the history of changes.

```mermaid
graph TD
    App[Application Container] --> Canvas[P5.js Canvas Component]
    App --> Prompt[Prompt Input Component]
    App --> History[History Viewer Component]
    App --> Selector[Sketch Selector Component]
    App --> StatusBar[Status Bar Component]
    
    Canvas -->|Renders| P5Instance[P5.js Instance]
    P5Instance -->|Executes| DrawingCode[User Drawing Code]
    
    Prompt -->|Submits| WebSocketService[WebSocket Service]
    WebSocketService -->|Updates| App
    
    History -->|Fetches| RestService[REST API Service]
    Selector -->|Fetches| RestService
    
    RestService -->|API Calls| Backend[Backend API]
    WebSocketService -->|Real-time Events| RealTime[Real-time Service]
```

**Key Frontend Components:**

1. **P5.js Canvas Component**
   - Manages the P5.js instance
   - Handles rendering of the sketch
   - Isolates drawing code from application code

2. **Prompt Input Component**
   - Provides interface for entering text prompts
   - Shows processing status and feedback
   - Implements input validation

3. **History Viewer Component**
   - Displays timeline of prompts and changes
   - Enables navigation through sketch history
   - Shows visual previews of past states

4. **Sketch Selector Component**
   - Lists available sketches
   - Allows creation of new sketches
   - Provides filtering and sorting options

5. **WebSocket Service**
   - Manages real-time connections
   - Handles event subscriptions
   - Implements reconnection logic

### Backend Architecture

The backend consists of a Node.js API service, a real-time WebSocket service, and connections to external services for AI processing and GitHub integration.

```mermaid
graph TD
    API[API Service] --> Routes[API Routes]
    
    Routes --> SketchController[Sketch Controller]
    Routes --> PromptController[Prompt Controller]
    Routes --> HistoryController[History Controller]
    
    SketchController --> SketchService[Sketch Service]
    PromptController --> PromptService[Prompt Service]
    HistoryController --> HistoryService[History Service]
    
    PromptService --> AIService[AI Service]
    PromptService --> SecurityService[Security Service]
    SketchService --> GitHubService[GitHub Service]
    
    AIService -->|External API| AI[AI Provider]
    GitHubService -->|External API| GitHub[GitHub API]
    
    SketchService --> DB[(Database)]
    PromptService --> DB
    HistoryService --> DB
    
    WebSocket[WebSocket Server] --> EventHandler[Event Handler]
    EventHandler --> PromptService
    EventHandler --> SketchService
```

**Key Backend Components:**

1. **API Service**
   - RESTful endpoints for CRUD operations
   - Request validation and error handling
   - Authentication (for future expansion)

2. **WebSocket Server**
   - Real-time event broadcasting
   - Room-based subscriptions for sketches
   - Connection management

3. **Sketch Service**
   - Manages sketch creation and retrieval
   - Handles code parsing and validation
   - Integrates with GitHub service

4. **Prompt Service**
   - Processes user prompts
   - Coordinates with AI service
   - Manages prompt validation and filtering

5. **History Service**
   - Tracks sketch versions and changes
   - Implements efficient storage and retrieval
   - Provides version comparison functionality

6. **Security Service**
   - Validates and sanitizes user inputs
   - Prevents code injection attacks
   - Implements content moderation

7. **AI Service**
   - Interfaces with external AI providers
   - Formats prompts for optimal processing
   - Parses and validates AI responses

8. **GitHub Service**
   - Manages repository connections
   - Handles commit operations
   - Implements error recovery

## Data Flow

### Prompt Submission Flow

```mermaid
sequenceDiagram
    participant User
    participant Frontend
    participant WebSocket
    participant Backend
    participant AI
    participant DB
    participant GitHub

    User->>Frontend: Submits prompt
    Frontend->>WebSocket: Sends prompt event
    WebSocket->>Backend: Processes prompt request
    Backend->>Backend: Validates prompt
    Backend->>AI: Sends validated prompt
    AI->>Backend: Returns generated code
    Backend->>Backend: Validates generated code
    Backend->>DB: Stores prompt and code
    Backend->>GitHub: Commits code changes
    Backend->>WebSocket: Broadcasts update
    WebSocket->>Frontend: Updates all connected clients
    Frontend->>Frontend: Updates P5.js canvas
    Frontend->>User: Shows success feedback
```

### History Navigation Flow

```mermaid
sequenceDiagram
    participant User
    participant Frontend
    participant Backend
    participant DB

    User->>Frontend: Selects historical point
    Frontend->>Backend: Requests version data
    Backend->>DB: Retrieves historical version
    DB->>Backend: Returns version data
    Backend->>Frontend: Sends historical code
    Frontend->>Frontend: Updates P5.js canvas with historical code
    Frontend->>User: Shows historical state
```

## Technology Stack

### Frontend
- **Framework**: React.js
- **P5.js Integration**: p5.js library with instance mode
- **State Management**: Redux or Context API
- **WebSocket Client**: Socket.IO client
- **UI Components**: Material-UI or similar component library
- **Build Tools**: Webpack, Babel

### Backend
- **Runtime**: Node.js
- **API Framework**: Express.js
- **Real-time Server**: Socket.IO
- **API Documentation**: Swagger/OpenAPI
- **Logging**: Winston or similar

### Database
- **Primary Database**: MongoDB (for flexible schema support)
- **Caching Layer**: Redis (for real-time data and session management)

### External Integrations
- **AI Service**: OpenAI API, Anthropic API, or custom implementation
- **GitHub API**: Official GitHub REST API with OAuth authentication
- **Content Moderation**: TensorFlow.js or external moderation API

### DevOps & Infrastructure
- **Containerization**: Docker
- **Orchestration**: Docker Compose (development), Kubernetes (production)
- **CI/CD**: GitHub Actions
- **Monitoring**: Prometheus, Grafana
- **Hosting**: AWS, Google Cloud, or similar cloud provider

## Security Architecture

```mermaid
graph TD
    Input[User Input] --> InputValidation[Input Validation]
    InputValidation --> ContentModeration[Content Moderation]
    ContentModeration --> AIPrompt[AI Prompt Processing]
    
    AIPrompt --> CodeValidation[Generated Code Validation]
    CodeValidation --> CodeSandbox[Code Sandbox Execution]
    
    CodeSandbox -->|If Safe| CodeIntegration[Code Integration]
    CodeSandbox -->|If Unsafe| RejectionHandler[Rejection Handler]
    
    RejectionHandler --> UserFeedback[User Feedback]
    CodeIntegration --> VersionControl[Version Control]
    
    subgraph "Security Layers"
        InputValidation
        ContentModeration
        CodeValidation
        CodeSandbox
    end
```

## Real-time Collaboration Architecture

```mermaid
graph TD
    Client[Client Browser] -->|WebSocket Connection| WSServer[WebSocket Server]
    WSServer --> RoomManager[Room Manager]
    RoomManager --> SketchRooms[Sketch-specific Rooms]
    
    Client -->|Join Sketch| RoomManager
    Client -->|Submit Prompt| EventProcessor[Event Processor]
    
    EventProcessor --> PromptQueue[Prompt Processing Queue]
    PromptQueue --> PromptWorker[Prompt Worker]
    PromptWorker --> BroadcastService[Broadcast Service]
    
    BroadcastService --> SketchRooms
    SketchRooms --> ConnectedClients[Connected Clients]
```

## Scalability Considerations

The architecture is designed to scale horizontally by:

1. **Stateless API Services**: Multiple instances can be deployed behind a load balancer
2. **Separated WebSocket Servers**: Dedicated for real-time communication, can scale independently
3. **Queue-based Processing**: Prompt processing uses queues to manage load spikes
4. **Database Sharding**: Sketches can be sharded by ID for horizontal scaling
5. **Caching Layer**: Reduces database load for frequently accessed content
6. **CDN Integration**: Static assets and historical sketches can be cached at the edge

```mermaid
graph TD
    LB[Load Balancer] --> ApiInstance1[API Instance 1]
    LB --> ApiInstance2[API Instance 2]
    LB --> ApiInstanceN[API Instance N...]
    
    WSLoadBalancer[WebSocket Load Balancer] --> WSInstance1[WebSocket Instance 1]
    WSLoadBalancer --> WSInstance2[WebSocket Instance 2]
    WSLoadBalancer --> WSInstanceN[WebSocket Instance N...]
    
    ApiInstance1 --> Queue[Message Queue]
    ApiInstance2 --> Queue
    ApiInstanceN --> Queue
    
    Queue --> Worker1[Worker 1]
    Queue --> Worker2[Worker 2]
    Queue --> WorkerN[Worker N...]
    
    Worker1 --> AI[AI Service]
    Worker2 --> AI
    WorkerN --> AI
    
    Worker1 --> DbCluster[(Database Cluster)]
    Worker2 --> DbCluster
    WorkerN --> DbCluster
    
    ApiInstance1 --> Cache[(Redis Cache)]
    ApiInstance2 --> Cache
    ApiInstanceN --> Cache
    
    WSInstance1 --> Cache
    WSInstance2 --> Cache
    WSInstanceN --> Cache
```

## GitHub Integration Architecture

```mermaid
graph TD
    PromptService[Prompt Service] -->|Approved Code Change| GitHubService[GitHub Service]
    
    GitHubService --> AuthManager[Authentication Manager]
    GitHubService --> RepoManager[Repository Manager]
    GitHubService --> CommitManager[Commit Manager]
    
    AuthManager -->|OAuth Token| GitHubAPI[GitHub API]
    RepoManager -->|Repo Operations| GitHubAPI
    CommitManager -->|Create Commits| GitHubAPI
    
    CommitManager --> CommitQueue[Commit Queue]
    CommitQueue --> RetryHandler[Retry Handler]
    
    RetryHandler -->|Retry Failed Commits| GitHubAPI
    RetryHandler -->|Persistent Failures| AlertSystem[Alert System]