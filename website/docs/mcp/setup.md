# MCP Setup

Connect Portman to AI assistants via the Model Context Protocol (MCP).

## What is MCP?

MCP allows AI assistants like Claude to interact with external tools. With Portman's MCP server, your AI can:

- See which ports are in use
- Find available ports
- Manage labels
- Help resolve port conflicts

This is especially useful for **Vibe Coding** - AI-assisted development where you're rapidly creating and deploying services.

## Claude Code

The simplest setup:

```bash
claude mcp add portman -- npx portman-mcp
```

That's it! Claude Code will now have access to Portman's tools.

## Claude Desktop

Add to your MCP configuration file.

**macOS:** `~/Library/Application Support/Claude/claude_desktop_config.json`

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

Restart Claude Desktop to apply changes.

## Antigravity (Gemini)

Add to `~/.gemini/antigravity/mcp_config.json`:

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

## Always Use Latest Version

To ensure you're always using the latest version:

```bash
# Claude Code
claude mcp remove portman
claude mcp add portman -- npx -y portman-mcp@latest
```

For config files, use `portman-mcp@latest`:

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

## Verify Installation

Ask Claude: "What ports are currently active on my machine?"

If set up correctly, Claude will use Portman to scan and report your ports.
