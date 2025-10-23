# API Endpoints

This document outlines the API endpoints for the Sketchy Chain application. The application uses a combination of REST API endpoints for CRUD operations and WebSocket connections for real-time updates.

## REST API Endpoints

All REST endpoints are prefixed with `/api/v1/` to allow for future API versioning.

### Sketch Management

#### Create a New Sketch

```
POST /api/v1/sketches
```

Creates a new P5.js sketch.

**Request Body:**
```json
{
  "title": "My Amazing Sketch",
  "description": "A collaborative sketch about...",
  "settings": {
    "canvasWidth": 800,
    "canvasHeight": 600,
    "frameRate": 60,
    "isPublic": true,
    "allowAnonymous": true
  },
  "baseTemplate": "function setup() { createCanvas(800, 600); }\n\nfunction draw() { background(220); }",
  "tags": ["art", "interactive"]
}
```

**Response (201 Created):**
```json
{
  "id": "60f7a9b8c9e4d42b3c5a2e1f",
  "title": "My Amazing Sketch",
  "description": "A collaborative sketch about...",
  "created": "2025-10-18T22:10:15.123Z",
  "settings": {
    "canvasWidth": 800,
    "canvasHeight": 600,
    "frameRate": 60,
    "isPublic": true,
    "allowAnonymous": true
  },
  "currentCode": "function setup() { createCanvas(800, 600); }\n\nfunction draw() { background(220); }",
  "baseTemplate": "function setup() { createCanvas(800, 600); }\n\nfunction draw() { background(220); }",
  "repository": {
    "owner": "ai-prompt-designer",
    "name": "sketch-60f7a9b8c9e4d42b3c5a2e1f",
    "branch": "main",
    "path": "sketch.js"
  },
  "tags": ["art", "interactive"]
}
```

#### Get Sketch Details

```
GET /api/v1/sketches/:sketchId
```

Retrieves details about a specific sketch.

**Response (200 OK):**
```json
{
  "id": "60f7a9b8c9e4d42b3c5a2e1f",
  "title": "My Amazing Sketch",
  "description": "A collaborative sketch about...",
  "created": {
    "timestamp": "2025-10-18T22:10:15.123Z",
    "ipAddress": "192.168.1.1"
  },
  "lastModified": {
    "timestamp": "2025-10-18T22:15:30.456Z",
    "promptId": "60f7b1c8c9e4d42b3c5a2e20"
  },
  "statistics": {
    "promptCount": 3,
    "viewCount": 12,
    "contributorCount": 2,
    "lastActivity": "2025-10-18T22:15:30.456Z"
  },
  "settings": {
    "canvasWidth": 800,
    "canvasHeight": 600,
    "frameRate": 60,
    "isPublic": true,
    "allowAnonymous": true
  },
  "currentCode": "function setup() { createCanvas(800, 600); }\n\nfunction draw() { background(100); ellipse(400, 300, 100, 100); }",
  "repository": {
    "owner": "ai-prompt-designer",
    "name": "sketch-60f7a9b8c9e4d42b3c5a2e1f",
    "branch": "main",
    "path": "sketch.js"
  },
  "tags": ["art", "interactive"]
}
```

#### List Sketches

```
GET /api/v1/sketches
```

Retrieves a list of available sketches with pagination and filtering options.

**Query Parameters:**
- `page`: Page number (default: 1)
- `limit`: Number of results per page (default: 20, max: 100)
- `sort`: Sorting field (default: "lastModified", options: "created", "title", "promptCount", "viewCount")
- `order`: Sort order (default: "desc", options: "asc", "desc")
- `tags`: Filter by tags (comma-separated list)
- `search`: Search term for title and description

**Response (200 OK):**
```json
{
  "sketches": [
    {
      "id": "60f7a9b8c9e4d42b3c5a2e1f",
      "title": "My Amazing Sketch",
      "description": "A collaborative sketch about...",
      "created": "2025-10-18T22:10:15.123Z",
      "lastModified": "2025-10-18T22:15:30.456Z",
      "statistics": {
        "promptCount": 3,
        "viewCount": 12,
        "contributorCount": 2
      },
      "thumbnail": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAA...",
      "tags": ["art", "interactive"]
    },
    // ... more sketches
  ],
  "pagination": {
    "total": 42,
    "page": 1,
    "limit": 20,
    "pages": 3
  }
}
```

#### Update Sketch

```
PATCH /api/v1/sketches/:sketchId
```

Updates sketch metadata (title, description, settings, tags).

**Request Body:**
```json
{
  "title": "Updated Sketch Title",
  "description": "New description...",
  "settings": {
    "isPublic": false
  },
  "tags": ["updated", "tags"]
}
```

