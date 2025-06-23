# Release Guide

This guide explains how to create releases and test the auto-updater functionality using GitHub releases.

## 🚀 Creating Releases

### Automatic Releases (Recommended)

The easiest way to create releases is using git tags, which trigger the GitHub Actions workflow:

```bash
# Update version in both files first
# 1. Update version in src-tauri/Cargo.toml
# 2. Update version in package.json

# Create and push a tag
git tag v1.0.1
git push origin v1.0.1
```

This will automatically:
- Build for all platforms (macOS, Windows, Linux)
- Sign the binaries
- Create a GitHub release
- Upload installers and signatures

### Manual Releases

You can also trigger releases by pushing to specific branches:

```bash
# Development release
git push origin development

# QA release  
git push origin qa

# Production release
git push origin main2
```

## 🧪 Testing the Auto-Updater

### Step 1: Build Initial Version

```bash
# Make sure you're on version 0.1.0
# Build the app
pnpm run tauri:build:dev
```

### Step 2: Update Version

Update the version in these files:
- `src-tauri/Cargo.toml`: Change version to `0.1.1`
- `package.json`: Change version to `0.1.1`

### Step 3: Create New Release

```bash
# Commit the version changes
git add .
git commit -m "Bump version to 0.1.1"

# Create and push tag
git tag v0.1.1
git push origin v0.1.1
```

### Step 4: Test Update Process

1. **Run the old version** (0.1.0) of your app
2. **Wait for GitHub Actions** to complete the build (~5-10 minutes)
3. **Check for updates** in your app (it should detect v0.1.1)
4. **Install the update** and verify it works

## 📋 Release Checklist

Before creating a release:

- [ ] Update version in `src-tauri/Cargo.toml`
- [ ] Update version in `package.json`
- [ ] Test the app locally
- [ ] Update release notes/CHANGELOG
- [ ] Ensure GitHub secrets are configured:
  - [ ] `TAURI_PRIVATE_KEY`
  - [ ] `TAURI_KEY_PASSWORD` (if your key has a password)

## 🔧 Environment-Specific Releases

### Development (Pre-release)
```bash
git tag v1.0.1-dev
git push origin v1.0.1-dev
```

### QA (Pre-release)
```bash
git tag v1.0.1-qa
git push origin v1.0.1-qa
```

### Production (Stable)
```bash
git tag v1.0.1
git push origin v1.0.1
```

## 🐛 Troubleshooting

### Release Not Detected
- Check GitHub releases: https://github.com/tarunkumarmetaforms/auto-updater/releases
- Verify API endpoint: `curl https://api.github.com/repos/tarunkumarmetaforms/auto-updater/releases/latest`
- Check app logs for update check errors

### Build Failed
- Check GitHub Actions logs
- Verify signing key is correctly set in repository secrets
- Ensure all dependencies are correctly specified

### Update Installation Failed
- Verify binary signatures are valid
- Check that the public key in config matches your private key
- Ensure user has permissions to install updates

## 📊 Monitoring Updates

You can monitor update adoption by:
- Checking GitHub release download statistics
- Monitoring app analytics (if implemented)
- Watching GitHub Actions build logs

## 🔐 Security Notes

- Never commit private keys to the repository
- Use GitHub repository secrets for sensitive data
- Verify signatures before manual distribution
- Consider implementing update rollback mechanisms

## 📚 Useful Commands

```bash
# Check current version
grep -A2 "name.*version" src-tauri/Cargo.toml
grep version package.json

# List all tags
git tag -l

# Delete a tag (if needed)
git tag -d v1.0.1
git push origin --delete v1.0.1

# Check GitHub releases via API
curl -s https://api.github.com/repos/tarunkumarmetaforms/auto-updater/releases/latest | jq .tag_name
``` 