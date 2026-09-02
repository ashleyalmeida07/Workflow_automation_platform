"""
node_types.py - the catalogue of supported node types.

Each node includes:
  - icon:        Lucide icon name (used by the frontend)
  - name:        Display title shown on the node card
  - description: Short tooltip/sidebar description
  - color:       Theme color for the node header
  - engine_type: Key used by the executor to find the right runner
  - inputs:      List of input handle labels
  - outputs:     List of output handle labels
  - settings:    Default config fields shown in the side panel
"""

NODE_TYPES = {
    "trigger": {
        "icon":        "Play",
        "name":        "Trigger",
        "description": "Starts the workflow run",
        "color":       "orange",
        "engine_type": "trigger",
        "inputs":      [],
        "outputs":     ["trigger"],
        "settings":    {},
    },
    "http_request": {
        "icon":        "Globe",
        "name":        "HTTP Request",
        "description": "Make an HTTP GET / POST / PUT / DELETE call",
        "color":       "blue",
        "engine_type": "http_request",
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
    "delay": {
        "icon":        "Clock",
        "name":        "Delay",
        "description": "Pause the workflow for N seconds",
        "color":       "gray",
        "engine_type": "delay",
        "inputs":      ["input"],
        "outputs":     ["output"],
        "settings": {
            "seconds": {"type": "number", "label": "Seconds", "default": "1"},
        },
    },
    "python_function": {
        "icon":        "Code",
        "name":        "Python Function",
        "description": "Run a Python snippet. Read from state, write output into result.",
        "color":       "indigo",
        "engine_type": "python_function",
        "inputs":      ["input"],
        "outputs":     ["output"],
        "settings": {
            "code": {"type": "textarea", "label": "Python Code",
                     "default": "result[\"output\"] = state.get(\"status_code\", 0)"},
        },
    },
    "condition": {
        "icon":        "GitBranch",
        "name":        "Condition",
        "description": "Branch based on a value in the state",
        "color":       "yellow",
        "engine_type": "condition",
        "inputs":      ["input"],
        "outputs":     ["true", "false"],
        "settings": {
            "field":    {"type": "text",   "label": "State field",   "default": "status_code"},
            "operator": {"type": "select", "label": "Operator",      "default": "eq",
                         "options": ["eq", "neq", "gt", "lt", "contains"]},
            "value":    {"type": "text",   "label": "Compare value", "default": "200"},
        },
    },
    "logger": {
        "icon":        "FileText",
        "name":        "Logger",
        "description": "Log a message. Use {{key}} to insert state values.",
        "color":       "teal",
        "engine_type": "logger",
        "inputs":      ["input"],
        "outputs":     ["output"],
        "settings": {
            "message": {"type": "text",   "label": "Message", "default": "Status: {{status_code}}"},
            "level":   {"type": "select", "label": "Level",   "default": "info",
                        "options": ["info", "warning", "error"]},
        },
    },
    "action": {
        "icon":        "Zap",
        "name":        "Action",
        "description": "Display a message with {{state_key}} placeholders",
        "color":       "green",
        "engine_type": "action",
        "inputs":      ["input"],
        "outputs":     ["output"],
        "settings": {
            "message": {"type": "text", "label": "Message", "default": "Action executed"},
        },
    },
    "end": {
        "icon":        "CheckCircle",
        "name":        "End",
        "description": "Marks the final node - collects the full state",
        "color":       "purple",
        "engine_type": "end",
        "inputs":      ["input"],
        "outputs":     [],
        "settings":    {},
    },
}