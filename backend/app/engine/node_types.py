"""
node_types.py - the catalogue of supported node types.

Each node includes:
  - icon:        Lucide icon name (used by the frontend)
  - name:        Display title shown on the node card
  - description: Short tooltip/sidebar description
  - color:       Theme color for the node header
  - engine_type: Key used by the executor to find the right runner
  - category:    Groups nodes in the sidebar (Triggers / Actions / Logic / Utilities)
  - inputs:      List of input handle labels
  - outputs:     List of output handle labels
  - settings:    Default config fields shown in the side panel
"""

NODE_TYPES = {

    # ── TRIGGERS ─────────────────────────────────────────────────────────
    # These start a workflow. They have no inputs, only outputs.

    "trigger": {
        "icon":        "Play",
        "name":        "Manual Trigger",
        "description": "Starts the workflow manually when you click Run",
        "color":       "orange",
        "engine_type": "trigger",
        "category":    "Triggers",
        "inputs":      [],
        "outputs":     ["trigger"],
        "settings":    {},
    },

    "webhook_trigger": {
        "icon":        "Webhook",
        "name":        "Webhook Trigger",
        "description": "Starts the workflow when an HTTP POST hits your webhook URL",
        "color":       "orange",
        "engine_type": "webhook_trigger",
        "category":    "Triggers",
        "inputs":      [],
        "outputs":     ["payload"],
        "settings": {
            "method": {
                "type":    "select",
                "label":   "Allowed HTTP Method",
                "default": "POST",
                "options": ["GET", "POST", "PUT", "PATCH"],
            },
            "secret": {
                "type":    "text",
                "label":   "Secret Token (optional verification)",
                "default": "",
            },
        },
    },

    "cron_scheduler": {
        "icon":        "CalendarClock",
        "name":        "Cron Scheduler",
        "description": "Run the workflow automatically on a cron schedule (e.g. every day at 9am)",
        "color":       "orange",
        "engine_type": "cron_scheduler",
        "category":    "Triggers",
        "inputs":      [],
        "outputs":     ["trigger"],
        "settings": {
            "cron_expression": {
                "type":    "text",
                "label":   "Cron Expression",
                "default": "0 9 * * 1-5",
            },
            "timezone": {
                "type":    "text",
                "label":   "Timezone",
                "default": "UTC",
            },
        },
    },

    # ── ACTIONS ──────────────────────────────────────────────────────────
    # These perform side effects: HTTP calls, emails, Slack messages, etc.

    "http_request": {
        "icon":        "Globe",
        "name":        "HTTP Request",
        "description": "Make an HTTP GET/POST call. Supports {{key}} placeholders in URL, Headers, and Body.",
        "color":       "blue",
        "engine_type": "http_request",
        "category":    "Actions",
        "inputs":      ["body"],
        "outputs":     ["response", "status_code"],
        "settings": {
            "method":  {"type": "select", "label": "Method",  "default": "GET",
                        "options": ["GET", "POST", "PUT", "DELETE", "PATCH"]},
            "url":     {"type": "text",   "label": "URL",     "default": ""},
            "headers": {"type": "json",   "label": "Headers (JSON)", "default": "{}"},
            "body":    {"type": "json",   "label": "Body (JSON)",    "default": ""},
        },
    },

    "email": {
        "icon":        "Mail",
        "name":        "Send Email",
        "description": "Send an email via SMTP. Supports {{key}} placeholders in subject & body.",
        "color":       "blue",
        "engine_type": "email",
        "category":    "Actions",
        "inputs":      ["input"],
        "outputs":     ["output"],
        "settings": {
            "smtp_host":     {"type": "text",     "label": "SMTP Host",                    "default": "smtp.gmail.com"},
            "smtp_port":     {"type": "number",   "label": "SMTP Port",                    "default": "587"},
            "smtp_user":     {"type": "text",     "label": "SMTP Username (your email)",   "default": ""},
            "smtp_password": {"type": "text",     "label": "SMTP Password / App Password", "default": ""},
            "from_email":    {"type": "text",     "label": "From Email",                   "default": ""},
            "to_email":      {"type": "text",     "label": "To Email",                     "default": ""},
            "subject":       {"type": "text",     "label": "Subject",                      "default": "Workflow Notification"},
            "body":          {"type": "textarea", "label": "Body",
                              "default": "Hello,\n\nYour workflow ran successfully.\n\nStatus: {{status_code}}"},
        },
    },

    "slack": {
        "icon":        "MessageSquare",
        "name":        "Slack Message",
        "description": "Post a message to a Slack channel via an Incoming Webhook URL",
        "color":       "purple",
        "engine_type": "slack",
        "category":    "Actions",
        "inputs":      ["input"],
        "outputs":     ["output"],
        "settings": {
            "webhook_url": {"type": "text",     "label": "Slack Webhook URL",          "default": "https://hooks.slack.com/services/..."},
            "channel":     {"type": "text",     "label": "Channel (optional override)", "default": ""},
            "username":    {"type": "text",     "label": "Bot Username",               "default": "WorkflowBot"},
            "message":     {"type": "textarea", "label": "Message",                    "default": "Workflow update: {{status_code}}"},
        },
    },

    "action": {
        "icon":        "Zap",
        "name":        "Action",
        "description": "Display a message with {{state_key}} placeholders",
        "color":       "green",
        "engine_type": "action",
        "category":    "Actions",
        "inputs":      ["input"],
        "outputs":     ["output"],
        "settings": {
            "message": {"type": "text", "label": "Message", "default": "Action executed"},
        },
    },

    # ── LOGIC ─────────────────────────────────────────────────────────────
    # These control how the workflow branches or transforms data.

    "condition": {
        "icon":        "GitBranch",
        "name":        "Condition",
        "description": "Branch based on a value in the state",
        "color":       "yellow",
        "engine_type": "condition",
        "category":    "Logic",
        "inputs":      ["input"],
        "outputs":     ["true", "false"],
        "settings": {
            "field":    {"type": "text",   "label": "State field",   "default": "status_code"},
            "operator": {"type": "select", "label": "Operator",      "default": "eq",
                         "options": ["eq", "neq", "gt", "lt", "contains"]},
            "value":    {"type": "text",   "label": "Compare value", "default": "200"},
        },
    },

    "python_function": {
        "icon":        "Code",
        "name":        "Python Function",
        "description": "Run a Python snippet. Read from state, write output into result.",
        "color":       "indigo",
        "engine_type": "python_function",
        "category":    "Logic",
        "inputs":      ["input"],
        "outputs":     ["output"],
        "settings": {
            "code": {"type": "textarea", "label": "Python Code",
                     "default": "result[\"output\"] = state.get(\"status_code\", 0)"},
        },
    },

    "delay": {
        "icon":        "Clock",
        "name":        "Delay",
        "description": "Pause the workflow for N seconds",
        "color":       "gray",
        "engine_type": "delay",
        "category":    "Logic",
        "inputs":      ["input"],
        "outputs":     ["output"],
        "settings": {
            "seconds": {"type": "number", "label": "Seconds", "default": "1"},
        },
    },

    # ── UTILITIES ─────────────────────────────────────────────────────────
    # Logging, storage, and terminal nodes.

    "logger": {
        "icon":        "FileText",
        "name":        "Logger",
        "description": "Log a message. Use {{key}} to insert state values.",
        "color":       "teal",
        "engine_type": "logger",
        "category":    "Utilities",
        "inputs":      ["input"],
        "outputs":     ["output"],
        "settings": {
            "message": {"type": "text",   "label": "Message", "default": "Status: {{status_code}}"},
            "level":   {"type": "select", "label": "Level",   "default": "info",
                        "options": ["info", "warning", "error"]},
        },
    },

    "local_storage": {
        "icon":        "Database",
        "name":        "Local Storage",
        "description": "Store or retrieve data from a local JSON file",
        "color":       "teal",
        "engine_type": "local_storage",
        "category":    "Utilities",
        "inputs":      ["input"],
        "outputs":     ["output"],
        "settings": {
            "operation": {"type": "select", "label": "Operation", "default": "read",
                          "options": ["read", "append"]},
            "file_name": {"type": "text", "label": "File Name", "default": "storage.json"},
            "data":      {"type": "text", "label": "Data (JSON/Text to append)", "default": "{}"},
        },
    },

    "postgres_db": {
        "icon":        "Database",
        "name":        "PostgreSQL Query",
        "description": "Execute a query against a PostgreSQL database",
        "color":       "indigo",
        "engine_type": "postgres_db",
        "category":    "Actions",
        "inputs":      ["input"],
        "outputs":     ["results"],
        "settings": {
            "host":     {"type": "text", "label": "Host", "default": "localhost"},
            "port":     {"type": "number", "label": "Port", "default": "5432"},
            "user":     {"type": "text", "label": "Username", "default": "postgres"},
            "password": {"type": "text", "label": "Password", "default": ""},
            "dbname":   {"type": "text", "label": "Database Name", "default": "postgres"},
            "query":    {"type": "textarea", "label": "SQL Query", "default": "SELECT * FROM users;"},
        },
    },

    "ai_chat": {
        "icon":        "Sparkles",
        "name":        "AI Chat",
        "description": "Send a prompt to any OpenAI-compatible API (OpenAI, OpenRouter, NVIDIA NIM, Ollama, Together, Groq, etc.)",
        "color":       "purple",
        "engine_type": "ai_chat",
        "category":    "Actions",
        "inputs":      ["input"],
        "outputs":     ["ai_response"],
        "settings": {
            "base_url": {
                "type":    "text",
                "label":   "API Base URL",
                "default": "https://api.openai.com/v1",
            },
            "api_key": {
                "type":    "text",
                "label":   "API Key",
                "default": "",
            },
            "model": {
                "type":    "text",
                "label":   "Model (e.g. gpt-4o, mistralai/mistral-7b-instruct, meta/llama-3.1-70b-instruct)",
                "default": "gpt-4o-mini",
            },
            "system_prompt": {
                "type":    "text",
                "label":   "System Prompt (optional)",
                "default": "You are a helpful assistant.",
            },
            "prompt": {
                "type":    "textarea",
                "label":   "User Prompt (supports {{state_key}} placeholders)",
                "default": "Summarize the following: {{response}}",
            },
            "max_tokens": {
                "type":    "number",
                "label":   "Max Tokens",
                "default": "512",
            },
        },
    },

    "file_upload": {
        "icon":        "Upload",
        "name":        "File Upload / Read",
        "description": "Read a file from the local filesystem or a webhook payload",
        "color":       "teal",
        "engine_type": "file_upload",
        "category":    "Utilities",
        "inputs":      ["input"],
        "outputs":     ["file_content"],
        "settings": {
            "source":      {"type": "select", "label": "Source", "default": "local", "options": ["local", "webhook"]},
            "file_path":   {"type": "text", "label": "Local File Path", "default": "data.txt"},
            "payload_key": {"type": "text", "label": "Webhook Payload Key", "default": "payload.file_content"},
        },
    },

    "parallel_execution": {
        "icon":        "Layers",
        "name":        "Parallel Execution",
        "description": "Run Python code concurrently on each item of an array",
        "color":       "yellow",
        "engine_type": "parallel_execution",
        "category":    "Logic",
        "inputs":      ["input"],
        "outputs":     ["results"],
        "settings": {
            "array_key": {"type": "text", "label": "Array State Key", "default": "storage_data"},
            "code": {"type": "textarea", "label": "Python Code per item", "default": "result = item"},
        },
    },

    "end": {
        "icon":        "CheckCircle",
        "name":        "End",
        "description": "Marks the final node — collects the full state",
        "color":       "purple",
        "engine_type": "end",
        "category":    "Utilities",
        "inputs":      ["input"],
        "outputs":     [],
        "settings":    {},
    },

    # ── LOOP NODE ──────────────────────────────────────────────────────────
    "loop_node": {
        "icon":        "RefreshCw",
        "name":        "Loop",
        "description": "Iterate over an array in state. Runs code for each item and collects results.",
        "color":       "yellow",
        "engine_type": "loop_node",
        "category":    "Logic",
        "inputs":      ["input"],
        "outputs":     ["results", "count"],
        "settings": {
            "array_key": {
                "type":    "text",
                "label":   "State Array Key (e.g. response)",
                "default": "response",
            },
            "code": {
                "type":    "textarea",
                "label":   "Python Code per item (use `item` and `state`)",
                "default": "result = {\"processed\": item}",
            },
            "max_iterations": {
                "type":    "number",
                "label":   "Max Iterations (0 = unlimited)",
                "default": "100",
            },
        },
    },

    # ── CUSTOM NODE BUILDER ───────────────────────────────────────────────
    "custom_node": {
        "icon":        "Wrench",
        "name":        "Custom Node",
        "description": "Build your own node: give it a name, description, and Python logic.",
        "color":       "indigo",
        "engine_type": "custom_node",
        "category":    "Logic",
        "inputs":      ["input"],
        "outputs":     ["output"],
        "settings": {
            "node_name": {
                "type":    "text",
                "label":   "Node Display Name",
                "default": "My Custom Node",
            },
            "node_description": {
                "type":    "text",
                "label":   "Node Description",
                "default": "Describe what this node does",
            },
            "code": {
                "type":    "textarea",
                "label":   "Python Code (read from `state`, write to `result`)",
                "default": "# Access any state key:\n# value = state.get(\"response\", {})\nresult[\"output\"] = \"Hello from custom node!\"",
            },
        },
    },

    # ── DOCKER DEPLOYMENT ─────────────────────────────────────────────────
    "docker_deploy": {
        "icon":        "Box",
        "name":        "Docker Deploy",
        "description": "Run a Docker or docker-compose command (up, down, pull, build, restart).",
        "color":       "blue",
        "engine_type": "docker_deploy",
        "category":    "Actions",
        "inputs":      ["input"],
        "outputs":     ["output", "exit_code"],
        "settings": {
            "command": {
                "type":    "select",
                "label":   "Docker Command",
                "default": "docker-compose up -d",
                "options": [
                    "docker-compose up -d",
                    "docker-compose down",
                    "docker-compose restart",
                    "docker-compose pull",
                    "docker-compose build",
                ],
            },
            "working_dir": {
                "type":    "text",
                "label":   "Working Directory (where compose file is)",
                "default": "/app",
            },
            "image": {
                "type":    "text",
                "label":   "Image Name (for pull/build overrides)",
                "default": "",
            },
            "container": {
                "type":    "text",
                "label":   "Container Name (for start/stop/restart)",
                "default": "",
            },
            "timeout": {
                "type":    "number",
                "label":   "Timeout (seconds)",
                "default": "120",
            },
        },
    },
}