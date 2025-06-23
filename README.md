# Tauri Auto-Updater Application

A production-ready Tauri application with comprehensive auto-updater functionality supporting multiple environments (dev, qa, production) and secure API-based updates.

## Features

- 🔄 **Auto-Updater**: Secure, signed updates with progress tracking
- 🌐 **Multi-Environment**: Separate configurations for dev, qa, and production
- 🔐 **Security**: RSA-signed updates with public key verification
- 📱 **Cross-Platform**: Support for macOS, Windows, and Linux
- 🚀 **CI/CD**: Automated builds and releases via GitHub Actions
- 🎨 **Modern UI**: Beautiful, responsive React interface
- 📊 **Progress Tracking**: Real-time download progress with animations

## Quick Start

### Prerequisites

- [Rust](https://rustup.rs/) (latest stable)
- [Node.js](https://nodejs.org/) (v18 or later)
- [pnpm](https://pnpm.io/) package manager
- [Tauri CLI](https://tauri.app/v1/guides/getting-started/prerequisites)

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/tarunkumarmetaforms/auto-updater.git
   cd auto-updater
   ```

2. **Install dependencies**
   ```bash
   pnpm install
   ```

3. **Set up signing keys** (for production)
   ```bash
   # Generate new signing keys
   tauri signer generate -w src-tauri/myapp.key
   
   # This creates:
   # - src-tauri/myapp.key (private key - keep secret!)
   # - src-tauri/myapp.key.pub (public key - can be shared)
   ```

4. **Run the development server**
   ```bash
   pnpm run tauri:dev
   ```

## Environment Configurations

The application supports three environments with separate configurations:

### Development (`tauri.dev.conf.json`)
- **Build**: `pnpm run tauri:build:dev`
- **API**: `https://api.github.com/repos/tarunkumarmetaforms/auto-updater/releases/latest`
- **Purpose**: Development and testing

### QA (`tauri.qa.conf.json`)
- **Build**: `pnpm run tauri:build:qa`
- **API**: `https://api.github.com/repos/tarunkumarmetaforms/auto-updater/releases`
- **Purpose**: Quality assurance and staging (includes pre-releases)

### Production (`tauri.prod.conf.json`)
- **Build**: `pnpm run tauri:build:prod`
- **API**: `https://api.github.com/repos/tarunkumarmetaforms/auto-updater/releases/latest`
- **Purpose**: Production releases (stable releases only)

## Update System

### GitHub Releases Integration

This application uses **GitHub Releases** directly for updates - no custom server required! The Tauri updater automatically checks for new releases using the GitHub API.

#### How it Works

1. **GitHub Actions** builds and creates releases automatically
2. **Tauri updater** checks the configured endpoint for new versions
3. **Users** get notified and can install updates directly

#### Update Endpoints

- **Development**: Latest release (including pre-releases)
- **QA**: All releases (for testing different versions)  
- **Production**: Stable releases only

#### GitHub Release Format

The Tauri updater expects GitHub releases to include:
- **Version tag**: `v1.0.1` format
- **Release assets**: Platform-specific installers (.dmg, .msi, .AppImage)
- **Signatures**: Generated automatically by Tauri CLI
- **Release notes**: Displayed to users during update

## GitHub Actions Setup

### Required Secrets

Add these secrets to your GitHub repository (Settings → Secrets and variables → Actions):

1. **`TAURI_PRIVATE_KEY`**: Content of your `myapp.key` file
2. **`TAURI_KEY_PASSWORD`**: Password for the private key (if set)

To add secrets:
1. Go to your repository on GitHub
2. Click **Settings** → **Secrets and variables** → **Actions**  
3. Click **New repository secret**
4. Add the secret name and value

### Workflow Triggers

The GitHub Actions workflow automatically:
- **Builds** on pushes to `main2`, `development`, `qa` branches
- **Releases** on tags starting with `v*`
- **Creates GitHub releases** with signed binaries for auto-updates

### Branch Strategy

- **`main2`**: Production builds (`tauri.prod.conf.json`)
- **`qa`**: QA builds (`tauri.qa.conf.json`)
- **`development`**: Development builds (`tauri.dev.conf.json`)

## Building for Different Environments

```bash
# Development build
pnpm run tauri:build:dev

# QA build
pnpm run tauri:build:qa

# Production build
pnpm run tauri:build:prod
```

## Testing the Updater

1. **Build initial version** (0.1.0)
   ```bash
   pnpm run tauri:build:dev
   ```

2. **Update version** in `Cargo.toml` and `package.json` to 0.1.1

3. **Configure your update server** with the new version info

4. **Build and deploy** version 0.1.1

5. **Run the old version** and test the update process

## Security Considerations

- ✅ **Private Key Security**: Never commit private keys to version control
- ✅ **HTTPS Required**: All update endpoints use HTTPS
- ✅ **Signature Verification**: Updates are verified before installation
- ✅ **Environment Isolation**: Separate API endpoints for each environment
- ✅ **Access Control**: Implement authentication for your update API

## Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Tauri App     │    │  Update Server  │    │ GitHub Actions  │
│                 │    │                 │    │                 │
│ ┌─────────────┐ │    │ ┌─────────────┐ │    │ ┌─────────────┐ │
│ │   React     │ │    │ │  API        │ │    │ │   Build     │ │
│ │   Frontend  │◄├────┤ │  Endpoints  │ │    │ │   Workflow  │ │
│ └─────────────┘ │    │ └─────────────┘ │    │ └─────────────┘ │
│                 │    │                 │    │                 │
│ ┌─────────────┐ │    │ ┌─────────────┐ │    │ ┌─────────────┐ │
│ │   Rust      │ │    │ │  Version    │ │    │ │   Release   │ │
│ │   Backend   │ │    │ │  Database   │ │◄───┤ │   Manager   │ │
│ └─────────────┘ │    │ └─────────────┘ │    │ └─────────────┘ │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

## Available Scripts

- `pnpm dev`: Start Vite development server
- `pnpm build`: Build the web assets
- `pnpm tauri:dev`: Start Tauri development mode
- `pnpm tauri:build`: Build for production
- `pnpm tauri:build:dev`: Build development version
- `pnpm tauri:build:qa`: Build QA version
- `pnpm tauri:build:prod`: Build production version

## Troubleshooting

### Common Issues

1. **Update not detected**
   - Check API endpoint URL in configuration
   - Verify server response format
   - Check network connectivity

2. **Signature verification failed**
   - Ensure correct public key is used
   - Verify private key is set in GitHub secrets
   - Check signature generation process

3. **Build failed**
   - Verify all dependencies are installed
   - Check Rust toolchain version
   - Ensure platform-specific dependencies are installed

### Debug Commands

```bash
# Enable debug logs
RUST_LOG=tauri=debug pnpm run tauri:dev

# Check Tauri info
pnpm tauri info

# Verify GitHub releases API response
curl -v "https://api.github.com/repos/tarunkumarmetaforms/auto-updater/releases/latest"
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Documentation

- **Setup Guide**: [TAURI_UPDATER_SETUP_GUIDE.md](TAURI_UPDATER_SETUP_GUIDE.md) - Detailed implementation steps
- **Release Guide**: [RELEASE_GUIDE.md](RELEASE_GUIDE.md) - How to create releases and test updates
# auto-updater
