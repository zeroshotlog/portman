use anyhow::Result;
use portman_core::{Portman, models::{Label, LabelKeyType}};
use serde::{Deserialize, Serialize};
use serde_json::{json, Value};
use tokio::io::{AsyncBufReadExt, AsyncWriteExt, BufReader};
use std::sync::{Arc, Mutex};

#[derive(Serialize, Deserialize, Debug)]
struct JsonRpcRequest {
    jsonrpc: String,
    method: String,
    params: Option<Value>,
    id: Option<Value>,
}

#[derive(Serialize, Deserialize, Debug)]
struct JsonRpcResponse {
    jsonrpc: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    result: Option<Value>,
    #[serde(skip_serializing_if = "Option::is_none")]
    error: Option<JsonRpcError>,
    id: Option<Value>,
}

#[derive(Serialize, Deserialize, Debug)]
struct JsonRpcError {
    code: i32,
    message: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    data: Option<Value>,
}

struct AppState {
    portman: Portman,
}

#[tokio::main]
async fn main() -> Result<()> {
    // Log to stderr
    eprintln!("Starting portman-mcp...");

    let app = Arc::new(Mutex::new(AppState {
        portman: Portman::new()?,
    }));

    let stdin = tokio::io::stdin();
    let stdout = tokio::io::stdout();
    
    let mut reader = BufReader::new(stdin);
    let mut writer = stdout;

    let mut line = String::new();
    loop {
        line.clear();
        let bytes_read = reader.read_line(&mut line).await?;
        if bytes_read == 0 {
            break; // EOF
        }

        let req: JsonRpcRequest = match serde_json::from_str(&line) {
            Ok(v) => v,
            Err(e) => {
                eprintln!("Failed to parse JSON: {}", e);
                continue;
            }
        };

        eprintln!("Received request: {} {}", req.method, req.id.as_ref().unwrap_or(&json!(null)));

        let response = handle_request(req, app.clone()).await;
        
        let response_str = serde_json::to_string(&response)?;
        writer.write_all(response_str.as_bytes()).await?;
        writer.write_all(b"\n").await?;
        writer.flush().await?;
    }

    Ok(())
}

