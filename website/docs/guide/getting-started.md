# Getting Started

Get up and running with Portman in minutes.

## Choose Your Setup

### Option 1: Desktop App

For a visual interface to manage your ports.

1. Download the latest `.dmg` from [GitHub Releases](https://github.com/zeroshotlog/portman/releases)
2. Open the DMG and drag Portman to Applications
3. Launch Portman

::: tip First Launch on macOS
Since Portman is not signed with an Apple Developer certificate, you'll need to:
1. Right-click (or Control-click) on Portman.app
2. Select "Open" from the context menu
3. Click "Open" in the dialog
:::

### Option 2: MCP Server

For AI-assisted port management with Claude.

**Claude Code:**
```bash
claude mcp add portman -- npx portman-mcp
```

**Claude Desktop:**

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

## Requirements

- **macOS** 11.0 (Big Sur) or later
- **Apple Silicon** (M1/M2/M3)
- **Node.js** 16+ (for MCP server only)

## Next Steps

- [Learn about Active Ports](/guide/active-ports)
- [Find Free Ports](/guide/find-free)
- [Set up MCP](/mcp/setup)
