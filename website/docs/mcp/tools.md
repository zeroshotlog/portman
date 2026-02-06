# Available MCP Tools

Reference for all tools exposed by the Portman MCP server.

## Port Scanning

### `scan_listeners`

List all active port listeners on the system.

**Parameters:** None

**Returns:** Array of listeners with port, process, PID, and label info.

**Example prompt:**
> "What ports are currently in use?"

---

### `who`

Get details for a specific port.

**Parameters:**
- `port` (integer, required) - Port number to check

**Example prompt:**
> "What's running on port 3000?"

---

### `ports_find`

Find available (free) ports in a range.

**Parameters:**
- `start` (integer) - Start of range (default: 3000)
- `end` (integer) - End of range (default: 9000)
- `count` (integer) - Number of ports to find (default: 10)

**Example prompt:**
> "Find me 5 available ports between 8000 and 9000"

---

## Label Management

### `label_set_port`

Set a label for a specific port.

**Parameters:**
- `port` (integer, required) - Port number
- `name` (string, required) - Label name
- `note` (string, optional) - Additional note

**Example prompt:**
> "Label port 3000 as 'Frontend' with note 'React dev server'"

---

### `label_set_pid`

Set a label for a specific process ID.

**Parameters:**
- `pid` (integer, required) - Process ID
- `name` (string, required) - Label name
- `note` (string, optional) - Additional note

---

### `label_set_pattern`

Set a label for processes matching a regex pattern.

**Parameters:**
- `pattern` (string, required) - Regex pattern
- `name` (string, required) - Label name
- `note` (string, optional) - Additional note

**Example prompt:**
> "Label all Python processes as 'Backend Services'"

---

### `label_list`

List all configured labels.

**Parameters:** None

---

### `label_remove_port` / `label_remove_pid` / `label_remove_pattern`

Remove a label by port, PID, or pattern.

**Parameters:**
- `port`, `pid`, or `pattern` (required) - Identifier to remove

---

## Use Cases

### During Vibe Coding

> "I need to start a new Next.js project. Find me an available port and label it 'New Project - Frontend'"

### Debugging Conflicts

> "Port 8000 is already in use. What's running there?"

### Project Organization

> "List all my labeled ports and their notes"
