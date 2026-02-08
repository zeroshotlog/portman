use rusqlite::{params, Connection};
use crate::models::{Label, LabelKeyType};
use chrono::{Utc, DateTime};
use std::path::Path;
use std::fs;
use anyhow::{Result, Context};

pub struct SqliteLabelRepository {
    conn: Connection,
}

impl SqliteLabelRepository {
    pub fn new(path: &Path) -> Result<Self> {
        if let Some(parent) = path.parent() {
            fs::create_dir_all(parent).with_context(|| format!("Failed to create directory: {:?}", parent))?;
        }
        let conn = Connection::open(path)?;
        let repo = Self { conn };
        repo.init_schema()?;
        Ok(repo)
    }

    fn init_schema(&self) -> Result<()> {
         self.conn.execute(
            "CREATE TABLE IF NOT EXISTS labels (
                id INTEGER PRIMARY KEY,
                key_type TEXT NOT NULL,
                key_value TEXT NOT NULL,
                name TEXT NOT NULL,
                note TEXT,
                created_at TEXT NOT NULL,
                updated_at TEXT NOT NULL,
                UNIQUE(key_type, key_value)
            )",
            [],
        )?;
        Ok(())
    }

    pub fn upsert(&self, label: &Label) -> Result<()> {
        let now = Utc::now().to_rfc3339();
        let key_type_str = label.key_type.to_string();
        
        self.conn.execute(
            "INSERT INTO labels (key_type, key_value, name, note, created_at, updated_at)
             VALUES (?1, ?2, ?3, ?4, ?5, ?6)
             ON CONFLICT(key_type, key_value) DO UPDATE SET
             name = excluded.name,
             note = excluded.note,
             updated_at = excluded.updated_at
            ",
            params![
                key_type_str,
                label.key_value,
                label.name,
                label.note,
                now,
                now
            ],
        )?;
        Ok(())
    }

    pub fn get_all(&self) -> Result<Vec<Label>> {
        let mut stmt = self.conn.prepare("SELECT id, key_type, key_value, name, note, created_at, updated_at FROM labels")?;
        let label_iter = stmt.query_map([], |row| {
            let key_type_str: String = row.get(1)?;
            let key_type = key_type_str.parse().map_err(|e| rusqlite::Error::FromSqlConversionFailure(1, rusqlite::types::Type::Text, Box::new(e)))?;
            
            let created_at_str: String = row.get(5)?;
            let updated_at_str: String = row.get(6)?;
            
            Ok(Label {
                id: row.get(0)?,
                key_type,
                key_value: row.get(2)?,
                name: row.get(3)?,
                note: row.get(4)?,
                created_at: DateTime::parse_from_rfc3339(&created_at_str).map(|dt| dt.with_timezone(&Utc)).unwrap_or_else(|e| {
                    eprintln!("[Portman] Failed to parse created_at '{}': {}", created_at_str, e);
                    Utc::now()
                }),
                updated_at: DateTime::parse_from_rfc3339(&updated_at_str).map(|dt| dt.with_timezone(&Utc)).unwrap_or_else(|e| {
                    eprintln!("[Portman] Failed to parse updated_at '{}': {}", updated_at_str, e);
                    Utc::now()
                }),
            })
        })?;

        let mut labels = Vec::new();
        for label in label_iter {
            labels.push(label?);
        }
        Ok(labels)
    }

    pub fn delete(&self, key_type: LabelKeyType, key_value: &str) -> Result<()> {
        self.conn.execute(
            "DELETE FROM labels WHERE key_type = ?1 AND key_value = ?2",
            params![key_type.to_string(), key_value],
        )?;
        Ok(())
    }
}
