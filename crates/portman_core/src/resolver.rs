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
