mod commands;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_dialog::init())
        .invoke_handler(tauri::generate_handler![
            commands::open_dataset,
            commands::read_label,
            commands::write_label,
            commands::delete_images,
            commands::move_images,
            commands::list_image_categories,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
