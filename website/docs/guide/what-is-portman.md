# What is Portman?

Portman is a local port management tool designed specifically for macOS developers.

## The Problem

Modern development often involves running multiple services simultaneously:
- Frontend dev server (port 3000)
- Backend API (port 8000)
- Database (port 5432)
- Redis (port 6379)
- And more...

**Port conflicts are inevitable.** Especially when you're doing Vibe Coding with AI assistants that spin up new projects frequently, keeping track of what's running where becomes a challenge.

## The Solution

Portman gives you complete visibility into your local port usage:

![Portman Active Ports](/screenshot.png)

### Key Features

- **Real-time scanning** - See all active port listeners instantly
- **Process detection** - Know which process is using each port
- **Custom labels** - Tag ports with project names for easy identification
- **Find free ports** - Quickly discover available ports in any range
- **MCP integration** - Let AI assistants manage ports for you

## Who is it for?

- **Web developers** juggling multiple projects
- **Full-stack developers** running microservices locally
- **AI-assisted coders** using Claude, Cursor, or similar tools
- **Anyone** who's ever wondered "what's using port 3000?"

## Desktop App + MCP Server

Portman comes in two flavors:

1. **Desktop App** - A native macOS app with a beautiful UI
2. **MCP Server** - Connect to Claude Desktop/Code for AI-powered port management

Both are free and open source under the MIT license.
