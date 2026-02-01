# Portman

[![crates.io](https://img.shields.io/crates/v/portman-mcp.svg)](https://crates.io/crates/portman-mcp)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

Portman is a local port visibility and management tool for macOS. It works as both a CLI tool and an MCP (Model Context Protocol) server.

Quickly see which ports are in use, avoid port conflicts, and keep your local development environment organized.

## Features

- **Listener Scanning**: Lists all TCP ports in LISTEN state via `lsof`
- **Intelligent Inference**: Identifies running apps (Vite, Next.js, Python, Docker, etc.) from process names and port numbers
- **Free Port Finder**: Searches for available ports within a configurable range
- **Persistent Labels**: Assign names and notes to ports, PIDs, or command patterns (regex), stored in SQLite
- **MCP Support**: Integrates directly with AI agents like Claude Code and Antigravity

## Requirements

- macOS (Intel / Apple Silicon)

## Installation

```bash
cargo install portman-mcp
```

## CLI Usage

```bash
portman scan              # List active listeners
portman scan --json       # Output as JSON
portman who <port>        # Show details for a specific port
portman ports find        # Find available ports (default: 3000-8000, 10 ports)
```

### Label Management

```bash
# Label by port number
portman label set --port 5173 --name "My React App" --note "Main frontend"

# Label by PID
portman label set --pid 12345 --name "Worker"

# Label by command regex pattern (recommended)
portman label set --pattern "uvicorn.*main:app" --name "API Backend"

# List / remove labels
portman label list
portman label remove --port 5173
```

## MCP Setup

### Claude Code

```bash
claude mcp add portman -- portman-mcp
```

### Claude Desktop / Antigravity

Add to your `claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "portman": {
      "command": "portman-mcp",
      "args": []
    }
  }
}
```

### Available MCP Tools

| Tool | Description |
| --- | --- |
| `scan_listeners` | List active port listeners |
| `who` | Get details for a specific port |
| `ports_find` | Find free ports in range |
| `label_set_port` / `label_set_pid` / `label_set_pattern` | Set a label |
| `label_list` | List all labels |
| `label_remove_port` / `label_remove_pid` / `label_remove_pattern` | Remove a label |

## License

MIT License
