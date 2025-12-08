# Multi-Chat Demo Documentation

Welcome to the Multi-Chat Demo documentation! This directory contains comprehensive user guides, FAQs, and technical documentation.

## 📚 Documentation

- **[User Guide](index.md)** - Complete user guide covering all features
- **[Quick Start Guide](quick-start.md)** - Get started in minutes
- **[FAQ](faq.md)** - Frequently asked questions
- **[Screenshot Guide](makedocs/screenshot-guide.md)** - Instructions for capturing screenshots (automated and manual)

## 🚀 Quick Links

- [Getting Started](index.md#getting-started)
- [Authentication](index.md#authentication)
- [Conversations](index.md#conversations)
- [Chatting](index.md#chatting)
- [Profile Management](index.md#profile-management)
- [Troubleshooting](index.md#troubleshooting)

## 📸 Screenshots

All documentation screenshots are located in the [screenshots](screenshots/) directory.

## 🔗 Related Documentation

- [Setup Guide](../../README_SETUP.md) - Technical setup instructions
- [Testing Documentation](../../TESTING.md) - Testing information
- [Main README](../../README.md) - Project overview

## 🌐 GitHub Pages Setup

This documentation can be published to GitHub Pages. Follow these steps to set up GitHub Pages for your repository:

### Option 1: Using the `/docs` folder (Recommended)

This is the simplest method if your documentation is already in the `docs/` folder:

1. **Ensure your documentation is in the `docs/` folder** (already done)
2. **Push your changes to the main branch**:
   ```bash
   git add docs/
   git commit -m "Add documentation"
   git push origin main
   ```
3. **Configure GitHub Pages**:
   - Go to your repository on GitHub
   - Navigate to **Settings** → **Pages**
   - Under **Source**, select **Deploy from a branch**
   - Choose **Branch**: `main` (or `master`)
   - Choose **Folder**: `/docs`
   - Click **Save**
4. **Wait for GitHub to build your site** (usually takes a few minutes)
5. **Access your documentation** at: `https://<username>.github.io/<repository-name>/`

### Option 2: Using a `gh-pages` branch

If you prefer to use a separate branch for GitHub Pages:

1. **Create and switch to the `gh-pages` branch**:
   ```bash
   git checkout --orphan gh-pages
   git rm -rf .
   ```

2. **Copy the docs folder contents**:
   ```bash
   git checkout main -- docs/
   ```

3. **Move contents to root** (optional, if you want docs at root):
   ```bash
   git mv docs/* .
   git mv docs/.* . 2>/dev/null || true
   git rmdir docs/
   ```

   Or keep the docs folder structure:
   ```bash
   # Keep docs/ folder structure - no changes needed
   ```

4. **Create a `.nojekyll` file** (if not using Jekyll):
   ```bash
   touch .nojekyll
   git add .nojekyll
   ```

   Or if using Jekyll (which this project does), ensure `_config.yml` is present.

5. **Commit and push**:
   ```bash
   git add .
   git commit -m "Initial commit for GitHub Pages"
   git push origin gh-pages
   ```

6. **Configure GitHub Pages**:
   - Go to your repository on GitHub
   - Navigate to **Settings** → **Pages**
   - Under **Source**, select **Deploy from a branch**
   - Choose **Branch**: `gh-pages`
   - Choose **Folder**: `/ (root)` (or `/docs` if you kept the folder structure)
   - Click **Save**

### Option 3: Using GitHub Actions (Advanced)

For automated deployments, you can set up a GitHub Actions workflow:

1. **Create `.github/workflows/pages.yml`**:
   ```yaml
   name: Deploy GitHub Pages

   on:
     push:
       branches:
         - main
       paths:
         - 'docs/**'

   permissions:
     contents: read
     pages: write
     id-token: write

   jobs:
     deploy:
       runs-on: ubuntu-latest
       steps:
         - uses: actions/checkout@v4
         - name: Setup Pages
           uses: actions/configure-pages@v4
         - name: Upload artifact
           uses: actions/upload-pages-artifact@v3
           with:
             path: './docs'
         - name: Deploy to GitHub Pages
           id: deployment
           uses: actions/deploy-pages@v4
   ```

2. **Configure GitHub Pages**:
   - Go to **Settings** → **Pages**
   - Under **Source**, select **GitHub Actions**

### Updating Documentation

After making changes to your documentation:

- **Option 1** (using `/docs` folder): Simply push changes to the main branch
- **Option 2** (using `gh-pages` branch): Merge changes from main to gh-pages:
  ```bash
  git checkout gh-pages
  git merge main
  git push origin gh-pages
  ```
- **Option 3** (using GitHub Actions): Push changes to main branch, workflow will deploy automatically

### Custom Domain (Optional)

To use a custom domain:

1. Add a `CNAME` file in your `docs/` folder (or root of gh-pages branch) with your domain:
   ```
   docs.example.com
   ```
2. Configure DNS settings for your domain
3. Update GitHub Pages settings to use your custom domain

### Troubleshooting

- **404 errors**: Ensure `_config.yml` is present and correctly configured
- **Build failures**: Check GitHub Actions logs (if using Actions) or wait a few minutes for GitHub to rebuild
- **Missing files**: Verify all files are committed and pushed to the correct branch
- **Jekyll errors**: Check `_config.yml` syntax and ensure all required plugins are listed

---

**Note**: This documentation follows GitHub Docs format and can be used with GitHub Pages.
