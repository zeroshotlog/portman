# Labels

Labels help you identify what each port is used for at a glance.

## Adding Labels

1. Find the port in the Active Ports list
2. Click **Edit** (appears on hover)
3. Enter a name and optional note
4. Click **Save**

## Label Types

Labels can be assigned by:

| Type | Use Case |
|------|----------|
| **Port** | Always show this label for port 3000 |
| **PID** | Label a specific running process |
| **Pattern** | Match process names with regex |

## Examples

- Port 3000 → "Frontend / React App"
- Port 8000 → "API / FastAPI Server"
- Port 5432 → "Database / PostgreSQL"

## Persistence

Labels are stored in a local SQLite database:
```
~/.local/share/portman/labels.sqlite
```

They persist across app restarts and system reboots.

## MCP Integration

When using the MCP server, you (or your AI assistant) can manage labels programmatically:

```
label_set_port    - Set label by port number
label_set_pid     - Set label by process ID
label_set_pattern - Set label by regex pattern
label_list        - View all labels
label_remove_*    - Remove labels
```
