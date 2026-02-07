# Portman

![Portman Banner](https://raw.githubusercontent.com/zeroshotlog/portman/main/assets/readme-banner.png)

Local port management tool for macOS.

## Features

- Real-time port scanning
- Custom label management (Port/PID/Pattern)
- Process detection (Node, Python, Docker, etc.)
- Find free ports
- MCP Server integration for AI assistants

## Requirements

- macOS 11.0 (Big Sur) or later
- Apple Silicon native

## Installation

Download the latest `.dmg` from [Releases](https://github.com/zeroshotlog/portman/releases).

1. Open the DMG file
2. Drag Portman.app to Applications
3. First launch: Right-click and select "Open"

> Note: This app is not signed. On first launch, macOS Gatekeeper will show a warning.

## MCP Server (AI Integration)

For Claude Code:
```bash
claude mcp add portman -- npx portman-mcp
```

For Claude Desktop, add to `claude_desktop_config.json`:
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

## License

- Desktop App: Proprietary EULA
- MCP Server (portman-mcp): MIT License

---

Copyright 2026 zeroshotlog
