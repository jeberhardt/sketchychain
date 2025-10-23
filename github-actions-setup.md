# GitHub Actions CI/CD Workflows for SketchyChain

This guide provides ready-to-use GitHub Actions workflows for the SketchyChain project to enable continuous integration and deployment.

## Workflow Overview

We recommend setting up these key workflows:

1. **Continuous Integration**: Lint and test code on all branches
2. **Staging Deployment**: Deploy to staging environment from the develop branch
3. **Production Deployment**: Deploy to production from the main branch

## Workflow Files

GitHub Actions workflows are defined in YAML files located in the `.github/workflows/` directory. Create this directory after initializing your repository:

```bash
mkdir -p .github/workflows
```

## 1. Continuous Integration Workflow

Create `.github/workflows/ci.yml`:

```yaml
name: Continuous Integration

on:
  push:
    branches: [ main, develop, feature/**, fix/** ]
  pull_request:
    branches: [ main, develop ]

jobs:
  test:
    runs-on: ubuntu-latest
    
    strategy:
      matrix:
        node-version: [16.x]
    
    services:
      mongodb:
        image: mongo:4.4
        ports:
          - 27017:27017
      redis:
        image: redis:6
        ports:
          - 6379:6379
    
    steps:
    - uses: actions/checkout@v3
    
    - name: Use Node.js ${{ matrix.node-version }}
      uses: actions/setup-node@v3
      with:
        node-version: ${{ matrix.node-version }}
        cache: 'npm'
    
    - name: Install root dependencies
      run: npm ci
    
    - name: Install service dependencies
      run: |
        cd backend && npm ci
        cd ../frontend && npm ci
        cd ../websocket && npm ci
        cd ../ai-worker && npm ci
    
    - name: Lint
      run: npm run lint
    
    - name: Test
      run: npm test
      env:
        MONGODB_URI: mongodb://localhost:27017/test
        REDIS_URI: redis://localhost:6379
        NODE_ENV: test
```

## 2. Staging Deployment Workflow

Create `.github/workflows/deploy-staging.yml`:

```yaml
name: Deploy to Staging

on:
  push:
    branches: [ develop ]

jobs:
  deploy:
    runs-on: ubuntu-latest
    
    steps:
    - uses: actions/checkout@v3
    
    - name: Configure AWS credentials
      uses: aws-actions/configure-aws-credentials@v1
      with:
        aws-access-key-id: ${{ secrets.AWS_ACCESS_KEY_ID }}
        aws-secret-access-key: ${{ secrets.AWS_SECRET_ACCESS_KEY }}
        aws-region: us-east-1
    
    - name: Login to Amazon ECR
      id: login-ecr
      uses: aws-actions/amazon-ecr-login@v1
    
    - name: Build, tag, and push image to Amazon ECR
      env:
        ECR_REGISTRY: ${{ steps.login-ecr.outputs.registry }}
        ECR_REPOSITORY: sketchychain-staging
        IMAGE_TAG: ${{ github.sha }}
      run: |
        # Build and push frontend
        docker build -t $ECR_REGISTRY/$ECR_REPOSITORY/frontend:$IMAGE_TAG -f frontend/Dockerfile.dev ./frontend
        docker push $ECR_REGISTRY/$ECR_REPOSITORY/frontend:$IMAGE_TAG
        
        # Build and push backend
        docker build -t $ECR_REGISTRY/$ECR_REPOSITORY/backend:$IMAGE_TAG -f backend/Dockerfile.dev ./backend
        docker push $ECR_REGISTRY/$ECR_REPOSITORY/backend:$IMAGE_TAG
        
        # Build and push websocket
        docker build -t $ECR_REGISTRY/$ECR_REPOSITORY/websocket:$IMAGE_TAG -f websocket/Dockerfile.dev ./websocket
        docker push $ECR_REGISTRY/$ECR_REPOSITORY/websocket:$IMAGE_TAG
        
        # Build and push ai-worker
        docker build -t $ECR_REGISTRY/$ECR_REPOSITORY/ai-worker:$IMAGE_TAG -f ai-worker/Dockerfile.dev ./ai-worker
        docker push $ECR_REGISTRY/$ECR_REPOSITORY/ai-worker:$IMAGE_TAG
    
    - name: Update Kubernetes deployment
      run: |
        # Update Kubernetes deployment (using kubectl)
        # This step depends on your infrastructure setup
        # Example:
        # kubectl set image deployment/frontend frontend=$ECR_REGISTRY/$ECR_REPOSITORY/frontend:$IMAGE_TAG
```

