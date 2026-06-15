#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_deep_link::init())
        .setup(|app| {
            // On Android, always load from the live web URL so the APK
            // never needs to be rebuilt when web changes. The APK is a
            // thin shell — the web app is always up to date.
            #[cfg(target_os = "android")]
            {
                if let Some(window) = app.get_webview_window("main") {
                    let _ = window.navigate("https://zeavisedu.asepharyana.my.id");
                }
            }
            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
