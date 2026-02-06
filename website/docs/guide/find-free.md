# Find Free Ports

Quickly discover available ports in any range. Essential for Vibe Coding workflows where you're constantly spinning up new dev servers.

![Find Free Ports](/screenshot-find-free.png)

## Usage

1. Select **Find Free** from the sidebar
2. Set your port range (default: 3000-8000)
3. Choose how many ports to find
4. Click **Search Available**

## Why This Matters

When you're doing AI-assisted development (Vibe Coding), you often:
- Spin up multiple projects simultaneously
- Have AI assistants create new services on the fly
- Need to avoid conflicts with existing servers

Instead of guessing or trial-and-error, let Portman find available ports for you.

## Tips

- **Common ranges:**
  - `3000-4000` - Frontend dev servers (Vite, Next.js, etc.)
  - `8000-9000` - Backend APIs (FastAPI, Express, etc.)
  - `5432-5500` - Database instances

- **MCP Integration:** When using the MCP server, your AI assistant can automatically find free ports using the `ports_find` tool.
