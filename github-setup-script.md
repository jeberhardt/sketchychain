# GitHub Setup Script

Below is a shell script you can use to automate the GitHub repository setup process. Save these commands to a file named `github-setup.sh`, make it executable with `chmod +x github-setup.sh`, and then run it.

```bash
#!/bin/bash
# GitHub Setup Script for SketchyChain

# Set variables (modify these as needed)
REPO_NAME="sketchychain"
GITHUB_USERNAME="your-username"  # Replace with your actual GitHub username
COMMIT_MESSAGE="Initial commit: Sketchy Chain project setup"

# Text colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Helper function for steps
step() {
  echo -e "${BLUE}==>${NC} $1"
}

# Check if Git is installed
if ! command -v git &> /dev/null; then
  echo -e "${YELLOW}Git is not installed. Please install Git first.${NC}"
  exit 1
fi

# Step 1: Initialize Git repository
step "Initializing Git repository..."
if [ -d .git ]; then
  echo -e "${YELLOW}Git repository already initialized.${NC}"
else
  git init
  echo -e "${GREEN}Git repository initialized.${NC}"
fi

# Step 2: Check Git configuration
step "Checking Git user configuration..."
GIT_NAME=$(git config --get user.name)
GIT_EMAIL=$(git config --get user.email)

if [ -z "$GIT_NAME" ] || [ -z "$GIT_EMAIL" ]; then
  echo -e "${YELLOW}Git user not fully configured. Please set your user.name and user.email:${NC}"
  echo "  git config --global user.name \"Your Name\""
  echo "  git config --global user.email \"your.email@example.com\""
  read -p "Do you want to configure Git now? (y/n): " CONFIGURE
  if [[ $CONFIGURE == "y" ]]; then
    read -p "Enter your name: " NAME
    read -p "Enter your email: " EMAIL
    git config --global user.name "$NAME"
    git config --global user.email "$EMAIL"
    echo -e "${GREEN}Git user configured.${NC}"
  fi
else
  echo -e "${GREEN}Git user already configured as: $GIT_NAME <$GIT_EMAIL>${NC}"
fi

# Step 3: Add remote repository
step "Setting up remote repository..."
read -p "Have you created the '$REPO_NAME' repository on GitHub? (y/n): " REPO_CREATED

if [[ $REPO_CREATED != "y" ]]; then
  echo -e "${YELLOW}Please create a repository on GitHub first:${NC}"
  echo "1. Go to https://github.com/new"
  echo "2. Repository name: $REPO_NAME"
  echo "3. Description: Sketchy Chain - A collaborative web application for P5.js sketches"
  echo "4. Set visibility to Public"
  echo "5. Do NOT initialize with README, .gitignore, or license"
  echo "6. Click 'Create repository'"
  echo -e "${YELLOW}After creating the repository, run this script again.${NC}"
  exit 1
fi

# Confirm GitHub username
read -p "Enter your GitHub username [$GITHUB_USERNAME]: " INPUT_USERNAME
GITHUB_USERNAME=${INPUT_USERNAME:-$GITHUB_USERNAME}

# Check if remote origin already exists
if git remote | grep -q "^origin$"; then
  echo -e "${YELLOW}Remote 'origin' already exists. Updating URL...${NC}"
  git remote set-url origin "https://github.com/$GITHUB_USERNAME/$REPO_NAME.git"
else
  echo -e "Adding remote 'origin'..."
  git remote add origin "https://github.com/$GITHUB_USERNAME/$REPO_NAME.git"
fi
echo -e "${GREEN}Remote repository configured.${NC}"

# Step 4: Stage files
step "Staging files..."
git add .
echo -e "${GREEN}Files staged.${NC}"

# Step 5: Commit files
step "Committing files..."
git commit -m "$COMMIT_MESSAGE"
echo -e "${GREEN}Files committed.${NC}"

# Step 6: Push to GitHub
step "Pushing to GitHub..."
echo -e "${YELLOW}Note: You may be prompted for your GitHub credentials.${NC}"
echo -e "Pushing to repository..."

# Check default branch name
DEFAULT_BRANCH=$(git branch --show-current)
if [ -z "$DEFAULT_BRANCH" ]; then
  DEFAULT_BRANCH="main"
  echo "No branch detected, using 'main' as default"
fi

git push -u origin $DEFAULT_BRANCH
PUSH_STATUS=$?

if [ $PUSH_STATUS -eq 0 ]; then
  echo -e "${GREEN}Repository successfully pushed to GitHub!${NC}"
  echo -e "View your repository at: ${BLUE}https://github.com/$GITHUB_USERNAME/$REPO_NAME${NC}"
else
  echo -e "${YELLOW}Push failed. Please check your credentials and try again manually:${NC}"
  echo "  git push -u origin $DEFAULT_BRANCH"
  exit 1
fi

# Step 7: Provide next steps
step "Next steps:"
echo "1. Visit https://github.com/$GITHUB_USERNAME/$REPO_NAME to verify your repository"
echo "2. Set up repository topics (ai, p5js, collaborative-editing, etc.)"
echo "3. Consider setting up branch protection for main branch"
echo "4. Set up GitHub Actions for CI/CD if desired"

echo -e "\n${GREEN}Setup complete!${NC}"
```

## Using the Script

1. Save the above content to a file named `github-setup.sh`
2. Make it executable:
   ```bash
   chmod +x github-setup.sh
   ```
3. Run the script:
   ```bash
   ./github-setup.sh
   ```

The script will:
1. Initialize git (if not already done)
2. Check and prompt for git user configuration if needed
3. Guide you through connecting to GitHub
4. Stage and commit all files
5. Push to the remote repository
6. Show next steps

## Manual Setup Alternative

If you prefer to run the commands manually, refer to the [GitHub Setup Guide](github-setup-guide.md) document.