async fn handle_request(req: JsonRpcRequest, app: Arc<Mutex<AppState>>) -> JsonRpcResponse {
    let result = match req.method.as_str() {
        "initialize" => {
            Ok(json!({
                "protocolVersion": "2024-11-05",
                "capabilities": {
                    "tools": {
                        "listChanged": false
                    }
                },
                "serverInfo": {
                    "name": "portman-mcp",
                    "version": env!("CARGO_PKG_VERSION")
                }
            }))
        },
        "notifications/initialized" => {
            // No response needed usually, but we return Ok(null) to ack if it was a call (but it's a notification, id is null usually)
            Ok(json!(null))
        },
        "tools/list" => {
            Ok(json!({
                "tools": [
                    {
                        "name": "scan_listeners",
                        "description": "Scan for active listeners and their labels",
                        "inputSchema": {
                            "type": "object",
                            "properties": {}
                        }
                    },
                    {
                        "name": "who",
                        "description": "Get details for a specific port",
                         "inputSchema": {
                            "type": "object",
                            "properties": {
                                "port": { "type": "integer" }
                            },
                            "required": ["port"]
                        }
                    },
                    {
                        "name": "ports_find",
                        "description": "Find free ports in range",
                        "inputSchema": {
                            "type": "object",
                            "properties": {
                                "range_start": { "type": "integer", "default": 3000 },
                                "range_end": { "type": "integer", "default": 8000 },
                                "count": { "type": "integer", "default": 10 }
                            }
                        }
                    },
                    {
                        "name": "label_list",
                        "description": "List all labels",
                        "inputSchema": { "type": "object", "properties": {} }
                    },
                    {
                        "name": "label_set_port",
                        "description": "Set label for a port",
                        "inputSchema": {
                            "type": "object",
                            "properties": {
                                "port": { "type": "integer" },
                                "name": { "type": "string" },
                                "note": { "type": "string" }
                            },
                            "required": ["port", "name"]
                        }
                    },
                     {
                        "name": "label_set_pid",
                        "description": "Set label for a PID",
                        "inputSchema": {
                            "type": "object",
                            "properties": {
                                "pid": { "type": "integer" },
                                "name": { "type": "string" },
                                "note": { "type": "string" }
                            },
                            "required": ["pid", "name"]
                        }
                    },
                     {
                        "name": "label_set_pattern",
                        "description": "Set label for a regex pattern (matched against process name or command)",
                        "inputSchema": {
                            "type": "object",
                            "properties": {
                                "pattern": { "type": "string" },
                                "name": { "type": "string" },
                                "note": { "type": "string" }
                            },
                            "required": ["pattern", "name"]
                        }
                    },
                     {
                        "name": "label_remove_port",
                        "description": "Remove label by port",
                        "inputSchema": {
                            "type": "object",
                            "properties": {
                                "port": { "type": "integer" }
                            },
                            "required": ["port"]
                        }
                    },
                    {
                        "name": "label_remove_pid",
                        "description": "Remove label by PID",
                        "inputSchema": {
                            "type": "object",
                            "properties": {
                                "pid": { "type": "integer" }
                            },
                            "required": ["pid"]
                        }
                    },
                    {
                        "name": "label_remove_pattern",
                        "description": "Remove label by pattern",
                        "inputSchema": {
                            "type": "object",
                            "properties": {
                                "pattern": { "type": "string" }
                            },
                            "required": ["pattern"]
                        }
                    }
                ]
            }))
        },
        "tools/call" => {
            handle_tool_call(req.params.as_ref(), app).await
        },
        _ => {
            // Ignore other methods or return error if not notification
            if req.id.is_some() {
                Err(anyhow::anyhow!("Method not found"))
            } else {
                Ok(json!(null))
            }
        }
    };

    match result {
        Ok(v) => JsonRpcResponse {
            jsonrpc: "2.0".to_string(),
            result: Some(v),
            error: None,
            id: req.id,
        },
        Err(e) => JsonRpcResponse {
            jsonrpc: "2.0".to_string(),
            result: None,
            error: Some(JsonRpcError {
                code: -32603,
                message: e.to_string(),
                data: None,
            }),
            id: req.id,
        }
    }
}

