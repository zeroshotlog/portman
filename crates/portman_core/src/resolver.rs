use crate::models::{LiveListener, Label, EnrichedListener, LabelKeyType};
use regex::Regex;

pub fn resolve_enrichment(listeners: Vec<LiveListener>, labels: Vec<Label>) -> Vec<EnrichedListener> {
    // Separate labels by type for efficiency
    let mut port_labels = std::collections::HashMap::new();
    let mut pid_labels = std::collections::HashMap::new();
    let mut pattern_labels = Vec::new();

    for label in labels {
        match label.key_type {
            LabelKeyType::Port => {
                if let Ok(p) = label.key_value.parse::<u16>() {
                    port_labels.insert(p, label);
                }
            },
            LabelKeyType::Pid => {
                 if let Ok(pid) = label.key_value.parse::<i32>() {
                    pid_labels.insert(pid, label);
                }
            },
            LabelKeyType::Pattern => {
                if let Ok(re) = Regex::new(&label.key_value) {
                    pattern_labels.push((re, label));
                }
            }
        }
    }

    listeners.into_iter().map(|l| {
        // Priority: PID > Port > Pattern
        let mut matched_label = None;

        // Check PID
        if let Some(pid) = l.pid {
            if let Some(label) = pid_labels.get(&pid) {
                matched_label = Some(label.clone());
            }
        }

        // Check Port
        if matched_label.is_none() {
            if let Some(label) = port_labels.get(&l.port) {
                matched_label = Some(label.clone());
            }
        }

        // Check Pattern (against process or command or inferred type?)
        // Requirement says: "pattern is process/command string regex"
        if matched_label.is_none() {
             for (re, label) in &pattern_labels {
                 let mut matched = false;
                 if let Some(proc) = &l.process {
                     if re.is_match(proc) { matched = true; }
                 }
                 if !matched {
                     // Check command if available (currently None in lsof parse but good to have)
                     if let Some(cmd) = &l.command {
                         if re.is_match(cmd) { matched = true; }
                     }
                 }
                 
                 if matched {
                     matched_label = Some(label.clone());
                     break; // first match wins? or last? First match in list seems ok.
                 }
             }
        }

        EnrichedListener {
            listener: l,
            label: matched_label,
        }
    }).collect()
}

#[cfg(test)]
mod tests {
    use super::*;
    use chrono::Utc;

    fn make_listener(port: u16, pid: Option<i32>, process: Option<&str>) -> LiveListener {
        LiveListener {
            port,
            pid,
            process: process.map(|s| s.to_string()),
            command: None,
            inferred_type: None,
        }
    }

    fn make_label(key_type: LabelKeyType, key_value: &str, name: &str) -> Label {
        Label {
            id: None,
            key_type,
            key_value: key_value.to_string(),
            name: name.to_string(),
            note: None,
            created_at: Utc::now(),
            updated_at: Utc::now(),
        }
    }

    #[test]
    fn test_pid_label_takes_priority_over_port() {
        let listeners = vec![make_listener(3000, Some(100), Some("node"))];
        let labels = vec![
            make_label(LabelKeyType::Port, "3000", "port-label"),
            make_label(LabelKeyType::Pid, "100", "pid-label"),
        ];
        let enriched = resolve_enrichment(listeners, labels);
        assert_eq!(enriched[0].label.as_ref().unwrap().name, "pid-label");
    }

    #[test]
    fn test_port_label_takes_priority_over_pattern() {
        let listeners = vec![make_listener(3000, None, Some("node"))];
        let labels = vec![
            make_label(LabelKeyType::Pattern, "node", "pattern-label"),
            make_label(LabelKeyType::Port, "3000", "port-label"),
        ];
        let enriched = resolve_enrichment(listeners, labels);
        assert_eq!(enriched[0].label.as_ref().unwrap().name, "port-label");
    }

    #[test]
    fn test_pattern_matches_process_name() {
        let listeners = vec![make_listener(9999, None, Some("uvicorn"))];
        let labels = vec![make_label(LabelKeyType::Pattern, "uvi.*", "api")];
        let enriched = resolve_enrichment(listeners, labels);
        assert_eq!(enriched[0].label.as_ref().unwrap().name, "api");
    }

    #[test]
    fn test_no_label_matched() {
        let listeners = vec![make_listener(9999, None, Some("myapp"))];
        let labels = vec![make_label(LabelKeyType::Port, "3000", "other")];
        let enriched = resolve_enrichment(listeners, labels);
        assert!(enriched[0].label.is_none());
    }
}
