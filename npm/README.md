# Portman

[![npm](https://img.shields.io/npm/v/portman-mcp.svg)](https://www.npmjs.com/package/portman-mcp)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

Portman is a local port visibility and management tool for macOS. It works as an MCP (Model Context Protocol) server that integrates with AI agents like Claude Code.

Quickly see which ports are in use, avoid port conflicts, and keep your local development environment organized.

## Requirements

- macOS (Intel / Apple Silicon)
- Node.js 16+

## MCP Setup

### Claude Code

```bash
claude mcp add portman -- npx portman-mcp
```

### Claude Desktop

Add to your `claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "portman": {
      "command": "npx",
      "args": ["portman-mcp"]
    }
  }
}
```

### Antigravity

Add to your `~/.gemini/antigravity/mcp_config.json`:

```json
{
  "mcpServers": {
    "portman": {
      "command": "npx",
      "args": ["portman-mcp"]
    }
  }
}
```

## Updating

npx caches packages locally. To update to the latest version:

```bash
npx portman-mcp@latest
```

To always use the latest version in your MCP config, use `portman-mcp@latest` instead of `portman-mcp`:

```bash
# Claude Code
claude mcp remove portman
claude mcp add portman -- npx -y portman-mcp@latest
```

Claude Desktop (`claude_desktop_config.json`) / Antigravity (`~/.gemini/antigravity/mcp_config.json`):

```json
{
  "mcpServers": {
    "portman": {
      "command": "npx",
      "args": ["-y", "portman-mcp@latest"]
    }
  }
}
```

## Available MCP Tools

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