## 3. Production Deployment Workflow

Create `.github/workflows/deploy-production.yml`:

```yaml
name: Deploy to Production

on:
  push:
    branches: [ main ]

jobs:
  deploy:
    runs-on: ubuntu-latest
    
    steps:
    - uses: actions/checkout@v3
    
    - name: Configure AWS credentials
      uses: aws-actions/configure-aws-credentials@v1
      with:
        aws-access-key-id: ${{ secrets.AWS_ACCESS_KEY_ID }}
        aws-secret-access-key: ${{ secrets.AWS_SECRET_ACCESS_KEY }}
        aws-region: us-east-1
    
    - name: Login to Amazon ECR
      id: login-ecr
      uses: aws-actions/amazon-ecr-login@v1
    
    - name: Build, tag, and push image to Amazon ECR
      env:
        ECR_REGISTRY: ${{ steps.login-ecr.outputs.registry }}
        ECR_REPOSITORY: sketchychain-production
        IMAGE_TAG: ${{ github.sha }}
      run: |
        # Build and push frontend
        docker build -t $ECR_REGISTRY/$ECR_REPOSITORY/frontend:$IMAGE_TAG -f frontend/Dockerfile ./frontend
        docker push $ECR_REGISTRY/$ECR_REPOSITORY/frontend:$IMAGE_TAG
        
        # Build and push backend
        docker build -t $ECR_REGISTRY/$ECR_REPOSITORY/backend:$IMAGE_TAG -f backend/Dockerfile ./backend
        docker push $ECR_REGISTRY/$ECR_REPOSITORY/backend:$IMAGE_TAG
        
        # Build and push websocket
        docker build -t $ECR_REGISTRY/$ECR_REPOSITORY/websocket:$IMAGE_TAG -f websocket/Dockerfile ./websocket
        docker push $ECR_REGISTRY/$ECR_REPOSITORY/websocket:$IMAGE_TAG
        
        # Build and push ai-worker
        docker build -t $ECR_REGISTRY/$ECR_REPOSITORY/ai-worker:$IMAGE_TAG -f ai-worker/Dockerfile ./ai-worker
        docker push $ECR_REGISTRY/$ECR_REPOSITORY/ai-worker:$IMAGE_TAG
    
    - name: Update Kubernetes deployment
      run: |
        # Update Kubernetes deployment (using kubectl)
        # This step depends on your infrastructure setup
    
    - name: Create GitHub Release
      uses: actions/create-release@v1
      env:
        GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
      with:
        tag_name: release-${{ github.run_number }}
        release_name: Production Release ${{ github.run_number }}
        draft: false
        prerelease: false
```

## 4. Documentation Generation Workflow

Create `.github/workflows/docs.yml`:

```yaml
name: Generate Documentation

on:
  push:
    branches: [ main, develop ]
    paths:
      - '**.md'
      - '**.js'
      - '**.jsx'
      - '**.ts'
      - '**.tsx'
      - '.github/workflows/docs.yml'

jobs:
  build-and-deploy:
    runs-on: ubuntu-latest
    
    steps:
    - uses: actions/checkout@v3
    
    - name: Set up Node.js
      uses: actions/setup-node@v3
      with:
        node-version: 16
        cache: 'npm'
    
    - name: Install dependencies
      run: |
        npm install -g jsdoc
        npm install better-docs
    
    - name: Generate documentation
      run: |
        jsdoc -c jsdoc.conf.json
    
    - name: Deploy to GitHub Pages
      uses: JamesIves/github-pages-deploy-action@v4
      with:
        folder: docs
        branch: gh-pages
```

## 5. Dependency Scanning Workflow

Create `.github/workflows/dependency-check.yml`:

```yaml
name: Dependency Scanning

on:
  schedule:
    - cron: '0 0 * * 0'  # Run weekly on Sundays
  push:
    branches: [ main, develop ]
    paths:
      - 'package.json'
      - '**/package.json'

jobs:
  scan:
    runs-on: ubuntu-latest
    
    steps:
    - uses: actions/checkout@v3
    
    - name: Set up Node.js
      uses: actions/setup-node@v3
      with:
        node-version: 16
    
    - name: Check for vulnerabilities
      run: |
        npm audit --json > npm-audit.json || true
    
    - name: Upload vulnerability report
      uses: actions/upload-artifact@v3
      with:
        name: vulnerability-report
        path: npm-audit.json
```