**Response (200 OK):**
```json
{
  "id": "60f7a9b8c9e4d42b3c5a2e1f",
  "title": "Updated Sketch Title",
  "description": "New description...",
  "settings": {
    "canvasWidth": 800,
    "canvasHeight": 600,
    "frameRate": 60,
    "isPublic": false,
    "allowAnonymous": true
  },
  "tags": ["updated", "tags"]
}
```

#### Archive Sketch

```
POST /api/v1/sketches/:sketchId/archive
```

Archives a sketch (marks as inactive).

**Response (200 OK):**
```json
{
  "id": "60f7a9b8c9e4d42b3c5a2e1f",
  "title": "My Amazing Sketch",
  "isActive": false,
  "archivedAt": "2025-10-19T10:30:15.123Z"
}
```

### Prompt Management

#### Submit a Prompt

```
POST /api/v1/sketches/:sketchId/prompts
```

Submits a new prompt to modify a sketch.

**Request Body:**
```json
{
  "text": "Add a red circle that moves around the canvas",
  "nickname": "ArtistUser123" // Optional nickname for anonymous users
}
```

**Response (202 Accepted):**
```json
{
  "id": "60f7b1c8c9e4d42b3c5a2e20",
  "sketchId": "60f7a9b8c9e4d42b3c5a2e1f",
  "text": "Add a red circle that moves around the canvas",
  "status": {
    "code": "pending",
    "message": "Prompt received and queued for processing"
  },
  "contributor": {
    "nickname": "ArtistUser123"
  },
  "timestamps": {
    "submitted": "2025-10-18T22:15:20.123Z"
  }
}
```

#### Get Prompt Status

```
GET /api/v1/prompts/:promptId
```

Checks the status of a specific prompt.

**Response (200 OK):**
```json
{
  "id": "60f7b1c8c9e4d42b3c5a2e20",
  "sketchId": "60f7a9b8c9e4d42b3c5a2e1f",
  "text": "Add a red circle that moves around the canvas",
  "status": {
    "code": "completed",
    "message": "Prompt successfully processed and applied"
  },
  "contributor": {
    "nickname": "ArtistUser123"
  },
  "timestamps": {
    "submitted": "2025-10-18T22:15:20.123Z",
    "processed": "2025-10-18T22:15:28.456Z",
    "applied": "2025-10-18T22:15:30.456Z"
  },
  "codeChanges": {
    "diff": "--- Original\n+++ Modified\n@@ -1,5 +1,9 @@\n function setup() { \n   createCanvas(800, 600); \n+  x = width/2;\n+  y = height/2;\n }\n \n function draw() { \n   background(220); \n+  fill(255, 0, 0);\n+  ellipse(x, y, 50, 50);\n+  x = (x + random(-5, 5)) % width;\n+  y = (y + random(-5, 5)) % height;\n }"
  },
  "commit": {
    "sha": "8f7d3c9b5a2e1f4d6c8b7a9",
    "url": "https://github.com/ai-prompt-designer/sketch-60f7a9b8c9e4d42b3c5a2e1f/commit/8f7d3c9b5a2e1f4d6c8b7a9"
  },
  "metadata": {
    "processingTime": 8333,
    "aiModel": "gpt-4",
    "aiTokens": 512
  }
}
```

#### List Prompts for a Sketch

```
GET /api/v1/sketches/:sketchId/prompts
```

Retrieves a list of prompts for a specific sketch with pagination.

**Query Parameters:**
- `page`: Page number (default: 1)
- `limit`: Number of results per page (default: 20, max: 100)
- `status`: Filter by status (options: "pending", "processing", "completed", "failed", "rejected")

**Response (200 OK):**
```json
{
  "prompts": [
    {
      "id": "60f7b1c8c9e4d42b3c5a2e20",
      "sketchId": "60f7a9b8c9e4d42b3c5a2e1f",
      "text": "Add a red circle that moves around the canvas",
      "status": {
        "code": "completed"
      },
      "contributor": {
        "nickname": "ArtistUser123"
      },
      "timestamps": {
        "submitted": "2025-10-18T22:15:20.123Z",
        "applied": "2025-10-18T22:15:30.456Z"
      }
    },
    // ... more prompts
  ],
  "pagination": {
    "total": 3,
    "page": 1,
    "limit": 20,
    "pages": 1
  }
}
```

### Version History

#### Get Version History

```
GET /api/v1/sketches/:sketchId/versions
```

Retrieves the version history of a sketch with pagination.

**Query Parameters:**
- `page`: Page number (default: 1)
- `limit`: Number of results per page (default: 20, max: 100)

