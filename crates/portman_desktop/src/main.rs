#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

mod commands;

#[cfg(target_os = "macos")]
mod macos {
    use objc2::rc::Retained;
    use objc2::runtime::{AnyClass, AnyObject};
    use objc2::{msg_send, AnyThread as _};
    use objc2::MainThreadMarker;
    use objc2_app_kit::{NSApplication, NSImage};
    use objc2_foundation::{NSData, NSString};

    fn load_icon() -> Option<Retained<NSImage>> {
        let png = include_bytes!("../icons/128x128@2x.png");
        let data = NSData::with_bytes(png);
        NSImage::initWithData(NSImage::alloc(), &data)
    }

    pub fn set_app_icon() {
        let Some(mtm) = MainThreadMarker::new() else { return };
        if let Some(image) = load_icon() {
            let app = NSApplication::sharedApplication(mtm);
            unsafe { app.setApplicationIconImage(Some(&image)) };
        }
    }

    #[tauri::command]
    pub fn show_about() {
        let Some(mtm) = MainThreadMarker::new() else { return };
        let app = NSApplication::sharedApplication(mtm);

        // Build options dictionary with icon explicitly
        unsafe {
            let dict_cls = AnyClass::get(c"NSMutableDictionary").unwrap();
            let dict: Retained<AnyObject> = msg_send![dict_cls, new];

            if let Some(icon) = load_icon() {
                let key = NSString::from_str("ApplicationIcon");
                let _: () = msg_send![&dict, setObject: &*icon, forKey: &*key];
            }

            let set = |key: &str, val: &str| {
                let k = NSString::from_str(key);
                let v = NSString::from_str(val);
                let _: () = msg_send![&dict, setObject: &*v, forKey: &*k];
            };
            set("ApplicationName", "Portman");
            set("Version", "0.1.1");
            set("Copyright", "Copyright 2026 zeroshotlog");

            let _: () = msg_send![&app, orderFrontStandardAboutPanelWithOptions: &*dict];
        }
    }
}

fn main() {
    let app = tauri::Builder::default()
        .plugin(tauri_plugin_shell::init())
        .plugin(tauri_plugin_window_state::Builder::new().build())
        .setup(|_app| {
            #[cfg(target_os = "macos")]
            macos::set_app_icon();
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            commands::scan_listeners,
            commands::who,
            commands::find_free_ports,
            commands::get_labels,
            commands::set_label,
            commands::remove_label,
            macos::show_about,
        ])
        .build(tauri::generate_context!())
        .expect("error while building tauri application");

    app.run(|app_handle, event| {
        use tauri::Manager;
        match event {
            tauri::RunEvent::WindowEvent {
                event: tauri::WindowEvent::CloseRequested { api, .. },
                label,
                ..
            } => {
                api.prevent_close();
                if let Some(w) = app_handle.get_webview_window(&label) {
                    let _ = w.hide();
                }
            }
            tauri::RunEvent::Reopen { .. } => {
                if let Some(w) = app_handle.get_webview_window("main") {
                    let _ = w.show();
                    let _ = w.set_focus();
                }
            }
            _ => {}
        }
    });
}
