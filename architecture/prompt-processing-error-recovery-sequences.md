# Prompt Processing Error Recovery Sequences

This document provides detailed sequence diagrams for handling various error scenarios that can occur during prompt processing in the Sketchy Chain application. For each error scenario, we outline the detection, recovery steps, and final state.

## Table of Contents

1. [Normal Prompt Processing Flow](#normal-prompt-processing-flow)
2. [AI Service Unavailability](#ai-service-unavailability)
3. [Content Moderation Rejection](#content-moderation-rejection)
4. [Code Validation Failure](#code-validation-failure)
5. [GitHub Integration Error](#github-integration-error)
6. [Database Error During Processing](#database-error-during-processing)
7. [WebSocket Communication Failure](#websocket-communication-failure)
8. [Prompt Queue Processing Error](#prompt-queue-processing-error)
9. [Multiple Concurrent Failures](#multiple-concurrent-failures)
10. [Recovery Strategy Matrix](#recovery-strategy-matrix)

## Normal Prompt Processing Flow

This diagram shows the expected flow when everything works correctly:

```mermaid
sequenceDiagram
    participant User
    participant Frontend
    participant WebSocket
    participant Backend
    participant Queue
    participant AIWorker
    participant AIService
    participant Validator
    participant GitHub
    participant DB

    User->>Frontend: Submit Prompt
    Frontend->>WebSocket: Send Prompt Event
    WebSocket->>Backend: Process Prompt Request
    Backend->>DB: Save Prompt (pending)
    Backend->>Queue: Enqueue Prompt
    Backend->>WebSocket: Broadcast Prompt Submission
    WebSocket->>Frontend: Update UI (Prompt Pending)
    
    Queue->>AIWorker: Dequeue Prompt
    AIWorker->>Backend: Get Prompt Details
    Backend->>DB: Retrieve Sketch & Prompt
    Backend->>AIWorker: Return Sketch & Prompt
    
    AIWorker->>Backend: Update Status (processing)
    Backend->>DB: Update Status
    Backend->>WebSocket: Broadcast Status Update
    WebSocket->>Frontend: Update UI (Processing)
    
    AIWorker->>AIService: Send Prompt for Processing
    AIService->>AIWorker: Return Generated Code
    
    AIWorker->>Validator: Validate Generated Code
    Validator->>AIWorker: Code Validation Result
    
    AIWorker->>Backend: Submit Validated Code
    Backend->>DB: Store Code Changes
    Backend->>GitHub: Commit Code Changes
    GitHub->>Backend: Confirm Commit
    
    Backend->>DB: Update Status (completed)
    Backend->>WebSocket: Broadcast Update
    WebSocket->>Frontend: Update UI with Changes
    Frontend->>User: Show Success & Code Changes
```

## AI Service Unavailability

When the AI service is unavailable or returns an error:

```mermaid
sequenceDiagram
    participant User
    participant Frontend
    participant WebSocket
    participant Backend
    participant Queue
    participant AIWorker
    participant AIService
    participant DB

    User->>Frontend: Submit Prompt
    Frontend->>WebSocket: Send Prompt Event
    WebSocket->>Backend: Process Prompt Request
    Backend->>DB: Save Prompt (pending)
    Backend->>Queue: Enqueue Prompt
    Backend->>WebSocket: Broadcast Prompt Submission
    WebSocket->>Frontend: Update UI (Prompt Pending)
    
    Queue->>AIWorker: Dequeue Prompt
    AIWorker->>Backend: Get Prompt Details
    Backend->>DB: Retrieve Sketch & Prompt
    Backend->>AIWorker: Return Sketch & Prompt
    
    AIWorker->>Backend: Update Status (processing)
    Backend->>DB: Update Status
    Backend->>WebSocket: Broadcast Status Update
    WebSocket->>Frontend: Update UI (Processing)
    
    AIWorker->>AIService: Send Prompt for Processing
    AIService-->>AIWorker: Return Error (Service Unavailable)
    
    Note over AIWorker: Implement Retry Logic
    
    AIWorker->>AIWorker: Wait (Exponential Backoff)
    AIWorker->>AIService: Retry Prompt
    AIService-->>AIWorker: Return Error (Still Unavailable)
    
    Note over AIWorker: After Max Retries

    AIWorker->>AIWorker: Try Alternative AI Model/Provider
    AIWorker->>AIService: Send to Alternative Service
    AIService->>AIWorker: Return Generated Code
    
    AIWorker->>Backend: Submit Code & Log Service Switch
    Backend->>DB: Store Code Changes
    Backend->>DB: Update Status (completed with fallback)
    Backend->>WebSocket: Broadcast Update
    WebSocket->>Frontend: Update UI with Changes & Fallback Notice
    Frontend->>User: Show Success with Fallback Notice
```

## Content Moderation Rejection

When content moderation rejects a prompt:

```mermaid
sequenceDiagram
    participant User
    participant Frontend
    participant WebSocket
    participant Backend
    participant Moderation
    participant DB

    User->>Frontend: Submit Prompt
    Frontend->>WebSocket: Send Prompt Event
    WebSocket->>Backend: Process Prompt Request
    
    Backend->>Moderation: Check Prompt Content
    Moderation-->>Backend: Content Rejected (Violation)
    
    Backend->>DB: Save Prompt (rejected)
    Backend->>WebSocket: Broadcast Prompt Rejection
    WebSocket->>Frontend: Update UI (Prompt Rejected)
    Frontend->>User: Show Rejection Reason & Guidelines

    Note over User,Frontend: User Modifies Prompt
    
    User->>Frontend: Submit Modified Prompt
    Frontend->>WebSocket: Send Modified Prompt
    WebSocket->>Backend: Process Modified Prompt
    Backend->>Moderation: Check Modified Content
    Moderation->>Backend: Content Approved
    
    Note over Backend: Continue Normal Flow
```

## Code Validation Failure

When generated code fails validation:

```mermaid
sequenceDiagram
    participant User
    participant Frontend
    participant WebSocket
    participant Backend
    participant Queue
    participant AIWorker
    participant AIService
    participant Validator
    participant DB

    Note over Queue,AIWorker: Starting after AI generates code
    
    AIService->>AIWorker: Return Generated Code
    AIWorker->>Validator: Validate Generated Code
    Validator-->>AIWorker: Validation Failed (Security Issue)
    
    AIWorker->>AIWorker: Log Validation Failure
    
    Note over AIWorker: First Attempt - Retry with Constraints
    
    AIWorker->>AIService: Retry with Additional Constraints
    AIService->>AIWorker: Return New Generated Code
    AIWorker->>Validator: Validate New Code
    Validator-->>AIWorker: Validation Failed Again
    
    Note over AIWorker: Second Attempt - Simplified Prompt
    
    AIWorker->>AIWorker: Simplify Prompt
    AIWorker->>AIService: Submit Simplified Prompt
    AIService->>AIWorker: Return Simplified Code
    AIWorker->>Validator: Validate Simplified Code
    Validator->>AIWorker: Validation Passed
    
    AIWorker->>Backend: Submit Validated Code with Warning
    Backend->>DB: Store Code Changes
    Backend->>DB: Update Status (completed with simplification)
    Backend->>WebSocket: Broadcast Update with Warning
    WebSocket->>Frontend: Update UI with Changes & Warning
    Frontend->>User: Show Success with Simplification Notice
```

## GitHub Integration Error

When GitHub integration fails:

```mermaid
sequenceDiagram
    participant User
    participant Frontend
    participant WebSocket
    participant Backend
    participant DB
    participant GitHub
    participant Retry

    Note over Backend: After code validation success
    
    Backend->>GitHub: Commit Code Changes
    GitHub-->>Backend: Error (Rate Limit Exceeded)
    
    Backend->>Retry: Schedule GitHub Retry
    Backend->>DB: Update Status (waiting for commit)
    Backend->>WebSocket: Broadcast Status Update
    WebSocket->>Frontend: Update UI (Waiting for Commit)
    
    Note over Retry: Wait for Rate Limit Reset
    
    Retry->>Backend: Trigger Retry
    Backend->>GitHub: Retry Commit
    GitHub->>Backend: Confirm Commit
    
    Backend->>DB: Update Status (completed)
    Backend->>WebSocket: Broadcast Update
    WebSocket->>Frontend: Update UI (Complete)
    Frontend->>User: Show Success

    Note over Backend,GitHub: Alternative GitHub Error Scenario
    
    Backend->>GitHub: Commit Code Changes
    GitHub-->>Backend: Error (Authentication)
    
    Backend->>DB: Log GitHub Error
    Backend->>DB: Update Status (completed without commit)
    Backend->>WebSocket: Broadcast Update with Error
    WebSocket->>Frontend: Update UI with Local-Only Notice
    Frontend->>User: Show Success with Local-Only Notice
```

## Database Error During Processing

When database errors occur during processing:

```mermaid
sequenceDiagram
    participant User
    participant Frontend
    participant WebSocket
    participant Backend
    participant Queue
    participant AIWorker
    participant DB
    participant CacheLayer

    Note over AIWorker,Backend: After successful AI processing
    
    AIWorker->>Backend: Submit Validated Code
    Backend->>DB: Store Code Changes
    DB-->>Backend: Database Error (Connection Lost)
    
    Backend->>CacheLayer: Store Changes in Temporary Cache
    Backend->>Backend: Start DB Reconnection Process
    Backend->>WebSocket: Broadcast Processing Delay
    WebSocket->>Frontend: Show Processing Delay Notice
    
    Note over Backend: Database Connection Recovery
    
    Backend->>DB: Retry Connection
    DB->>Backend: Connection Restored
    Backend->>CacheLayer: Retrieve Cached Changes
    Backend->>DB: Store Code Changes
    
    Backend->>DB: Update Status (completed)
    Backend->>WebSocket: Broadcast Update
    WebSocket->>Frontend: Update UI (Complete)
    Frontend->>User: Show Success
```

## WebSocket Communication Failure

When WebSocket connection fails during processing:

```mermaid
sequenceDiagram
    participant User
    participant Frontend
    participant WebSocket
    participant Backend
    participant DB

    Note over Frontend,WebSocket: During Prompt Processing
    
    Backend->>WebSocket: Broadcast Status Update
    WebSocket-->>Frontend: Connection Lost
    
    Frontend->>Frontend: Detect Connection Failure
    Frontend->>Frontend: Start Reconnection Process
    Frontend->>User: Show Connection Issue Notice
    
    Note over Frontend: Reconnection with Exponential Backoff
    
    Frontend->>WebSocket: Reconnection Attempt
    WebSocket->>Frontend: Connection Restored
    
    Frontend->>Backend: Request Current Status (REST API Fallback)
    Backend->>DB: Get Current Status
    Backend->>Frontend: Return Current Status
    Frontend->>WebSocket: Resubscribe to Updates
    
    Note over Frontend,WebSocket: Resume Normal Operation
    
    Backend->>WebSocket: Broadcast Next Update
    WebSocket->>Frontend: Deliver Update
    Frontend->>User: Show Current Status
```

## Prompt Queue Processing Error

When the prompt queue processing fails:

```mermaid
sequenceDiagram
    participant User
    participant Frontend
    participant WebSocket
    participant Backend
    participant Queue
    participant AIWorker
    participant DB
    participant Monitor

    User->>Frontend: Submit Prompt
    Frontend->>WebSocket: Send Prompt Event
    WebSocket->>Backend: Process Prompt Request
    Backend->>DB: Save Prompt (pending)
    Backend->>Queue: Enqueue Prompt
    
    Note over Queue: Queue Processing Failure
    Queue-->>Backend: Queue Error (Connection Lost)
    
    Backend->>Monitor: Report Queue Failure
    Monitor->>Backend: Trigger Recovery Procedure
    Backend->>Queue: Attempt Reconnection
    Queue->>Backend: Reconnection Successful
    
    Backend->>DB: Get Stuck Prompts
    DB->>Backend: Return Pending Prompts
    Backend->>Queue: Re-enqueue Stuck Prompts
    Backend->>WebSocket: Broadcast Recovery Status
    WebSocket->>Frontend: Show Recovery Notice
    
    Note over Queue,AIWorker: Resume Normal Processing
    
    Queue->>AIWorker: Dequeue Prompt
    AIWorker->>Backend: Get Prompt Details
    
    Note over AIWorker: Continue Normal Flow
```

## Multiple Concurrent Failures

Handling scenario with multiple simultaneous failures:

```mermaid
sequenceDiagram
    participant User
    participant Frontend
    participant WebSocket
    participant Backend
    participant Queue
    participant AIWorker
    participant AIService
    participant DB

    User->>Frontend: Submit Prompt
    Frontend->>WebSocket: Send Prompt Event
    WebSocket-->>Backend: Connection Error
    
    Frontend->>Frontend: Detect WebSocket Failure
    Frontend->>Backend: Submit via REST API Fallback
    
    Backend->>DB: Save Prompt (pending)
    DB-->>Backend: Database Error
    
    Backend->>Backend: Log Error to Local Storage
    Backend->>Queue: Enqueue Prompt (with retry)
    
    Note over Backend: Critical System Degradation
    
    Backend->>Backend: Enter Degraded Mode
    Backend->>Frontend: Return Degraded Mode Status
    Frontend->>User: Show System Issues Notice
    
    Note over Backend: Recovery Coordinator Activates
    
    Backend->>DB: Attempt Reconnection
    DB->>Backend: Connection Restored
    Backend->>Backend: Flush Stored Logs
    Backend->>WebSocket: Attempt Reconnection
    WebSocket->>Frontend: Connection Restored
    
    Backend->>Queue: Process Backlogged Items
    Queue->>AIWorker: Process Prompts
    AIWorker->>AIService: Process First Prompt
    AIService->>AIWorker: Return Result
    
    AIWorker->>Backend: Submit Results
    Backend->>DB: Update Database
    Backend->>WebSocket: Broadcast Updates
    WebSocket->>Frontend: Update UI
    Frontend->>User: Show Recovery Complete
```

## Recovery Strategy Matrix

| Error Type | Detection Method | Initial Action | Recovery Strategy | Fallback Option | User Communication |
|------------|------------------|----------------|-------------------|-----------------|-------------------|
| AI Service Unavailable | API Error Response | Retry | Exponential backoff with 3 attempts | Alternative AI model/provider | "We're using an alternative AI model" |
| Content Moderation Rejection | Moderation API response | Reject prompt | Provide specific violation details | Suggest edits to user | "Your prompt wasn't accepted because..." |
| Code Validation Failure | Validation error | Retry with constraints | Simplify prompt and regenerate | Manual review queue | "We simplified your request for security" |
| GitHub Integration Error | GitHub API error | Temporarily store locally | Retry after rate limit reset | Skip GitHub integration | "Changes saved locally only" |
| Database Error | Database exception | Cache in memory/Redis | Reconnect with exponential backoff | Write to fallback store | "Processing your request (temporary delay)" |
| WebSocket Failure | Connection timeout | Reconnect | Exponential backoff reconnection | REST API polling | "Reconnecting to server..." |
| Queue Processing Error | Queue exception | Local processing | Reconnect to queue service | Direct processing | "System recovering, brief delay" |
| Multiple Failures | System monitoring | Degraded mode | Staged recovery sequence | Maintenance mode | "System experiencing issues" |

This matrix provides a quick reference for handling different error types across the prompt processing workflow.