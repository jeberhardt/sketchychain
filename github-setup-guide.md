# GitHub Setup Guide for SketchyChain

This guide will walk you through the process of adding your existing project to a new GitHub repository named "sketchychain".

## 1. Initialize Git in the Local Project Directory

Open a terminal in your project root directory (/Users/james/github/sketchychain) and run:

```bash
git init
```

This initializes a new Git repository in your project folder.

## 2. Create a New GitHub Repository

1. Go to [GitHub](https://github.com) and log in to your account
2. Click the "+" button in the top right corner, then select "New repository"
3. Enter repository information:
   - Name: `sketchychain`
   - Description: `Sketchy Chain - A collaborative web application for creating and modifying P5.js sketches through AI-processed text prompts`
   - Visibility: Public
   - **Do not** initialize with README, .gitignore, or license (as we already have these files)
4. Click "Create repository"

## 3. Connect Local Repository to GitHub Repository

After creating the repository, GitHub will show a page with setup instructions. Run these commands in your terminal:

```bash
git remote add origin https://github.com/YOUR_USERNAME/sketchychain.git
```

Replace `YOUR_USERNAME` with your actual GitHub username.

## 4. Configure Git User Information (if needed)

If this is your first time using Git on this machine, set your identity:

```bash
git config --global user.name "Your Name"
git config --global user.email "your.email@example.com"
```

Replace with your actual name and email.

## 5. Add Project Files to Git Staging

Add all files to the staging area:

```bash
git add .
```

The .gitignore file will automatically prevent excluded files (like .env files and node_modules) from being tracked.

## 6. Create Initial Commit

Create your first commit with a descriptive message:

```bash
git commit -m "Initial commit: Sketchy Chain project setup"
```

## 7. Push to GitHub Repository

Push your commit to the GitHub repository:

```bash
git push -u origin main
```

> Note: If your local Git is configured to use "master" as the default branch name instead of "main", use this command instead:
> ```bash
> git push -u origin master
> ```

## 8. Verify Repository Upload

Visit `https://github.com/YOUR_USERNAME/sketchychain` to verify all files were uploaded successfully.

## 9. Additional GitHub Repository Setup (Optional)

Consider these additional setup options:

- Add topics to your repository: ai, p5js, collaborative-editing, react, nodejs, websockets
- Set up branch protection for the main branch
- Configure GitHub Pages if you want to host documentation
- Set up GitHub Actions for continuous integration
- Configure issue templates for better collaboration

## 10. Next Steps

Your project is now hosted on GitHub! From here, you can:

- Invite collaborators to your project
- Set up project boards to track tasks
- Create issues for tracking bugs and feature requests
- Create branches for new features or bug fixes
- Set up continuous integration and deployment workflows