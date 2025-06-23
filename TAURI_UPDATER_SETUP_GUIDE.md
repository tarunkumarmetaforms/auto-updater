# Production-Grade Tauri Auto-Updater Setup Guide

This guide provides step-by-step instructions to implement a production-grade auto-updater for your Tauri application with multiple environments (dev, qa, main2) and API-based updates.

## Table of Contents
1. [Prerequisites](#prerequisites)
2. [Signing Keys Setup](#signing-keys-setup)
3. [Project Configuration](#project-configuration)
4. [Environment Configuration](#environment-configuration)
5. [Rust Backend Implementation](#rust-backend-implementation)
6. [Frontend Implementation](#frontend-implementation)
7. [GitHub Actions Setup](#github-actions-setup)
8. [API Endpoints](#api-endpoints)
9. [Testing the Updater](#testing-the-updater)

## Prerequisites

- Tauri CLI installed: `npm install -g @tauri-apps/cli`
- Rust toolchain installed
- Node.js and pnpm/npm
- GitHub repository (private or public)

## Signing Keys Setup

### 1. Generate Signing Keys

First, generate your signing keys using Tauri CLI:

```bash
# Generate new signing keys
tauri signer generate -w myapp.key

# This will create:
# - myapp.key (private key - keep this secret!)
# - myapp.key.pub (public key - this can be shared)
```

### 2. Store Keys Securely

**Private Key (`myapp.key`):**
```
dW50cnVzdGVkIGNvbW1lbnQ6IHJzaWduIGVuY3J5cHRlZCBzZWNyZXQga2V5ClJXUlRZMEl5b0ZabndLOXArcCtHNHlCZjkvZ2JuTTRlT0lHY2tIL1FNM2RWN0hyNlNXVUFBQkFBQUFBQUFBQUFBQUlBQUFBQWVzK01VcGcxb2JDVHp0Vm9ieERmbTBqY1VoTVRnUjJhOFhmZkZtQjlUTjNUdENxZnZZU3kxS0dwNXp6ZWVpbWhVWlg1RjVyWTk3aWVSM2ZCK3FZdGRTbmxQeEh5cGNpQk1LYWRCWmZuZ2psVTdZcFVkU05vMjBiRzR3dnB4ZjRkQU9CTzdPNVJscEU9Cg==
```

**Public Key (`myapp.key.pub`):**
```
dW50cnVzdGVkIGNvbW1lbnQ6IG1pbmlzaWduIHB1YmxpYyBrZXk6IDlFOEU2OTVFNjJDQjQwMDIKUldRQ1FNdGlYbW1PbnZkclk2ckNteVJyVE5zaTlKS0grOHRJUUdYOGcxTnczMWFYaExYUzQraXEK
```

### 3. GitHub Secrets Setup

Add these secrets to your GitHub repository:
- `TAURI_PRIVATE_KEY`: Content of `myapp.key` (private key)
- `TAURI_KEY_PASSWORD`: Password for the private key (if you set one)

## Project Configuration

### 1. Update `package.json`

```json
{
  "name": "auto-updater",
  "private": true,
  "version": "0.1.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "tsc && vite build",
    "preview": "vite preview",
    "tauri": "tauri",
    "tauri:dev": "tauri dev",
    "tauri:build": "tauri build",
    "tauri:build:dev": "tauri build --config-path tauri.dev.conf.json",
    "tauri:build:qa": "tauri build --config-path tauri.qa.conf.json",
    "tauri:build:prod": "tauri build --config-path tauri.prod.conf.json"
  },
  "dependencies": {
    "@tauri-apps/api": "^2",
    "@tauri-apps/plugin-opener": "^2",
    "@tauri-apps/plugin-updater": "~2",
    "react": "^18.3.1",
    "react-dom": "^18.3.1"
  },
  "devDependencies": {
    "@tauri-apps/cli": "^2",
    "@types/react": "^18.3.1",
    "@types/react-dom": "^18.3.1",
    "@vitejs/plugin-react": "^4.3.4",
    "typescript": "~5.6.2",
    "vite": "^6.0.3"
  }
}
```

### 2. Update `src-tauri/Cargo.toml`

```toml
[package]
name = "auto-updater"
version = "0.1.0"
description = "A Tauri App with Auto-Updater"
authors = ["Your Name <your.email@example.com>"]
edition = "2021"

[lib]
name = "auto_updater_lib"
crate-type = ["staticlib", "cdylib", "rlib"]

[build-dependencies]
tauri-build = { version = "2", features = [] }

[dependencies]
tauri = { version = "2", features = ["protocol-asset"] }
tauri-plugin-opener = "2"
serde = { version = "1", features = ["derive"] }
serde_json = "1"
tokio = { version = "1", features = ["full"] }
reqwest = { version = "0.11", features = ["json"] }

[target.'cfg(not(any(target_os = "android", target_os = "ios")))'.dependencies]
tauri-plugin-updater = "2"
```

## Environment Configuration

### 1. Base Configuration (`src-tauri/tauri.conf.json`)

```json
{
  "$schema": "https://schema.tauri.app/config/2",
  "productName": "AutoUpdater",
  "version": "0.1.0",
  "identifier": "com.yourcompany.auto-updater",
  "build": {
    "beforeDevCommand": "pnpm dev",
    "devUrl": "http://localhost:1420",
    "beforeBuildCommand": "pnpm build",
    "frontendDist": "../dist"
  },
  "app": {
    "windows": [
      {
        "title": "Auto Updater",
        "width": 1000,
        "height": 700,
        "resizable": true,
        "fullscreen": false
      }
    ],
    "security": {
      "csp": null
    }
  },
  "bundle": {
    "active": true,
    "targets": "all",
    "icon": [
      "icons/32x32.png",
      "icons/128x128.png",
      "icons/128x128@2x.png",
      "icons/icon.icns",
      "icons/icon.ico"
    ],
    "publisher": "Your Company",
    "copyright": "Copyright © 2025 Your Company"
  },
  "plugins": {
    "updater": {
      "active": true,
      "endpoints": [
        "https://api.yourcompany.com/updates/{{target}}/{{current_version}}"
      ],
      "dialog": true,
      "pubkey": "dW50cnVzdGVkIGNvbW1lbnQ6IG1pbmlzaWduIHB1YmxpYyBrZXk6IDlFOEU2OTVFNjJDQjQwMDIKUldRQ1FNdGlYbW1PbnZkclk2ckNteVJyVE5zaTlKS0grOHRJUUdYOGcxTnczMWFYaExYUzQraXEK"
    }
  }
}
```

### 2. Development Configuration (`src-tauri/tauri.dev.conf.json`)

```json
{
  "extends": "./tauri.conf.json",
  "productName": "AutoUpdater Dev",
  "identifier": "com.yourcompany.auto-updater.dev",
  "plugins": {
    "updater": {
      "active": true,
      "endpoints": [
        "https://api-dev.yourcompany.com/updates/{{target}}/{{current_version}}"
      ],
      "dialog": true,
      "pubkey": "dW50cnVzdGVkIGNvbW1lbnQ6IG1pbmlzaWduIHB1YmxpYyBrZXk6IDlFOEU2OTVFNjJDQjQwMDIKUldRQ1FNdGlYbW1PbnZkclk2ckNteVJyVE5zaTlKS0grOHRJUUdYOGcxTnczMWFYaExYUzQraXEK"
    }
  }
}
```

### 3. QA Configuration (`src-tauri/tauri.qa.conf.json`)

```json
{
  "extends": "./tauri.conf.json",
  "productName": "AutoUpdater QA",
  "identifier": "com.yourcompany.auto-updater.qa",
  "plugins": {
    "updater": {
      "active": true,
      "endpoints": [
        "https://api-qa.yourcompany.com/updates/{{target}}/{{current_version}}"
      ],
      "dialog": true,
      "pubkey": "dW50cnVzdGVkIGNvbW1lbnQ6IG1pbmlzaWduIHB1YmxpYyBrZXk6IDlFOEU2OTVFNjJDQjQwMDIKUldRQ1FNdGlYbW1PbnZkclk2ckNteVJyVE5zaTlKS0grOHRJUUdYOGcxTnczMWFYaExYUzQraXEK"
    }
  }
}
```

### 4. Production Configuration (`src-tauri/tauri.prod.conf.json`)

```json
{
  "extends": "./tauri.conf.json",
  "productName": "AutoUpdater",
  "identifier": "com.yourcompany.auto-updater",
  "plugins": {
    "updater": {
      "active": true,
      "endpoints": [
        "https://api.yourcompany.com/updates/{{target}}/{{current_version}}"
      ],
      "dialog": true,
      "pubkey": "dW50cnVzdGVkIGNvbW1lbnQ6IG1pbmlzaWduIHB1YmxpYyBrZXk6IDlFOEU2OTVFNjJDQjQwMDIKUldRQ1FNdGlYbW1PbnZkclk2ckNteVJyVE5zaTlKS0grOHRJUUdYOGcxTnczMWFYaExYUzQraXEK"
    }
  }
}
```

### 5. Update Capabilities (`src-tauri/capabilities/default.json`)

```json
{
  "$schema": "../gen/schemas/desktop-schema.json",
  "identifier": "default",
  "description": "Capability for the main window",
  "windows": ["main"],
  "permissions": [
    "core:default",
    "opener:default",
    "updater:default"
  ]
}
```

## Rust Backend Implementation

### 1. Main Library (`src-tauri/src/lib.rs`)

```rust
use serde::{Deserialize, Serialize};
use std::sync::Mutex;
use tauri::Manager;

#[derive(Debug, Serialize, Deserialize)]
pub struct UpdateInfo {
    pub version: String,
    pub notes: String,
    pub date: String,
    pub available: bool,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct UpdateProgress {
    pub chunk_length: u64,
    pub content_length: Option<u64>,
}

// Global state for pending updates
pub struct PendingUpdate(pub Mutex<Option<tauri_plugin_updater::Update>>);

#[tauri::command]
async fn check_for_updates(app: tauri::AppHandle) -> Result<UpdateInfo, String> {
    #[cfg(desktop)]
    {
        match app.updater().unwrap().check().await {
            Ok(Some(update)) => {
                let version = update.version.clone();
                let notes = update.body.clone().unwrap_or_default();
                let date = update.date.clone().unwrap_or_default();
                
                // Store the update for later installation
                let pending_update = app.state::<PendingUpdate>();
                *pending_update.0.lock().unwrap() = Some(update);
                
                Ok(UpdateInfo {
                    version,
                    notes,
                    date,
                    available: true,
                })
            }
            Ok(None) => Ok(UpdateInfo {
                version: "".to_string(),
                notes: "No updates available".to_string(),
                date: "".to_string(),
                available: false,
            }),
            Err(e) => Err(format!("Failed to check for updates: {}", e)),
        }
    }
    
    #[cfg(not(desktop))]
    {
        Err("Updates not supported on this platform".to_string())
    }
}

#[tauri::command]
async fn download_and_install_update(
    app: tauri::AppHandle,
    window: tauri::Window,
) -> Result<(), String> {
    #[cfg(desktop)]
    {
        let pending_update = app.state::<PendingUpdate>();
        let update = pending_update.0.lock().unwrap().take();
        
        if let Some(update) = update {
            let window_clone = window.clone();
            
            update
                .download_and_install(
                    |chunk_length, content_length| {
                        let progress = UpdateProgress {
                            chunk_length,
                            content_length,
                        };
                        let _ = window_clone.emit("updater-progress", &progress);
                    },
                    || {
                        let _ = window_clone.emit("updater-finished", ());
                        println!("Update downloaded and installed successfully!");
                    },
                )
                .await
                .map_err(|e| format!("Failed to download and install update: {}", e))?;
            
            Ok(())
        } else {
            Err("No pending update found".to_string())
        }
    }
    
    #[cfg(not(desktop))]
    {
        Err("Updates not supported on this platform".to_string())
    }
}

#[tauri::command]
fn get_app_version() -> String {
    env!("CARGO_PKG_VERSION").to_string()
}

#[tauri::command]
fn get_app_environment() -> String {
    #[cfg(debug_assertions)]
    return "development".to_string();
    
    #[cfg(not(debug_assertions))]
    {
        // You can determine environment based on build configuration
        // For now, we'll use a simple approach
        std::env::var("TAURI_ENV").unwrap_or_else(|_| "production".to_string())
    }
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_updater::Builder::new().build())
        .plugin(tauri_plugin_opener::init())
        .setup(|app| {
            #[cfg(desktop)]
            {
                app.manage(PendingUpdate(Mutex::new(None)));
            }
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            check_for_updates,
            download_and_install_update,
            get_app_version,
            get_app_environment
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
```

## Frontend Implementation

### 1. Update React App (`src/App.tsx`)

```tsx
import React, { useState, useEffect } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { listen } from '@tauri-apps/api/event';
import './App.css';

interface UpdateInfo {
  version: string;
  notes: string;
  date: string;
  available: boolean;
}

interface UpdateProgress {
  chunk_length: number;
  content_length?: number;
}

function App() {
  const [updateInfo, setUpdateInfo] = useState<UpdateInfo | null>(null);
  const [isChecking, setIsChecking] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [downloadProgress, setDownloadProgress] = useState<UpdateProgress | null>(null);
  const [appVersion, setAppVersion] = useState<string>('');
  const [environment, setEnvironment] = useState<string>('');
  const [error, setError] = useState<string>('');

  useEffect(() => {
    // Get app version and environment on component mount
    const getAppInfo = async () => {
      try {
        const version = await invoke<string>('get_app_version');
        const env = await invoke<string>('get_app_environment');
        setAppVersion(version);
        setEnvironment(env);
      } catch (err) {
        console.error('Failed to get app info:', err);
      }
    };

    getAppInfo();

    // Listen for update progress
    const unlistenProgress = listen<UpdateProgress>('updater-progress', (event) => {
      setDownloadProgress(event.payload);
    });

    // Listen for update completion
    const unlistenFinished = listen('updater-finished', () => {
      setIsDownloading(false);
      setDownloadProgress(null);
      alert('Update installed successfully! The application will restart.');
    });

    return () => {
      unlistenProgress.then(unlisten => unlisten());
      unlistenFinished.then(unlisten => unlisten());
    };
  }, []);

  const checkForUpdates = async () => {
    setIsChecking(true);
    setError('');
    
    try {
      const update = await invoke<UpdateInfo>('check_for_updates');
      setUpdateInfo(update);
    } catch (err) {
      setError(err as string);
    } finally {
      setIsChecking(false);
    }
  };

  const downloadAndInstall = async () => {
    setIsDownloading(true);
    setError('');
    
    try {
      await invoke('download_and_install_update');
    } catch (err) {
      setError(err as string);
      setIsDownloading(false);
    }
  };

  const getProgressPercentage = (): number => {
    if (!downloadProgress || !downloadProgress.content_length) return 0;
    return Math.round((downloadProgress.chunk_length / downloadProgress.content_length) * 100);
  };

  return (
    <div className="container">
      <header className="header">
        <h1>Auto Updater</h1>
        <div className="app-info">
          <p>Version: {appVersion}</p>
          <p>Environment: {environment}</p>
        </div>
      </header>

      <main className="main">
        <div className="update-section">
          <h2>Application Updates</h2>
          
          <button 
            onClick={checkForUpdates} 
            disabled={isChecking || isDownloading}
            className="btn btn-primary"
          >
            {isChecking ? 'Checking...' : 'Check for Updates'}
          </button>

          {error && (
            <div className="error">
              <p>Error: {error}</p>
            </div>
          )}

          {updateInfo && (
            <div className="update-info">
              {updateInfo.available ? (
                <div className="update-available">
                  <h3>Update Available!</h3>
                  <p><strong>Version:</strong> {updateInfo.version}</p>
                  <p><strong>Date:</strong> {updateInfo.date}</p>
                  <div className="release-notes">
                    <h4>Release Notes:</h4>
                    <pre>{updateInfo.notes}</pre>
                  </div>
                  
                  {!isDownloading ? (
                    <button 
                      onClick={downloadAndInstall}
                      className="btn btn-success"
                    >
                      Download & Install Update
                    </button>
                  ) : (
                    <div className="download-progress">
                      <p>Downloading update...</p>
                      {downloadProgress && (
                        <div className="progress-bar">
                          <div 
                            className="progress-fill"
                            style={{ width: `${getProgressPercentage()}%` }}
                          ></div>
                          <span className="progress-text">
                            {getProgressPercentage()}%
                          </span>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ) : (
                <div className="no-updates">
                  <h3>No Updates Available</h3>
                  <p>You're running the latest version!</p>
                </div>
              )}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

export default App;
```

### 2. Update Styles (`src/App.css`)

```css
.container {
  max-width: 800px;
  margin: 0 auto;
  padding: 20px;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
}

.header {
  text-align: center;
  margin-bottom: 40px;
  padding-bottom: 20px;
  border-bottom: 1px solid #e0e0e0;
}

.header h1 {
  color: #333;
  margin-bottom: 10px;
}

.app-info {
  display: flex;
  justify-content: center;
  gap: 20px;
  font-size: 14px;
  color: #666;
}

.app-info p {
  margin: 0;
  padding: 5px 10px;
  background: #f5f5f5;
  border-radius: 4px;
}

.main {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.update-section {
  background: white;
  padding: 30px;
  border-radius: 8px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
}

.update-section h2 {
  margin-top: 0;
  color: #333;
  margin-bottom: 20px;
}

.btn {
  padding: 12px 24px;
  border: none;
  border-radius: 6px;
  font-size: 16px;
  cursor: pointer;
  transition: all 0.2s;
  font-weight: 500;
}

.btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.btn-primary {
  background: #007bff;
  color: white;
}

.btn-primary:hover:not(:disabled) {
  background: #0056b3;
}

.btn-success {
  background: #28a745;
  color: white;
  margin-top: 15px;
}

.btn-success:hover:not(:disabled) {
  background: #1e7e34;
}

.error {
  margin-top: 15px;
  padding: 15px;
  background: #f8d7da;
  border: 1px solid #f5c6cb;
  border-radius: 4px;
  color: #721c24;
}

.update-info {
  margin-top: 20px;
  padding: 20px;
  border-radius: 6px;
}

.update-available {
  background: #d1ecf1;
  border: 1px solid #bee5eb;
  color: #0c5460;
}

.no-updates {
  background: #d4edda;
  border: 1px solid #c3e6cb;
  color: #155724;
}

.update-available h3,
.no-updates h3 {
  margin-top: 0;
  margin-bottom: 10px;
}

.release-notes {
  margin: 15px 0;
}

.release-notes h4 {
  margin-bottom: 8px;
  color: #333;
}

.release-notes pre {
  background: #f8f9fa;
  padding: 10px;
  border-radius: 4px;
  white-space: pre-wrap;
  font-size: 14px;
  border: 1px solid #e9ecef;
}

.download-progress {
  margin-top: 15px;
}

.progress-bar {
  position: relative;
  width: 100%;
  height: 30px;
  background: #e9ecef;
  border-radius: 15px;
  overflow: hidden;
  margin-top: 10px;
}

.progress-fill {
  height: 100%;
  background: linear-gradient(90deg, #28a745, #20c997);
  transition: width 0.3s ease;
}

.progress-text {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  font-weight: bold;
  color: #333;
  font-size: 14px;
}
```

## GitHub Actions Setup

### 1. Create Workflow for Multiple Environments (`.github/workflows/build-and-release.yml`)

```yaml
name: Build and Release

on:
  push:
    branches: [ main, develop, qa ]
    tags: [ 'v*' ]
  pull_request:
    branches: [ main, develop, qa ]

jobs:
  build:
    strategy:
      fail-fast: false
      matrix:
        platform: [macos-latest, ubuntu-latest, windows-latest]
        environment: [dev, qa, prod]
        exclude:
          # Only build prod on main branch/tags
          - environment: prod
            platform: macos-latest
          - environment: prod
            platform: ubuntu-latest
          - environment: prod
            platform: windows-latest

    runs-on: ${{ matrix.platform }}

    steps:
    - uses: actions/checkout@v4

    - name: Setup Node.js
      uses: actions/setup-node@v4
      with:
        node-version: '18'
        cache: 'npm'

    - name: Setup Rust
      uses: dtolnay/rust-toolchain@stable

    - name: Install dependencies (Ubuntu only)
      if: matrix.platform == 'ubuntu-latest'
      run: |
        sudo apt-get update
        sudo apt-get install -y libgtk-3-dev libwebkit2gtk-4.0-dev libappindicator3-dev librsvg2-dev patchelf

    - name: Install pnpm
      run: npm install -g pnpm

    - name: Install dependencies
      run: pnpm install

    - name: Determine environment
      id: env
      run: |
        if [[ "${{ github.ref }}" == "refs/heads/main" ]] || [[ "${{ github.ref }}" == "refs/tags/v"* ]]; then
          echo "environment=prod" >> $GITHUB_OUTPUT
        elif [[ "${{ github.ref }}" == "refs/heads/qa" ]]; then
          echo "environment=qa" >> $GITHUB_OUTPUT
        else
          echo "environment=dev" >> $GITHUB_OUTPUT
        fi

    - name: Build Tauri App
      run: |
        case "${{ steps.env.outputs.environment }}" in
          "prod")
            pnpm run tauri:build:prod
            ;;
          "qa")
            pnpm run tauri:build:qa
            ;;
          *)
            pnpm run tauri:build:dev
            ;;
        esac
      env:
        TAURI_PRIVATE_KEY: ${{ secrets.TAURI_PRIVATE_KEY }}
        TAURI_KEY_PASSWORD: ${{ secrets.TAURI_KEY_PASSWORD }}

    - name: Upload artifacts
      uses: actions/upload-artifact@v4
      with:
        name: tauri-app-${{ matrix.platform }}-${{ steps.env.outputs.environment }}
        path: |
          src-tauri/target/release/bundle/
          !src-tauri/target/release/bundle/**/build/

  release:
    needs: build
    runs-on: ubuntu-latest
    if: startsWith(github.ref, 'refs/tags/v')
    
    steps:
    - uses: actions/checkout@v4
    
    - name: Download artifacts
      uses: actions/download-artifact@v4
      with:
        path: ./artifacts
    
    - name: Create Release
      uses: softprops/action-gh-release@v1
      with:
        files: |
          artifacts/**/*.dmg
          artifacts/**/*.deb
          artifacts/**/*.rpm
          artifacts/**/*.msi
          artifacts/**/*.exe
          artifacts/**/*.AppImage
        draft: false
        prerelease: false
      env:
        GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
```

## API Endpoints

### 1. Update Server Response Format

Your update API should return JSON in this format:

```json
{
  "version": "1.0.1",
  "notes": "Bug fixes and performance improvements",
  "pub_date": "2025-01-20T10:00:00Z",
  "platforms": {
    "darwin-aarch64": {
      "signature": "dW50cnVzdGVkIGNvbW1lbnQ6IHNpZ25hdHVyZSBmcm9tIHRhdXJpIHNlY3JldCBrZXkKUldRQ1FNdGlYbW1PbnZkclk2ckNteVJyVE5zaTlKS0grOHRJUUdYOGcxTnczMWFYaExYUzQraXEK...",
      "url": "https://github.com/yourusername/yourrepo/releases/download/v1.0.1/app-1.0.1-aarch64.dmg"
    },
    "darwin-x86_64": {
      "signature": "dW50cnVzdGVkIGNvbW1lbnQ6IHNpZ25hdHVyZSBmcm9tIHRhdXJpIHNlY3JldCBrZXkKUldRQ1FNdGlYbW1PbnZkclk2ckNteVJyVE5zaTlKS0grOHRJUUdYOGcxTnczMWFYaExYUzQraXEK...",
      "url": "https://github.com/yourusername/yourrepo/releases/download/v1.0.1/app-1.0.1-x64.dmg"
    },
    "linux-x86_64": {
      "signature": "dW50cnVzdGVkIGNvbW1lbnQ6IHNpZ25hdHVyZSBmcm9tIHRhdXJpIHNlY3JldCBrZXkKUldRQ1FNdGlYbW1PbnZkclk2ckNteVJyVE5zaTlKS0grOHRJUUdYOGcxTnczMWFYaExYUzQraXEK...",
      "url": "https://github.com/yourusername/yourrepo/releases/download/v1.0.1/app-1.0.1-amd64.AppImage"
    },
    "windows-x86_64": {
      "signature": "dW50cnVzdGVkIGNvbW1lbnQ6IHNpZ25hdHVyZSBmcm9tIHRhdXJpIHNlY3JldCBrZXkKUldRQ1FNdGlYbW1PbnZkclk2ckNteVJyVE5zaTlKS0grOHRJUUdYOGcxTnczMWFYaExYUzQraXEK...",
      "url": "https://github.com/yourusername/yourrepo/releases/download/v1.0.1/app-1.0.1-x64-setup.exe"
    }
  }
}
```

### 2. Environment-Specific Endpoints

- **Development**: `https://api-dev.yourcompany.com/updates/{{target}}/{{current_version}}`
- **QA**: `https://api-qa.yourcompany.com/updates/{{target}}/{{current_version}}`
- **Production**: `https://api.yourcompany.com/updates/{{target}}/{{current_version}}`

## Testing the Updater

### 1. Local Development Testing

```bash
# Start development server
pnpm run tauri:dev

# Build for different environments
pnpm run tauri:build:dev
pnpm run tauri:build:qa
pnpm run tauri:build:prod
```

### 2. Testing Update Flow

1. Build and release version 0.1.0
2. Update version to 0.1.1 in `Cargo.toml` and `package.json`
3. Set up your update server with the new version info
4. Build and release version 0.1.1
5. Run the 0.1.0 version and test the updater

### 3. Manual Testing Commands

```bash
# Check current version
tauri info

# Generate update signature
tauri signer sign -k myapp.key -f path/to/your/app.dmg

# Verify signature
tauri signer verify -k myapp.key.pub -f path/to/your/app.dmg -s signature
```

## Security Considerations

1. **Private Key Security**: Never commit your private key to version control
2. **API Security**: Use HTTPS for all update endpoints
3. **Signature Verification**: Always verify signatures before installing updates
4. **Environment Isolation**: Use different API endpoints for different environments
5. **Access Control**: Implement proper authentication for your update API

## Troubleshooting

### Common Issues:

1. **Update not detected**: Check endpoint URL and response format
2. **Signature verification failed**: Ensure correct public key is used
3. **Download failed**: Check network connectivity and file availability
4. **Installation failed**: Check file permissions and available disk space

### Debug Commands:

```bash
# Enable Tauri debug logs
RUST_LOG=tauri=debug pnpm run tauri:dev

# Check bundle contents
tar -tf your-app.tar.gz

# Verify API response
curl -v "https://api.yourcompany.com/updates/darwin-aarch64/0.1.0"
```

## Next Steps

1. Set up your update server API
2. Configure GitHub Actions for automated builds
3. Test the complete update flow
4. Monitor update success rates
5. Implement rollback mechanisms if needed

This setup provides a robust, production-ready auto-updater system for your Tauri application with proper environment separation and security measures.