async fn handle_tool_call(params: Option<&Value>, app: Arc<Mutex<AppState>>) -> Result<Value> {
    let params = params.ok_or_else(|| anyhow::anyhow!("Missing params"))?;
    let name = params.get("name").and_then(|v| v.as_str()).ok_or_else(|| anyhow::anyhow!("Missing tool name"))?.to_string();
    let args = params.get("arguments").cloned().unwrap_or(json!({}));

    tokio::task::spawn_blocking(move || {
        let app = app.lock().map_err(|e| anyhow::anyhow!("Lock error: {}", e))?;

        match name.as_str() {
            "scan_listeners" => {
                 let listeners = app.portman.scan()?;
                 Ok(json!({
                     "content": [
                         {
                             "type": "text",
                             "text": serde_json::to_string_pretty(&listeners)?
                         }
                     ]
                 }))
            },
            "who" => {
                let port = args.get("port").and_then(|v| v.as_u64()).ok_or_else(|| anyhow::anyhow!("Missing port"))? as u16;
                let listeners = app.portman.scan()?;
                let target = listeners.into_iter().find(|l| l.listener.port == port);
                 Ok(json!({
                     "content": [
                         {
                             "type": "text",
                             "text": serde_json::to_string_pretty(&target)?
                         }
                     ]
                 }))
            },
            "ports_find" => {
                let start = args.get("range_start").and_then(|v| v.as_u64()).unwrap_or(3000) as u16;
                let end = args.get("range_end").and_then(|v| v.as_u64()).unwrap_or(8000) as u16;
                let count = args.get("count").and_then(|v| v.as_u64()).unwrap_or(10) as usize;

                let ports = app.portman.find_free_ports(start, end, count)?;
                Ok(json!({
                     "content": [
                         {
                             "type": "text",
                             "text": serde_json::to_string_pretty(&ports)?
                         }
                     ]
                 }))
            },
            "label_list" => {
                let labels = app.portman.get_labels()?;
                Ok(json!({
                     "content": [
                         {
                             "type": "text",
                             "text": serde_json::to_string_pretty(&labels)?
                         }
                     ]
                 }))
            },
            "label_set_port" => {
                 let port = args.get("port").and_then(|v| v.as_u64()).ok_or_else(|| anyhow::anyhow!("Missing port"))? as u16;
                 let name = args.get("name").and_then(|v| v.as_str()).ok_or_else(|| anyhow::anyhow!("Missing name"))?.to_string();
                 let note = args.get("note").and_then(|v| v.as_str()).map(|s| s.to_string());

                 let label = Label {
                     id: None,
                     key_type: LabelKeyType::Port,
                     key_value: port.to_string(),
                     name,
                     note,
                     created_at: chrono::Utc::now(),
                     updated_at: chrono::Utc::now(),
                 };
                 app.portman.set_label(&label)?;
                 Ok(json!({
                     "content": [{ "type": "text", "text": "OK" }]
                 }))
            },
            "label_set_pid" => {
                 let pid = args.get("pid").and_then(|v| v.as_i64()).ok_or_else(|| anyhow::anyhow!("Missing pid"))? as i32;
                 let name = args.get("name").and_then(|v| v.as_str()).ok_or_else(|| anyhow::anyhow!("Missing name"))?.to_string();
                 let note = args.get("note").and_then(|v| v.as_str()).map(|s| s.to_string());

                 let label = Label {
                     id: None,
                     key_type: LabelKeyType::Pid,
                     key_value: pid.to_string(),
                     name,
                     note,
                     created_at: chrono::Utc::now(),
                     updated_at: chrono::Utc::now(),
                 };
                 app.portman.set_label(&label)?;
                 Ok(json!({
                     "content": [{ "type": "text", "text": "OK" }]
                 }))
            },
            "label_set_pattern" => {
                 let pattern = args.get("pattern").and_then(|v| v.as_str()).ok_or_else(|| anyhow::anyhow!("Missing pattern"))?.to_string();
                 let name = args.get("name").and_then(|v| v.as_str()).ok_or_else(|| anyhow::anyhow!("Missing name"))?.to_string();
                 let note = args.get("note").and_then(|v| v.as_str()).map(|s| s.to_string());

                 let label = Label {
                     id: None,
                     key_type: LabelKeyType::Pattern,
                     key_value: pattern,
                     name,
                     note,
                     created_at: chrono::Utc::now(),
                     updated_at: chrono::Utc::now(),
                 };
                 app.portman.set_label(&label)?;
                 Ok(json!({
                     "content": [{ "type": "text", "text": "OK" }]
                 }))
            },
            "label_remove_port" => {
                 let port = args.get("port").and_then(|v| v.as_u64()).ok_or_else(|| anyhow::anyhow!("Missing port"))? as u16;
                 app.portman.remove_label(LabelKeyType::Port, &port.to_string())?;
                  Ok(json!({
                     "content": [{ "type": "text", "text": "OK" }]
                 }))
            },
            "label_remove_pid" => {
                 let pid = args.get("pid").and_then(|v| v.as_i64()).ok_or_else(|| anyhow::anyhow!("Missing pid"))? as i32;
                 app.portman.remove_label(LabelKeyType::Pid, &pid.to_string())?;
                  Ok(json!({
                     "content": [{ "type": "text", "text": "OK" }]
                 }))
            },
            "label_remove_pattern" => {
                 let pattern = args.get("pattern").and_then(|v| v.as_str()).ok_or_else(|| anyhow::anyhow!("Missing pattern"))?.to_string();
                 app.portman.remove_label(LabelKeyType::Pattern, &pattern)?;
                  Ok(json!({
                     "content": [{ "type": "text", "text": "OK" }]
                 }))
            },
            _ => Err(anyhow::anyhow!("Tool not implemented: {}", name))
        }
    }).await?
}
