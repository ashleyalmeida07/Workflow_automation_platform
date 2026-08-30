"""
node_types.py – the catalogue of supported node types.

The frontend uses this to render the sidebar and node config panels.
  - settings: fields shown in the config panel
  - inputs / outputs: handle labels shown on the node
  - engine_type: value stored in node.data.engine_type so the executor knows what to run
"""

NODE_TYPES = {
    "trigger": {
        "name":        "Trigger",
        "description": "Starts the workflow run",
        "color":       "orange",
        "engine_type": "trigger",
        "settings":    {},
        "inputs":      [],
        "outputs":     ["trigger"],
    },
    "http_request": {
        "name":        "HTTP Request",
        "description": "Make an HTTP GET / POST / PUT / DELETE call",
        "color":       "blue",
        "engine_type": "http_request",
        "settings": {
            "method":  {"type": "select",  "label": "Method",  "default": "GET",
                        "options": ["GET", "POST", "PUT", "DELETE", "PATCH"]},
            "url":     {"type": "text",    "label": "URL",     "default": ""},
            "headers": {"type": "json",    "label": "Headers (JSON)", "default": "{}"},
            "body":    {"type": "json",    "label": "Body (JSON)",    "default": ""},
        },
        "inputs":  ["body"],
        "outputs": ["response", "status_code"],
    },
    "condition": {
        "name":        "Condition",
        "description": "Branch based on a value in the state",
        "color":       "yellow",
        "engine_type": "condition",
        "settings": {
            "field":    {"type": "text",   "label": "State field",   "default": "status_code"},
            "operator": {"type": "select", "label": "Operator",      "default": "eq",
                         "options": ["eq", "neq", "gt", "lt", "contains"]},
            "value":    {"type": "text",   "label": "Compare value", "default": "200"},
        },
        "inputs":  ["input"],
        "outputs": ["true", "false"],
    },
    "action": {
        "name":        "Action",
        "description": "Log or display a message (with {{state_key}} placeholders)",
        "color":       "green",
        "engine_type": "action",
        "settings": {
            "message": {"type": "text", "label": "Message", "default": "Action executed"},
        },
        "inputs":  ["input"],
        "outputs": ["output"],
    },
    "end": {
        "name":        "End",
        "description": "Marks the final node of the workflow",
        "color":       "purple",
        "engine_type": "end",
        "settings":    {},
        "inputs":      ["input"],
        "outputs":     [],
    },
}
