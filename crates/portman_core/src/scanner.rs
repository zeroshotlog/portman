use std::process::Command;
use std::sync::OnceLock;
use crate::models::LiveListener;
use regex::Regex;
use std::io;

static LSOF_RE: OnceLock<Regex> = OnceLock::new();

fn lsof_regex() -> &'static Regex {
    LSOF_RE.get_or_init(|| {
        Regex::new(r"^(?P<command>\S+)\s+(?P<pid>\d+)\s+\S+\s+\S+\s+\S+\s+\S+\s+\S+\s+\S+\s+(?P<name>.*)$")
            .expect("Invalid built-in regex")
    })
}

pub fn scan_listeners() -> io::Result<Vec<LiveListener>> {
    let output = Command::new("lsof")
        .args(["-nP", "-iTCP", "-sTCP:LISTEN"])
        .output()?;

    // lsof returns exit code 1 when no listeners found, which is valid
    if !output.status.success() && output.status.code() != Some(1) {
         return Err(io::Error::other("lsof failed"));
    }

    let stdout = String::from_utf8_lossy(&output.stdout);
    parse_lsof_output(&stdout)
}

fn parse_lsof_output(output: &str) -> io::Result<Vec<LiveListener>> {
    let mut listeners = Vec::new();
    let lines: Vec<&str> = output.lines().collect();

    let re = lsof_regex();

    for line in lines.iter().skip(1) {
        if line.trim().is_empty() { continue; }
        
        if let Some(caps) = re.captures(line) {
            let command_name = caps.name("command").map(|m| m.as_str().to_string());
            let pid_str = caps.name("pid").map(|m| m.as_str());
            let name_field = caps.name("name").map(|m| m.as_str()).unwrap_or("");
            
            if let Some(port) = extract_port(name_field) {
                let pid = pid_str.and_then(|s| s.parse::<i32>().ok());
                let inferred = infer_type(command_name.as_deref(), port);

                listeners.push(LiveListener {
                    port,
                    pid,
                    process: command_name.clone(),
                    command: None, 
                    inferred_type: inferred,
                });
            }
        }
    }
    
    Ok(listeners)

}

fn extract_port(name_field: &str) -> Option<u16> {
    let clean = name_field.replace(" (LISTEN)", "");
    let parts: Vec<&str> = clean.split(':').collect();
    if let Some(last) = parts.last() {
        return last.parse::<u16>().ok();
    }
    None
}

fn infer_type(process: Option<&str>, port: u16) -> Option<String> {
    // Port based heuristics
    match port {
        3000..=3010 => return Some("react/next".to_string()),
        5173 | 4173 => return Some("vite".to_string()),
        8000 | 8080 => return Some("http-server".to_string()),
        5432 => return Some("postgres".to_string()),
        6379 => return Some("redis".to_string()),
        3306 => return Some("mysql".to_string()),
        _ => {}
    }

    if let Some(proc) = process {
        let p = proc.to_lowercase();
        if p.contains("node") {
             return Some("node".to_string());
        }
        if p.contains("python") || p.contains("uvicorn") {
            return Some("python".to_string());
        }
        if p.contains("docker") || p.contains("com.dock") {
            return Some("docker".to_string());
        }
    }
    None
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_parse_lsof() {
        let sample = "COMMAND     PID         USER   FD   TYPE             DEVICE SIZE/OFF NODE NAME
control   62719 reverseblade   20u  IPv4 0x6e6e23b207d5791d      0t0  TCP 127.0.0.1:5000 (LISTEN)
node      12345 reverseblade   20u  IPv4 0x...      0t0  TCP *:3000 (LISTEN)
";
        let parsed = parse_lsof_output(sample).unwrap();
        assert_eq!(parsed.len(), 2);
        assert_eq!(parsed[0].port, 5000);
        assert_eq!(parsed[0].pid, Some(62719));
        assert_eq!(parsed[0].process.as_deref(), Some("control"));

        assert_eq!(parsed[1].port, 3000);
        assert_eq!(parsed[1].process.as_deref(), Some("node"));
        assert_eq!(parsed[1].inferred_type.as_deref(), Some("react/next"));
    }

    #[test]
    fn test_parse_lsof_empty_output() {
        let parsed = parse_lsof_output("").unwrap();
        assert!(parsed.is_empty());
    }

    #[test]
    fn test_parse_lsof_header_only() {
        let sample = "COMMAND     PID         USER   FD   TYPE             DEVICE SIZE/OFF NODE NAME\n";
        let parsed = parse_lsof_output(sample).unwrap();
        assert!(parsed.is_empty());
    }

    #[test]
    fn test_extract_port_ipv4() {
        assert_eq!(extract_port("127.0.0.1:5000 (LISTEN)"), Some(5000));
    }

    #[test]
    fn test_extract_port_wildcard() {
        assert_eq!(extract_port("*:3000 (LISTEN)"), Some(3000));
    }

    #[test]
    fn test_extract_port_ipv6() {
        assert_eq!(extract_port("[::1]:8080 (LISTEN)"), Some(8080));
    }

    #[test]
    fn test_infer_type_by_port() {
        assert_eq!(infer_type(None, 5173), Some("vite".to_string()));
        assert_eq!(infer_type(None, 3000), Some("react/next".to_string()));
        assert_eq!(infer_type(None, 5432), Some("postgres".to_string()));
        assert_eq!(infer_type(None, 6379), Some("redis".to_string()));
        assert_eq!(infer_type(None, 3306), Some("mysql".to_string()));
        assert_eq!(infer_type(None, 8080), Some("http-server".to_string()));
    }

    #[test]
    fn test_infer_type_by_process() {
        assert_eq!(infer_type(Some("node"), 9999), Some("node".to_string()));
        assert_eq!(infer_type(Some("python3"), 9999), Some("python".to_string()));
        assert_eq!(infer_type(Some("uvicorn"), 9999), Some("python".to_string()));
        assert_eq!(infer_type(Some("com.docker.backend"), 9999), Some("docker".to_string()));
    }

    #[test]
    fn test_infer_type_unknown() {
        assert_eq!(infer_type(Some("myapp"), 9999), None);
        assert_eq!(infer_type(None, 9999), None);
    }
}
