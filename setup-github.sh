#!/bin/bash
# KB1 Flash Tool - GitHub Repository Setup Script

echo "🚀 KB1 Flash Tool - GitHub Setup"
echo "================================"
echo ""

# Check if git is initialized
if [ ! -d .git ]; then
    echo "📝 Step 1: Initializing Git repository..."
    git init
    echo "✅ Git initialized"
    echo ""
else
    echo "✅ Git already initialized"
    echo ""
fi

# Check if files are committed
if [ -z "$(git log 2>/dev/null)" ]; then
    echo "📝 Step 2: Creating initial commit..."
    git add .
    git commit -m "Initial commit - KB1 Flash Tool v1.0.0"
    echo "✅ Initial commit created"
    echo ""
else
    echo "✅ Repository already has commits"
    echo ""
fi

# Ask for GitHub username/org
echo "📝 Step 3: Connect to GitHub"
echo ""
echo "First, create a new repository on GitHub:"
echo "   👉 https://github.com/new"
echo ""
echo "Repository settings:"
echo "   - Name: kb1-flash"
echo "   - Visibility: Public"
echo "   - DO NOT initialize with README/license (we have those)"
echo ""
read -p "Press Enter after you've created the GitHub repository..."
echo ""

# Ask for GitHub username
read -p "Enter your GitHub username or organization (e.g., 'pocket-midi'): " GITHUB_USER

if [ -z "$GITHUB_USER" ]; then
    echo "❌ Username required!"
    exit 1
fi

REPO_URL="https://github.com/$GITHUB_USER/kb1-flash.git"

echo ""
echo "📝 Step 4: Adding remote and pushing to GitHub..."
echo "   Repository: $REPO_URL"
echo ""

# Check if remote already exists
if git remote | grep -q "origin"; then
    echo "⚠️  Remote 'origin' already exists. Updating..."
    git remote set-url origin "$REPO_URL"
else
    git remote add origin "$REPO_URL"
fi

# Push to GitHub
git branch -M main

echo "Pushing to GitHub..."
if git push -u origin main; then
    echo "✅ Code pushed to GitHub!"
    echo ""
else
    echo "❌ Push failed. You may need to:"
    echo "   1. Check your GitHub credentials"
    echo "   2. Make sure the repository exists"
    echo "   3. Try: git push -u origin main --force (if needed)"
    exit 1
fi

echo "🎉 Setup Complete!"
echo ""
echo "Next steps:"
echo "1. Go to: https://github.com/$GITHUB_USER/kb1-flash/settings/pages"
echo "2. Under 'Source', select: GitHub Actions"
echo "3. Click Save"
echo "4. Check deployment: https://github.com/$GITHUB_USER/kb1-flash/actions"
echo ""
echo "Your site will be live at:"
echo "   🌐 https://$GITHUB_USER.github.io/kb1-flash/"
echo ""
echo "📖 See GITHUB_SETUP.md for more details!"
