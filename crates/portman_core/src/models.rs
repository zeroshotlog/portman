use serde::{Deserialize, Serialize};
use chrono::{DateTime, Utc};
use std::fmt;
use std::path::Path;
use thiserror::Error;

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
pub struct LiveListener {
    pub port: u16,
    pub pid: Option<i32>,
    pub process: Option<String>,
    pub command: Option<String>,
    pub inferred_type: Option<String>,
    pub cwd: Option<String>,
    pub cwd_short: Option<String>,
}

/// Shorten a path to the last 2 components (e.g. "/Users/foo/personal/myapp" -> "/personal/myapp")
pub fn shorten_path(path: &str) -> String {
    let p = Path::new(path);
    let components: Vec<&str> = p.components()
        .filter_map(|c| c.as_os_str().to_str())
        .collect();
    let len = components.len();
    if len >= 2 {
        format!("/{}/{}", components[len - 2], components[len - 1])
    } else if len == 1 {
        format!("/{}", components[0])
    } else {
        path.to_string()
    }
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
pub struct EnrichedListener {
    pub listener: LiveListener,
    pub label: Option<Label>,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
pub enum LabelKeyType {
    Port,
    Pid,
    Pattern,
}

impl fmt::Display for LabelKeyType {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        match self {
            LabelKeyType::Port => write!(f, "port"),
            LabelKeyType::Pid => write!(f, "pid"),
            LabelKeyType::Pattern => write!(f, "pattern"),
        }
    }
}

#[derive(Debug, Error)]
#[error("Invalid key type: {0}")]
pub struct ParseLabelKeyTypeError(String);

impl std::str::FromStr for LabelKeyType {
    type Err = ParseLabelKeyTypeError;

    fn from_str(s: &str) -> Result<Self, Self::Err> {
        match s.to_lowercase().as_str() {
            "port" => Ok(LabelKeyType::Port),
            "pid" => Ok(LabelKeyType::Pid),
            "pattern" => Ok(LabelKeyType::Pattern),
            _ => Err(ParseLabelKeyTypeError(s.to_string())),
        }
    }
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
pub struct Label {
    pub id: Option<i64>,
    pub key_type: LabelKeyType,
    pub key_value: String,
    pub name: String,
    pub note: Option<String>,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_label_key_type_from_str() {
        assert_eq!("port".parse::<LabelKeyType>().unwrap(), LabelKeyType::Port);
        assert_eq!("pid".parse::<LabelKeyType>().unwrap(), LabelKeyType::Pid);
        assert_eq!("pattern".parse::<LabelKeyType>().unwrap(), LabelKeyType::Pattern);
        assert_eq!("PORT".parse::<LabelKeyType>().unwrap(), LabelKeyType::Port);
    }

    #[test]
    fn test_label_key_type_from_str_invalid() {
        assert!("invalid".parse::<LabelKeyType>().is_err());
    }

    #[test]
    fn test_label_key_type_display_roundtrip() {
        for variant in [LabelKeyType::Port, LabelKeyType::Pid, LabelKeyType::Pattern] {
            let s = variant.to_string();
            let parsed: LabelKeyType = s.parse().unwrap();
            assert_eq!(parsed, variant);
        }
    }
}