**Response (200 OK):**
```json
{
  "versions": [
    {
      "id": "60f7b1d8c9e4d42b3c5a2e21",
      "sketchId": "60f7a9b8c9e4d42b3c5a2e1f",
      "promptId": "60f7b1c8c9e4d42b3c5a2e20",
      "sequence": 3,
      "timestamp": "2025-10-18T22:15:30.456Z",
      "contributor": {
        "nickname": "ArtistUser123"
      },
      "promptText": "Add a red circle that moves around the canvas",
      "thumbnail": {
        "dataUrl": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAA...",
        "width": 200,
        "height": 150
      }
    },
    {
      "id": "60f7b0f8c9e4d42b3c5a2e19",
      "sketchId": "60f7a9b8c9e4d42b3c5a2e1f",
      "promptId": "60f7b0e8c9e4d42b3c5a2e18",
      "sequence": 2,
      "timestamp": "2025-10-18T22:12:45.789Z",
      "contributor": {
        "nickname": "CreativeCoder"
      },
      "promptText": "Make the background grey",
      "thumbnail": {
        "dataUrl": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAA...",
        "width": 200,
        "height": 150
      }
    },
    {
      "id": "60f7a9c8c9e4d42b3c5a2e17",
      "sketchId": "60f7a9b8c9e4d42b3c5a2e1f",
      "promptId": null,
      "sequence": 1,
      "timestamp": "2025-10-18T22:10:15.123Z",
      "contributor": {
        "nickname": "System"
      },
      "promptText": "Initial sketch creation",
      "thumbnail": {
        "dataUrl": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAA...",
        "width": 200,
        "height": 150
      }
    }
  ],
  "pagination": {
    "total": 3,
    "page": 1,
    "limit": 20,
    "pages": 1
  }
}
```

#### Get Specific Version

```
GET /api/v1/sketches/:sketchId/versions/:sequence
```

Retrieves a specific version of a sketch by sequence number.

**Response (200 OK):**
```json
{
  "id": "60f7b1d8c9e4d42b3c5a2e21",
  "sketchId": "60f7a9b8c9e4d42b3c5a2e1f",
  "promptId": "60f7b1c8c9e4d42b3c5a2e20",
  "sequence": 3,
  "code": "function setup() { \n  createCanvas(800, 600);\n  x = width/2;\n  y = height/2;\n}\n\nfunction draw() { \n  background(220);\n  fill(255, 0, 0);\n  ellipse(x, y, 50, 50);\n  x = (x + random(-5, 5)) % width;\n  y = (y + random(-5, 5)) % height;\n}",
  "timestamp": "2025-10-18T22:15:30.456Z",
  "contributor": {
    "nickname": "ArtistUser123"
  },
  "promptText": "Add a red circle that moves around the canvas",
  "thumbnail": {
    "dataUrl": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAA...",
    "width": 200,
    "height": 150
  },
  "commit": {
    "sha": "8f7d3c9b5a2e1f4d6c8b7a9",
    "url": "https://github.com/ai-prompt-designer/sketch-60f7a9b8c9e4d42b3c5a2e1f/commit/8f7d3c9b5a2e1f4d6c8b7a9"
  }
}
```

### Session Management

#### Start Session

```
POST /api/v1/sessions
```

Starts a new session for the user (anonymous or authenticated).

**Request Body:**
```json
{
  "nickname": "CreativeCoder123", // Optional nickname for anonymous users
  "userAgent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/97.0.4692.71 Safari/537.36"
}
```

**Response (201 Created):**
```json
{
  "sessionId": "1e2c3b4a5d6e7f8g9h0i",
  "nickname": "CreativeCoder123",
  "created": "2025-10-18T22:00:00.000Z"
}
```

#### Update Session

```
PATCH /api/v1/sessions/:sessionId
```

Updates session information.

**Request Body:**
```json
{
  "nickname": "NewNickname",
  "currentSketch": "60f7a9b8c9e4d42b3c5a2e1f"
}
```

**Response (200 OK):**
```json
{
  "sessionId": "1e2c3b4a5d6e7f8g9h0i",
  "nickname": "NewNickname",
  "currentSketch": "60f7a9b8c9e4d42b3c5a2e1f",
  "lastActive": "2025-10-18T22:20:00.000Z"
}
```

## WebSocket API

The application uses WebSockets for real-time communication. The WebSocket server is available at `/ws`.

### Connection Establishment

Connect to the WebSocket server with the session ID as a query parameter:

```
ws://example.com/ws?sessionId=1e2c3b4a5d6e7f8g9h0i
```

### Room Subscription

After connecting, clients must subscribe to one or more sketch rooms to receive updates.

#### Subscribe to Sketch Room

```json
{
  "type": "subscribe",
  "room": "sketch:60f7a9b8c9e4d42b3c5a2e1f"
}
```

#### Unsubscribe from Sketch Room

