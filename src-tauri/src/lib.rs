use serde::{Deserialize, Serialize};
use std::sync::Mutex;
use tauri::Emitter;
use tauri::Manager;
use tauri_plugin_updater::UpdaterExt;

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
                // Handle the date properly - convert to string or provide a default
                let date = match update.date {
                    Some(d) => d.to_string(),
                    None => "Unknown".to_string(),
                };

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
                            chunk_length: chunk_length as u64,
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

// Learn more about Tauri commands at https://tauri.app/develop/calling-rust/
#[tauri::command]
fn greet(name: &str) -> String {
    format!("Hello, {}! You've been greeted from Rust!", name)
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_dialog::init())
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
            greet,
            check_for_updates,
            download_and_install_update,
            get_app_version,
            get_app_environment
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