## Setting Up GitHub Secrets

Many workflows require secrets for authentication and access to services. Add these in your GitHub repository settings:

1. Go to your repository on GitHub
2. Click on "Settings" > "Secrets" > "Actions"
3. Add these secrets:
   - `AWS_ACCESS_KEY_ID`: Your AWS access key
   - `AWS_SECRET_ACCESS_KEY`: Your AWS secret key
   - `DOCKER_USERNAME`: Your Docker Hub username (if using Docker Hub)
   - `DOCKER_PASSWORD`: Your Docker Hub password
   - `GITHUB_TOKEN`: Automatically provided by GitHub
   - Any other API keys or credentials needed for your deployment

## Workflow Configuration

Each workflow can be customized based on your specific infrastructure:

1. **Deployment Targets**: Modify the deployment steps to match your hosting provider (AWS, Azure, GCP, etc.)
2. **Build Process**: Adjust build commands based on your build process
3. **Testing Environment**: Configure the services section to match your testing needs
4. **Notification**: Add notification steps (Slack, Email, etc.)

## Additional Workflows to Consider

- **Performance Benchmarking**: Run performance tests on key components
- **End-to-End Testing**: Run browser-based testing on deployed instances
- **Scheduled Database Backups**: Automatically backup your database
- **PR Previews**: Deploy preview environments for pull requests

## Example Environment File Generation

Create `.github/workflows/env-setup.yml` for automatic environment variable management:

```yaml
name: Environment Setup

on:
  workflow_dispatch:
    inputs:
      environment:
        description: 'Target environment'
        required: true
        default: 'development'
        type: choice
        options:
        - development
        - staging
        - production

jobs:
  setup-environment:
    runs-on: ubuntu-latest
    
    steps:
    - uses: actions/checkout@v3
    
    - name: Set up environment files
      run: |
        # Generate backend .env
        echo "NODE_ENV=${{ github.event.inputs.environment }}" > backend/.env
        echo "PORT=4000" >> backend/.env
        echo "MONGODB_URI=${{ secrets.MONGODB_URI }}" >> backend/.env
        echo "REDIS_URI=${{ secrets.REDIS_URI }}" >> backend/.env
        echo "WS_SERVICE_URL=${{ secrets.WS_SERVICE_URL }}" >> backend/.env
        echo "GITHUB_TOKEN=${{ secrets.GH_TOKEN }}" >> backend/.env
        echo "GITHUB_USERNAME=${{ secrets.GH_USERNAME }}" >> backend/.env
        echo "AI_SERVICE_KEY=${{ secrets.AI_SERVICE_KEY }}" >> backend/.env
        echo "CORS_ORIGINS=${{ secrets.CORS_ORIGINS }}" >> backend/.env
        
        # Generate websocket .env
        echo "NODE_ENV=${{ github.event.inputs.environment }}" > websocket/.env
        echo "PORT=4001" >> websocket/.env
        echo "REDIS_URI=${{ secrets.REDIS_URI }}" >> websocket/.env
        echo "CORS_ORIGINS=${{ secrets.CORS_ORIGINS }}" >> websocket/.env
        
        # Generate ai-worker .env
        echo "NODE_ENV=${{ github.event.inputs.environment }}" > ai-worker/.env
        echo "MONGODB_URI=${{ secrets.MONGODB_URI }}" >> ai-worker/.env
        echo "REDIS_URI=${{ secrets.REDIS_URI }}" >> ai-worker/.env
        echo "AI_SERVICE_KEY=${{ secrets.AI_SERVICE_KEY }}" >> ai-worker/.env
        echo "GITHUB_TOKEN=${{ secrets.GH_TOKEN }}" >> ai-worker/.env
        echo "GITHUB_USERNAME=${{ secrets.GH_USERNAME }}" >> ai-worker/.env
    
    - name: Upload environment files as artifacts
      uses: actions/upload-artifact@v3
      with:
        name: env-files-${{ github.event.inputs.environment }}
        path: |
          backend/.env
          websocket/.env
          ai-worker/.env
```

## Conclusion

These GitHub Actions workflows provide a comprehensive CI/CD pipeline for your SketchyChain project. They can be adjusted as needed to fit your specific deployment targets and development workflow.

After setting up your GitHub repository using the instructions in the [GitHub Setup Guide](github-setup-guide.md), create these workflow files to enable automated testing, deployment, and documentation generation.