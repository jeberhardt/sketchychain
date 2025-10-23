# GitHub Workflow Best Practices for SketchyChain

This document outlines recommended practices for managing the SketchyChain project on GitHub once the repository is set up.

## Branching Strategy

We recommend a simplified Git flow approach:

- `main` - Production-ready code, always deployable
- `develop` - Integration branch for features and fixes
- `feature/*` - New features (e.g., `feature/real-time-collaboration`)
- `fix/*` - Bug fixes (e.g., `fix/websocket-connection-issue`)
- `release/*` - Release preparation (e.g., `release/v1.0.0`)

### Workflow Example

```bash
# Starting a new feature
git checkout develop
git pull
git checkout -b feature/new-sketch-export

# Work on feature...

# Push feature branch to remote
git push -u origin feature/new-sketch-export

# Create PR on GitHub from feature/new-sketch-export to develop
```

## Commit Message Conventions

Follow a structured commit message format to maintain clear history:

```
<type>(<scope>): <summary>

<body>

<footer>
```

Types:
- `feat` - New feature
- `fix` - Bug fix
- `docs` - Documentation
- `style` - Formatting, missing semicolons, etc.
- `refactor` - Code change that neither fixes a bug nor adds a feature
- `test` - Adding or refactoring tests
- `chore` - Maintenance tasks

Example:
```
feat(canvas): add undo/redo functionality

Implement undo/redo stack for P5.js canvas edits with keyboard shortcuts.

Resolves #42
```

## Pull Request Workflow

1. Create descriptive PRs with:
   - Clear title summarizing the change
   - Description explaining what, why, and how
   - Reference to related issues
   - Screenshots/videos if UI changes

2. PR Template:
   ```markdown
   ## Description
   [Description of the changes]

   ## Related Issue(s)
   - Resolves #[issue-number]

   ## Type of Change
   - [ ] New feature
   - [ ] Bug fix
   - [ ] Refactor
   - [ ] Documentation

   ## Testing
   - [ ] Unit tests added/updated
   - [ ] Integration tests added/updated
   - [ ] Manual testing performed

   ## Screenshots (if applicable)
   [Insert screenshots here]
   ```

3. Code Review Process:
   - At least one approving review before merging
   - Address all comments and suggestions
   - Ensure CI checks pass
   - Squash commits when merging to keep history clean

## GitHub Actions (CI/CD)

Consider setting up these workflows:

1. **Continuous Integration**:
   - Lint code
   - Run tests
   - Build application

2. **Deployment Workflows**:
   - Staging deployment from `develop` branch
   - Production deployment from `main` branch

3. **Documentation**:
   - Auto-generate API docs
   - Deploy documentation to GitHub Pages

## Issue Management

Organize with:

1. **Labels**:
   - `bug` - Confirmed bugs
   - `enhancement` - New features
   - `documentation` - Documentation tasks
   - `good first issue` - Good for newcomers
   - `priority: high/medium/low` - Prioritization

2. **Project Boards**:
   Set up a Kanban-style board with:
   - To Do
   - In Progress
   - Review
   - Done

3. **Milestones**:
   Group issues into planned releases/sprints

## Repository Maintenance

Regular maintenance tasks:

1. **Dependencies**:
   - Set up Dependabot for automated updates
   - Regularly review and update dependencies

2. **Security**:
   - Enable security alerts
   - Address vulnerabilities promptly
   - Run periodic security scans

3. **Housekeeping**:
   - Archive old branches
   - Close stale PRs and issues
   - Update documentation

## Versioning

Follow [Semantic Versioning](https://semver.org/):
- MAJOR version for incompatible API changes
- MINOR version for backward-compatible functionality
- PATCH version for backward-compatible bug fixes

Tag releases:
```bash
git tag -a v1.0.0 -m "Version 1.0.0"
git push origin v1.0.0
```

## Environment Variables and Secrets

- Never commit sensitive data (API keys, tokens)
- Use GitHub Secrets for CI/CD environment variables
- Document required environment variables

## Collaboration Guidelines

1. **Communication**:
   - Use PR comments for code-specific discussions
   - Use Issues for feature discussions and bug reports
   - Link related PRs and issues

2. **Code Standards**:
   - Follow the project's code style guide
   - Document public APIs
   - Write meaningful tests

3. **Contributor Flow**:
   - Fork the repository (external contributors)
   - Create a branch
   - Make changes
   - Submit PR
   - Address review comments