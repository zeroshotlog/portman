use std::net::TcpListener;
use crate::models::LiveListener;

pub fn is_port_free(port: u16) -> bool {
    // Try to bind to 127.0.0.1
    // Note: Some apps bind to 0.0.0.0, which conflicts with 127.0.0.1 on some OS, but on Mac usually separate?
    // Actually, if something listens on 0.0.0.0, binding to 127.0.0.1 usually fails (EADDRINUSE).
    // If something listens on 127.0.0.1, binding to 127.0.0.1 fails.
    // So attempting to bind to 127.0.0.1 is a good check for "can I use this port for localhost dev?".
    TcpListener::bind(("127.0.0.1", port)).is_ok()
}

pub fn find_free_ports(range_start: u16, range_end: u16, count: usize, exclude_listeners: &[LiveListener]) -> Vec<u16> {
    let mut found = Vec::new();
    let occupied_ports: std::collections::HashSet<u16> = exclude_listeners.iter().map(|l| l.port).collect();

    for port in range_start..=range_end {
        if found.len() >= count {
            break;
        }
        
        // Fast path: if known occupied, skip
        if occupied_ports.contains(&port) {
            continue;
        }

        if is_port_free(port) {
            found.push(port);
        }
    }
    found
}
