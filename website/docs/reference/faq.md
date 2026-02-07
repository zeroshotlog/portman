# FAQ

## General

### Is Portman free?

Yes! Portman is currently free during the beta period.

### Does it work on Intel Macs?

Currently, the desktop app is built for Apple Silicon only. The MCP server works on both Intel and Apple Silicon.

### Is my data sent anywhere?

No. Portman works entirely locally. No data is sent to any external servers.

---

## Desktop App

### Why do I see a security warning on first launch?

Portman is not signed with an Apple Developer certificate ($99/year). This is common for free/indie macOS apps. See [Installation](/guide/installation) for how to bypass the warning safely.

### Where is my data stored?

Labels are stored in `~/.local/share/portman/labels.sqlite`.

### How do I completely uninstall Portman?

1. Delete `Portman.app` from Applications
2. Remove data: `rm -rf ~/.local/share/portman`

---

## MCP Server

### What AI assistants are supported?

Any MCP-compatible client:
- Claude Desktop
- Claude Code
- Antigravity (Gemini)
- Other MCP clients

### Do I need the desktop app to use MCP?

No. The MCP server (`portman-mcp`) works independently.

### How do I update the MCP server?

```bash
npx portman-mcp@latest
```

Or reinstall with `@latest` in your MCP config.

---

## Vibe Coding

### What is Vibe Coding?

Vibe Coding is AI-assisted development where you collaborate with AI to write code rapidly. This often involves spinning up multiple services, which can lead to port conflicts.

### How does Portman help with Vibe Coding?

- **Visibility:** See all running ports at a glance
- **Conflict resolution:** Quickly identify what's using a port
- **AI integration:** Let Claude manage ports for you via MCP
- **Find free ports:** Instantly discover available ports for new services
