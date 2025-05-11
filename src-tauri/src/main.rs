#[tauri::command]
async fn start_node_server() -> Result<(), String> {
    let mut cmd = tokio::process::Command::new("node");
    cmd.arg("../server/build/server-bundle.js");
    
    match cmd.spawn() {
        Ok(_child) => {
            // Store child process handle if you need to terminate it later
            Ok(())
        },
        Err(e) => Err(format!("Failed to start Node server: {}", e)),
    }
}

fn main() {
    tauri::Builder::default()
        .invoke_handler(tauri::generate_handler![start_node_server])
        .setup(|app| {
            // Start the server when the app is set up
            tauri::async_runtime::spawn(async {
                if let Err(e) = start_node_server().await {
                    eprintln!("Error starting Node server: {}", e);
                }
            });
            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}