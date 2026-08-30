"""
nodes.py – one function per node type.

Each function receives `node` (the raw node dict from workflow_json) and
`state` (a plain dict that accumulates results as the graph runs).
It must return a dict with the values it produced.
"""

import httpx


# ─────────────────────────────────────────────
# Trigger  – just starts the run, returns nothing useful
# ─────────────────────────────────────────────
def run_trigger(node: dict, state: dict) -> dict:
    return {"triggered": True}


# ─────────────────────────────────────────────
# HTTP Request  – actually fires the request
# ─────────────────────────────────────────────
def run_http_request(node: dict, state: dict) -> dict:
    settings = node.get("data", {}).get("settings", {})

    method  = settings.get("method", "GET").upper()
    url     = settings.get("url", "").strip()
    headers = settings.get("headers", {})
    body    = settings.get("body", None)

    if not url:
        raise ValueError("HTTP Request node: 'url' is required")

    with httpx.Client(timeout=15) as client:
        response = client.request(method, url, headers=headers, json=body if body else None)

    # Try to parse JSON body; fall back to plain text
    try:
        resp_body = response.json()
    except Exception:
        resp_body = response.text

    return {
        "status_code": response.status_code,
        "response":    resp_body,
    }


# ─────────────────────────────────────────────
# Condition  – evaluates a simple expression
# ─────────────────────────────────────────────
def run_condition(node: dict, state: dict) -> dict:
    """
    Settings:
      field     – key to read from state  (e.g. "status_code")
      operator  – "eq" | "neq" | "gt" | "lt" | "contains"
      value     – value to compare against
    """
    settings = node.get("data", {}).get("settings", {})

    field    = settings.get("field", "")
    operator = settings.get("operator", "eq")
    expected = settings.get("value", "")

    # Walk dotted paths like "response.id"
    actual = state
    for part in field.split("."):
        if isinstance(actual, dict):
            actual = actual.get(part)
        else:
            actual = None
            break

    # Convert expected to the same type as actual when possible
    if actual is not None:
        try:
            expected = type(actual)(expected)
        except (ValueError, TypeError):
            pass

    ops = {
        "eq":       lambda a, b: a == b,
        "neq":      lambda a, b: a != b,
        "gt":       lambda a, b: a > b,
        "lt":       lambda a, b: a < b,
        "contains": lambda a, b: str(b) in str(a),
    }

    result = ops.get(operator, lambda a, b: False)(actual, expected)
    return {"condition_result": result}


# ─────────────────────────────────────────────
# Action  – generic "log a value" step
# ─────────────────────────────────────────────
def run_action(node: dict, state: dict) -> dict:
    settings = node.get("data", {}).get("settings", {})
    message  = settings.get("message", "Action executed")
    # Resolve {{key}} placeholders from state
    for key, val in state.items():
        message = message.replace(f"{{{{{key}}}}}", str(val))
    return {"action_output": message}


# ─────────────────────────────────────────────
# End  – collect final state
# ─────────────────────────────────────────────
def run_end(node: dict, state: dict) -> dict:
    return {"final_state": dict(state)}


# ─────────────────────────────────────────────
# Registry  – maps node type → function
# ─────────────────────────────────────────────
NODE_RUNNERS = {
    "trigger":      run_trigger,
    "http_request": run_http_request,
    "condition":    run_condition,
    "action":       run_action,
    "end":          run_end,
}