```json
{
  "type": "unsubscribe",
  "room": "sketch:60f7a9b8c9e4d42b3c5a2e1f"
}
```

### Events

#### Prompt Submitted Event

Sent when a new prompt is submitted:

```json
{
  "type": "prompt:submitted",
  "data": {
    "promptId": "60f7b1c8c9e4d42b3c5a2e20",
    "sketchId": "60f7a9b8c9e4d42b3c5a2e1f",
    "text": "Add a red circle that moves around the canvas",
    "contributor": {
      "nickname": "ArtistUser123"
    },
    "timestamp": "2025-10-18T22:15:20.123Z"
  }
}
```

#### Prompt Status Update Event

Sent when a prompt's status changes:

```json
{
  "type": "prompt:status_update",
  "data": {
    "promptId": "60f7b1c8c9e4d42b3c5a2e20",
    "sketchId": "60f7a9b8c9e4d42b3c5a2e1f",
    "status": {
      "code": "processing",
      "message": "Processing prompt with AI"
    },
    "timestamp": "2025-10-18T22:15:22.456Z"
  }
}
```

#### Sketch Updated Event

Sent when a sketch is updated with new code:

```json
{
  "type": "sketch:updated",
  "data": {
    "sketchId": "60f7a9b8c9e4d42b3c5a2e1f",
    "promptId": "60f7b1c8c9e4d42b3c5a2e20",
    "versionId": "60f7b1d8c9e4d42b3c5a2e21",
    "sequence": 3,
    "code": "function setup() { \n  createCanvas(800, 600);\n  x = width/2;\n  y = height/2;\n}\n\nfunction draw() { \n  background(220);\n  fill(255, 0, 0);\n  ellipse(x, y, 50, 50);\n  x = (x + random(-5, 5)) % width;\n  y = (y + random(-5, 5)) % height;\n}",
    "contributor": {
      "nickname": "ArtistUser123"
    },
    "promptText": "Add a red circle that moves around the canvas",
    "timestamp": "2025-10-18T22:15:30.456Z"
  }
}
```

#### User Presence Event

Sent when a user joins or leaves a sketch room:

```json
{
  "type": "presence:update",
  "data": {
    "sketchId": "60f7a9b8c9e4d42b3c5a2e1f",
    "event": "join", // or "leave"
    "user": {
      "sessionId": "1e2c3b4a5d6e7f8g9h0i",
      "nickname": "CreativeCoder123"
    },
    "timestamp": "2025-10-18T22:25:00.000Z",
    "activeUsers": [
      {
        "sessionId": "1e2c3b4a5d6e7f8g9h0i",
        "nickname": "CreativeCoder123"
      },
      {
        "sessionId": "2f3d4c5b6a7e8g9h0i1j",
        "nickname": "ArtistUser123"
      }
    ]
  }
}
```

#### Error Event

Sent when an error occurs:

```json
{
  "type": "error",
  "data": {
    "code": "invalid_request",
    "message": "Invalid request format",
    "requestId": "req-1e2c3b4a5d6e7f"
  }
}
```

### Client Messages

#### Heartbeat

Clients should send a heartbeat message every 30 seconds to maintain the connection:

```json
{
  "type": "heartbeat"
}
```

#### User Activity

Clients can send activity updates to indicate the user is actively viewing or interacting with a sketch:

```json
{
  "type": "activity",
  "data": {
    "sketchId": "60f7a9b8c9e4d42b3c5a2e1f",
    "action": "viewing" // or "typing"
  }
}
```

## Error Handling

All API endpoints follow a standard error response format:

```json
{
  "error": {
    "code": "error_code",
    "message": "Human-readable error message",
    "details": { /* Optional additional details */ }
  },
  "requestId": "req-1e2c3b4a5d6e7f"
}
```

Common error codes:

- `invalid_request`: The request format or parameters are invalid
- `not_found`: The requested resource was not found
- `unauthorized`: Authentication is required or failed
- `forbidden`: The action is not allowed
- `rate_limited`: Too many requests from this client
- `validation_error`: The submitted data failed validation
- `ai_service_error`: Error occurred with the AI service
- `github_service_error`: Error occurred with the GitHub service
- `server_error`: An unexpected error occurred on the server

## Rate Limiting

All API endpoints are subject to rate limiting:

- Anonymous users: 20 requests per minute
- Registered users: 60 requests per minute
- Prompt submissions: 5 per minute for anonymous users, 10 per minute for registered users

Rate limit headers are included in all responses:

```
X-RateLimit-Limit: 60
X-RateLimit-Remaining: 58
X-RateLimit-Reset: 1634601600
```

## API Versioning

The API uses a versioning scheme in the URL path (`/api/v1/`). Future versions may be introduced as needed, with appropriate deprecation notices for older versions.