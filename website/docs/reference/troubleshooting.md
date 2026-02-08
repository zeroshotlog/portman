# Troubleshooting

## Desktop App

### "Portman is damaged and can't be opened"

**Symptom:** macOS shows "Portman is damaged and can't be opened. You should eject the disk image."

**Cause:** macOS quarantine attribute on unsigned apps downloaded from the internet.

**Solution:**
```bash
xattr -cr /Applications/Portman.app
```

Then open Portman normally.

---

### App won't open (security warning)

**Symptom:** "Portman can't be opened because Apple cannot check it for malicious software"

**Solution:**
1. Right-click (Control-click) on Portman.app
2. Select "Open" from the menu
3. Click "Open" in the dialog

See [Installation](/guide/installation) for detailed steps.

---

### No ports showing

**Symptom:** The port list is empty

**Possible causes:**
1. No services are running
2. Permission issue

**Solution:**
- Start a dev server (e.g., `npx vite`) and refresh
- Check if `lsof` command works in Terminal

---

### Window doesn't appear

**Symptom:** App is running (in Dock) but no window

**Solution:**
- Click the Dock icon to show the window
- Or use Cmd+Q to quit and relaunch

---

## MCP Server

### Claude doesn't see Portman tools

**Symptom:** Claude says it can't access port information

**Possible causes:**
1. MCP server not configured
2. Configuration file syntax error
3. Node.js not installed

**Solutions:**

1. Verify configuration:
```bash
# Claude Code
claude mcp list
```

2. Check JSON syntax in config file

3. Ensure Node.js 18+ is installed:
```bash
node --version
```

---

### "command not found: npx"

**Symptom:** MCP server fails to start

**Solution:**
Install Node.js from [nodejs.org](https://nodejs.org/) or via Homebrew:
```bash
brew install node
```

---

### MCP server not updating

**Symptom:** Using old version of portman-mcp

**Solution:**
npx caches packages. Force latest version:
```bash
npx portman-mcp@latest
```

Or update your MCP config to use `@latest`:
```json
"args": ["-y", "portman-mcp@latest"]
```

---

## Still stuck?

[Open an issue on GitHub](https://github.com/zeroshotlog/portman/issues)
