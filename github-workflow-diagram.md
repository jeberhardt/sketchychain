# GitHub Workflow Diagram

The following diagram illustrates the recommended Git branching and workflow strategy for the SketchyChain project:

```mermaid
%%{init: { 'theme': 'forest', 'themeVariables': { 'primaryColor': '#597e8d' } } }%%
gitGraph
    commit id: "Initial commit"
    branch develop
    checkout develop
    commit id: "Setup development"
    
    branch feature/new-canvas-tools
    checkout feature/new-canvas-tools
    commit id: "Add brush tool"
    commit id: "Add shape tools"
    checkout develop
    merge feature/new-canvas-tools
    
    branch fix/websocket-connection
    checkout fix/websocket-connection
    commit id: "Fix connection timeout"
    checkout develop
    merge fix/websocket-connection
    
    branch feature/user-profiles
    checkout feature/user-profiles
    commit id: "Add user profile page"
    commit id: "Implement avatar uploads"
    
    checkout develop
    merge feature/user-profiles
    
    branch release/v1.0.0
    checkout release/v1.0.0
    commit id: "Version bump"
    commit id: "Update changelog"
    
    checkout main
    merge release/v1.0.0 tag: "v1.0.0"
    
    checkout develop
    merge main
    
    branch feature/export-options
    checkout feature/export-options
    commit id: "Add PNG export"
    commit id: "Add SVG export"
```

## Key Workflows

### Feature Development

```mermaid
flowchart TD
    A[Start] --> B[Create feature branch from develop]
    B --> C[Implement feature]
    C --> D[Push to remote]
    D --> E[Create PR to develop]
    E --> F[Code review]
    F --> G{Approved?}
    G -->|Yes| H[Merge to develop]
    G -->|No| C
    H --> I[Delete feature branch]
```

### Hotfix Process

```mermaid
flowchart TD
    A[Bug identified in production] --> B[Create fix branch from main]
    B --> C[Implement fix]
    C --> D[Push to remote]
    D --> E[Create PR to main]
    E --> F[Code review]
    F --> G{Approved?}
    G -->|No| C
    G -->|Yes| H[Merge to main]
    H --> I[Create release tag]
    I --> J[Merge fix to develop]
```

### Release Process

```mermaid
flowchart TD
    A[Start] --> B[Create release branch from develop]
    B --> C[Version bump & changelog]
    C --> D[Testing & bug fixes]
    D --> E[Create PR to main]
    E --> F{Approved?}
    F -->|No| D
    F -->|Yes| G[Merge to main]
    G --> H[Tag release]
    H --> I[Merge back to develop]
```

## CI/CD Pipeline

```mermaid
flowchart LR
    A[Push to repository] --> B[GitHub Actions]
    B --> C{Branch?}
    C -->|feature/*| D[Run tests & lint]
    C -->|develop| E[Deploy to staging]
    C -->|main| F[Deploy to production]
    D --> G{Pass?}
    G -->|Yes| H[Ready for PR]
    G -->|No| I[Fix issues]
    I --> A
    E --> J[Integration testing]
    F --> K[Monitoring]