#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

mod commands;

fn main() {
    tauri::Builder::default()
        .plugin(tauri_plugin_shell::init())
        .invoke_handler(tauri::generate_handler![
            commands::scan_listeners,
            commands::who,
            commands::find_free_ports,
            commands::get_labels,
            commands::set_label,
            commands::remove_label,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
