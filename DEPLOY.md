# 🚀 Quick Start - Deploy KB1 Flash Tool to GitHub

**Complete beginner-friendly guide!**

---

## ⚡ Super Quick Method (Automated Script)

Just run this in your terminal (in VS Code):

```bash
cd /Volumes/Oyen2TB/xGIT_KB1/KB1/kb1-flash
./setup-github.sh
```

The script will guide you through everything! 

**Before running the script:**
1. Go to https://github.com/new
2. Name: `kb1-flash`
3. Make it **Public**
4. **Don't** check any boxes (README, .gitignore, license)
5. Click "Create repository"

Then run the script above and follow the prompts!

---

## 📝 Manual Method (If you prefer step-by-step)

### Step 1: Create GitHub Repository

1. Open https://github.com/new
2. Fill in:
   - Repository name: **kb1-flash**
   - Description: **KB1 Desktop Firmware Flash Tool**
   - Visibility: **Public**
   - **DO NOT** check: Add README, .gitignore, or license
3. Click **"Create repository"**

### Step 2: Open Terminal in VS Code

1. In VS Code, click **Terminal** → **New Terminal**
2. Run:
   ```bash
   cd kb1-flash
   ```

### Step 3: Initialize Git

```bash
git init
git add .
git commit -m "Initial commit - KB1 Flash Tool v1.0.0"
```

### Step 4: Connect to GitHub

Replace `YOUR_USERNAME` with your actual GitHub username:

```bash
git remote add origin https://github.com/YOUR_USERNAME/kb1-flash.git
git branch -M main
git push -u origin main
```

**Example:** If your username is `pocket-midi`:
```bash
git remote add origin https://github.com/pocket-midi/kb1-flash.git
```

### Step 5: Enable GitHub Pages

1. Go to your repo: `https://github.com/YOUR_USERNAME/kb1-flash`
2. Click **Settings** tab (top menu)
3. Click **Pages** in left sidebar
4. Under "Build and deployment":
   - Source: Select **GitHub Actions**
5. No need to click Save (it auto-saves)

### Step 6: Wait for Deployment

1. Go to **Actions** tab in your repo
2. You'll see "Deploy to GitHub Pages" running
3. Wait ~1-2 minutes for it to complete
4. Green checkmark = success!

### Step 7: Visit Your Site!

Your site will be live at:
```
https://YOUR_USERNAME.github.io/kb1-flash/
```

Example: `https://pocket-midi.github.io/kb1-flash/`

---

## 🎯 Making Updates Later

Whenever you change the code:

```bash
git add .
git commit -m "Description of what you changed"
git push
```

GitHub will automatically rebuild and redeploy!

---

## ✅ Verification Checklist

- [ ] Repository created on GitHub
- [ ] Code pushed successfully
- [ ] GitHub Pages enabled (Settings → Pages → GitHub Actions)
- [ ] Workflow completed (Actions tab shows green checkmark)
- [ ] Site loads at `https://YOUR_USERNAME.github.io/kb1-flash/`
- [ ] Can see the Flash Firmware interface
- [ ] Serial Monitor tab works

---

## ❓ Need Help?

**If push fails:**
```bash
# Make sure you're using the right username!
git remote -v  # Shows your current remote URL
git remote set-url origin https://github.com/CORRECT_USERNAME/kb1-flash.git
git push -u origin main
```

**If deployment fails:**
- Check Actions tab for error messages
- Make sure GitHub Pages is set to "GitHub Actions" mode
- Try pushing again: `git push`

**If site shows 404:**
- Wait a few minutes (first deploy can take up to 10 minutes)
- Clear browser cache
- Check Actions tab shows green checkmark

---

## 📚 More Details

See **GITHUB_SETUP.md** for advanced configuration (custom domains, troubleshooting, etc.)

---

**Ready to go? Run the script or follow manual steps above!** 🎉
