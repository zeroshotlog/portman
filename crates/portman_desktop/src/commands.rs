use portman_core::models::{EnrichedListener, Label, LabelKeyType};
use portman_core::Portman;
use chrono::Utc;
use serde::Deserialize;
use std::sync::Mutex;

pub type PortmanState = Mutex<Portman>;

pub const MAX_LABEL_LENGTH: usize = 100;

fn validate_label_text(value: &str, field_name: &str) -> Result<(), String> {
    if value.is_empty() {
        return Err(format!("{} cannot be empty", field_name));
    }
    if value.len() > MAX_LABEL_LENGTH {
        return Err(format!("{} must be {} characters or less", field_name, MAX_LABEL_LENGTH));
    }
    if value.chars().any(|c| c.is_control()) {
        return Err(format!("{} contains invalid characters", field_name));
    }
    Ok(())
}

/// Sanitize error messages to avoid exposing internal details
fn sanitize_error(e: impl std::fmt::Display) -> String {
    let msg = e.to_string();
    // Log full error for debugging (in development)
    #[cfg(debug_assertions)]
    eprintln!("[Portman Error] {}", msg);

    // Return generic message in production
    if msg.contains("database") || msg.contains("sqlite") {
        "Database operation failed".to_string()
    } else if msg.contains("lsof") {
        "Failed to scan ports".to_string()
    } else if msg.contains("permission") || msg.contains("Permission") {
        "Permission denied".to_string()
    } else {
        "An error occurred".to_string()
    }
}

#[tauri::command]
pub fn scan_listeners(state: tauri::State<'_, PortmanState>) -> Result<Vec<EnrichedListener>, String> {
    let portman = state.lock().map_err(sanitize_error)?;
    portman.scan().map_err(sanitize_error)
}

#[tauri::command]
pub fn who(port: u16, state: tauri::State<'_, PortmanState>) -> Result<Option<EnrichedListener>, String> {
    let portman = state.lock().map_err(sanitize_error)?;
    let results = portman.scan().map_err(sanitize_error)?;
    Ok(results.into_iter().find(|e| e.listener.port == port))
}

#[tauri::command]
pub fn find_free_ports(
    range_start: Option<u16>,
    range_end: Option<u16>,
    count: Option<usize>,
    state: tauri::State<'_, PortmanState>,
) -> Result<Vec<u16>, String> {
    let start = range_start.unwrap_or(3000);
    let end = range_end.unwrap_or(8000);
    let cnt = count.unwrap_or(10);
    if start < 1 {
        return Err("Start port must be at least 1".to_string());
    }
    if end < start {
        return Err("End port must be greater than or equal to start port".to_string());
    }
    let portman = state.lock().map_err(sanitize_error)?;
    portman.find_free_ports(start, end, cnt).map_err(sanitize_error)
}

#[tauri::command]
pub fn get_labels(state: tauri::State<'_, PortmanState>) -> Result<Vec<Label>, String> {
    let portman = state.lock().map_err(sanitize_error)?;
    portman.get_labels().map_err(sanitize_error)
}

#[derive(Deserialize)]
pub struct SetLabelArgs {
    pub key_type: LabelKeyType,
    pub key_value: String,
    pub name: String,
    pub note: Option<String>,
}

#[tauri::command]
pub fn set_label(args: SetLabelArgs, state: tauri::State<'_, PortmanState>) -> Result<(), String> {
    validate_label_text(&args.key_value, "Key value")?;
    validate_label_text(&args.name, "Label name")?;
    if let Some(ref note) = args.note {
        validate_label_text(note, "Note")?;
    }
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
    let portman = state.lock().map_err(sanitize_error)?;
    portman.set_label(&label).map_err(sanitize_error)
}

#[tauri::command]
pub fn remove_label(key_type: LabelKeyType, key_value: String, state: tauri::State<'_, PortmanState>) -> Result<(), String> {
    validate_label_text(&key_value, "Key value")?;
    let portman = state.lock().map_err(sanitize_error)?;
    portman.remove_label(key_type, &key_value).map_err(sanitize_error)
}
