use portman_core::models::{EnrichedListener, Label, LabelKeyType};
use portman_core::Portman;
use chrono::Utc;
use serde::Deserialize;

fn portman() -> Result<Portman, String> {
    Portman::new().map_err(|e| e.to_string())
}

#[tauri::command]
pub fn scan_listeners() -> Result<Vec<EnrichedListener>, String> {
    portman()?.scan().map_err(|e| e.to_string())
}

#[tauri::command]
pub fn who(port: u16) -> Result<Option<EnrichedListener>, String> {
    let results = portman()?.scan().map_err(|e| e.to_string())?;
    Ok(results.into_iter().find(|e| e.listener.port == port))
}

#[tauri::command]
pub fn find_free_ports(
    range_start: Option<u16>,
    range_end: Option<u16>,
    count: Option<usize>,
) -> Result<Vec<u16>, String> {
    let start = range_start.unwrap_or(3000);
    let end = range_end.unwrap_or(8000);
    let cnt = count.unwrap_or(10);
    portman()?.find_free_ports(start, end, cnt).map_err(|e| e.to_string())
}

#[tauri::command]
pub fn get_labels() -> Result<Vec<Label>, String> {
    portman()?.get_labels().map_err(|e| e.to_string())
}

#[derive(Deserialize)]
pub struct SetLabelArgs {
    pub key_type: LabelKeyType,
    pub key_value: String,
    pub name: String,
    pub note: Option<String>,
}

#[tauri::command]
pub fn set_label(args: SetLabelArgs) -> Result<(), String> {
    let now = Utc::now();
    let label = Label {
        id: None,
        key_type: args.key_type,
        key_value: args.key_value,
        name: args.name,
        note: args.note,
        created_at: now,
        updated_at: now,
    };
    portman()?.set_label(&label).map_err(|e| e.to_string())
}

#[tauri::command]
pub fn remove_label(key_type: LabelKeyType, key_value: String) -> Result<(), String> {
    portman()?.remove_label(key_type, &key_value).map_err(|e| e.to_string())
}
