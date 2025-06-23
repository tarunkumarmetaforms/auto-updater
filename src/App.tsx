//@ts-nocheck
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
          <p>Version: {appVersion} dadasd asd asd as as asd asd asd asd </p>
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
