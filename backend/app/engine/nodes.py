"""
nodes.py - one function per node type.

Each function receives `node` (the raw node dict from workflow_json) and
`state` (a plain dict that accumulates results as the graph runs).
It must return a dict with the values it produced.

Adding a new node is simple:
  1. Write a run_<name>(node, state) -> dict function here.
  2. Register it in NODE_RUNNERS at the bottom.
  3. Add its definition to node_types.py.
"""

import time
import httpx
import json
import os
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart

# ---------------------------------------------
# Trigger - just starts the run
# ---------------------------------------------
def run_trigger(node: dict, state: dict) -> dict:
    return {"triggered": True}


# ---------------------------------------------
# HTTP Request - fires an HTTP call
# ---------------------------------------------
def run_http_request(node: dict, state: dict) -> dict:
    settings = node.get("data", {}).get("settings", {})
    method   = settings.get("method", "GET").upper()
    url      = settings.get("url", "").strip()

    # Interpolate variables in string
    def interpolate(text: str) -> str:
        if not isinstance(text, str): return text
        for key, val in state.items():
            text = text.replace(f"{{{{{key}}}}}", str(val))
        return text

    url = interpolate(url)
    headers_str = interpolate(settings.get("headers", "{}"))
    
    try:
        headers = json.loads(headers_str) if isinstance(headers_str, str) else headers_str
    except json.JSONDecodeError:
        headers = {}

    # Body is only meaningful for POST / PUT / PATCH
    BODYLESS_METHODS = {"GET", "HEAD", "DELETE", "OPTIONS", "TRACE"}
    body = None
    if method not in BODYLESS_METHODS:
        body_str = interpolate(settings.get("body", ""))
        if body_str and body_str.strip() not in ("", "{}"):
            try:
                body = json.loads(body_str) if isinstance(body_str, str) else body_str
            except json.JSONDecodeError:
                body = None

    if not url:
        raise ValueError("HTTP Request node: 'url' is required")

    try:
        with httpx.Client(timeout=15, follow_redirects=True) as client:
            # Only include a body for methods that support it.
            # Never pass json=None — some servers interpret an empty
            # Content-Type: application/json as a malformed request body.
            req_kwargs: dict = {"headers": headers}
            if body is not None:
                req_kwargs["json"] = body

            response = client.request(method, url, **req_kwargs)
    except httpx.RequestError as e:
        raise ValueError(f"HTTP Connection failed: {e}")

    try:
        resp_body = response.json()
    except Exception:
        resp_body = response.text

    return {"status_code": response.status_code, "response": resp_body}


# ---------------------------------------------
# Delay - pauses the workflow for N seconds
# ---------------------------------------------
def run_delay(node: dict, state: dict) -> dict:
    settings = node.get("data", {}).get("settings", {})
    seconds  = float(settings.get("seconds", 1))
    time.sleep(seconds)
    return {"delayed_seconds": seconds}


# ---------------------------------------------
# Python Function - runs a small Python snippet
# ---------------------------------------------
def run_python_function(node: dict, state: dict) -> dict:
    """
    Write code in the 'code' setting.
    `state` is available inside the snippet.
    Put output into the `result` dict.

    Example:
      result["doubled"] = state.get("status_code", 0) * 2
    """
    settings = node.get("data", {}).get("settings", {})
    code     = settings.get("code", "")

    local_scope = {"state": state, "result": {}, "json": json}

    # Allow common safe builtins
    safe_builtins = {
        "print": print, "len": len, "range": range,
        "str": str, "int": int, "float": float, "bool": bool,
        "list": list, "dict": dict, "tuple": tuple, "set": set,
        "min": min, "max": max, "sum": sum, "abs": abs,
        "round": round, "sorted": sorted, "enumerate": enumerate,
        "zip": zip, "map": map, "filter": filter,
        "isinstance": isinstance, "type": type,
    }

    try:
        exec(code, {"__builtins__": safe_builtins, "json": json}, local_scope)
    except Exception as e:
        raise ValueError(f"Python Function node error: {e}")

    return local_scope.get("result", {})


# ---------------------------------------------
# Condition - branch on a state value
# ---------------------------------------------
def run_condition(node: dict, state: dict) -> dict:
    """
    Settings:
      field    - state key to read  (e.g. "status_code")
      operator - eq | neq | gt | lt | contains
      value    - value to compare against
    """
    settings = node.get("data", {}).get("settings", {})
    field    = settings.get("field", "")
    operator = settings.get("operator", "eq")
    expected = settings.get("value", "")

    # Support dotted paths like "response.id"
    actual = state
    for part in field.split("."):
        actual = actual.get(part) if isinstance(actual, dict) else None

    # Try to match types
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


# ---------------------------------------------
# Logger - log a message with state placeholders
# ---------------------------------------------
def run_logger(node: dict, state: dict) -> dict:
    """
    Settings:
      message - text with {{key}} placeholders from state
      level   - info | warning | error

    Example: "Response status: {{status_code}}"
    """
    settings = node.get("data", {}).get("settings", {})
    message  = settings.get("message", "{{state}}")
    level    = settings.get("level", "info").upper()

    # Replace {{key}} with actual state values
    for key, val in state.items():
        message = message.replace(f"{{{{{key}}}}}", str(val))
    message = message.replace("{{state}}", str(state))

    log_line = f"[{level}] {message}"
    print(log_line)   # visible in uvicorn terminal

    return {"log": log_line}


# ---------------------------------------------
# Action - generic message step
# ---------------------------------------------
def run_action(node: dict, state: dict) -> dict:
    settings = node.get("data", {}).get("settings", {})
    message  = settings.get("message", "Action executed")
    for key, val in state.items():
        message = message.replace(f"{{{{{key}}}}}", str(val))
    return {"action_output": message}


# ---------------------------------------------
# End - marks the last node, returns full state
# ---------------------------------------------
def run_end(node: dict, state: dict) -> dict:
    return {"final_state": dict(state)}


# ---------------------------------------------
# Local Storage - JSON file operations
# ---------------------------------------------
def run_local_storage(node: dict, state: dict) -> dict:
    settings = node.get("data", {}).get("settings", {})
    operation = settings.get("operation", "read")
    file_name = settings.get("file_name", "storage.json")
    data_str  = settings.get("data", "{}")

    # Interpolate
    for key, val in state.items():
        file_name = file_name.replace(f"{{{{{key}}}}}", str(val))
        data_str = data_str.replace(f"{{{{{key}}}}}", str(val))

    file_path = os.path.join(os.getcwd(), file_name)

    if operation == "read":
        if os.path.exists(file_path):
            with open(file_path, "r", encoding="utf-8") as f:
                try:
                    content = json.load(f)
                except json.JSONDecodeError:
                    content = []
        else:
            content = []
        return {"storage_data": content}
    
    elif operation == "append":
        try:
            new_data = json.loads(data_str)
        except json.JSONDecodeError:
            new_data = data_str

        content = []
        if os.path.exists(file_path):
            with open(file_path, "r", encoding="utf-8") as f:
                try:
                    content = json.load(f)
                except json.JSONDecodeError:
                    pass
        if not isinstance(content, list):
            content = [content]
        
        content.append(new_data)
        
        with open(file_path, "w", encoding="utf-8") as f:
            json.dump(content, f, indent=2)
            
        return {"storage_appended": new_data}



# ---------------------------------------------
# Webhook Trigger - simulated; real triggering
# is handled externally (e.g., via a /webhook
# endpoint that starts the workflow execution).
# When run inside the graph it just passes the
# incoming payload (stored in state) forward.
# ---------------------------------------------
def run_webhook_trigger(node: dict, state: dict) -> dict:
    """
    In a real deployment an API endpoint receives
    the incoming HTTP request and stores the body
    in state['webhook_payload'] before running the
    workflow. This runner just exposes that value.
    """
    settings = node.get("data", {}).get("settings", {})
    method   = settings.get("method", "POST").upper()
    # Payload would already be in state if triggered externally
    payload  = state.get("webhook_payload", {})
    return {"webhook_triggered": True, "method": method, "payload": payload}


# ---------------------------------------------
# Cron Scheduler - simulated; real scheduling
# is handled externally (cron job / APScheduler
# that calls execute). This runner just records
# what schedule it is configured for.
# ---------------------------------------------
def run_cron_scheduler(node: dict, state: dict) -> dict:
    """
    In a real deployment a scheduler (e.g. APScheduler)
    triggers the workflow at the configured time.
    This runner documents the schedule in the output.
    """
    settings        = node.get("data", {}).get("settings", {})
    cron_expression = settings.get("cron_expression", "0 9 * * 1-5")
    timezone        = settings.get("timezone", "UTC")
    return {
        "cron_triggered":   True,
        "cron_expression":  cron_expression,
        "timezone":         timezone,
    }


# ---------------------------------------------
# Email - sends via SMTP (TLS on port 587)
# ---------------------------------------------
def run_email(node: dict, state: dict) -> dict:
    """
    Settings:
      smtp_host     - e.g. smtp.gmail.com
      smtp_port     - e.g. 587
      smtp_user     - your email login
      smtp_password - app password / SMTP password
      from_email    - sender address
      to_email      - recipient address(es), comma-separated
      subject       - email subject (supports {{placeholders}})
      body          - email body text (supports {{placeholders}})
    """
    settings = node.get("data", {}).get("settings", {})

    # Helper to replace {{key}} placeholders from state
    def interpolate(text: str) -> str:
        if not isinstance(text, str):
            return text
        for key, val in state.items():
            text = text.replace(f"{{{{{key}}}}}", str(val))
        return text

    smtp_host     = settings.get("smtp_host",     "smtp.gmail.com")
    smtp_port     = int(settings.get("smtp_port", 587))
    smtp_user     = settings.get("smtp_user",     "")
    smtp_password = settings.get("smtp_password", "")
    from_email    = settings.get("from_email",    smtp_user)
    to_email      = settings.get("to_email",      "")
    subject       = interpolate(settings.get("subject", "Workflow Notification"))
    body_text     = interpolate(settings.get("body",    ""))

    if not to_email:
        raise ValueError("Email node: 'to_email' is required")
    if not smtp_user or not smtp_password:
        raise ValueError("Email node: SMTP credentials (smtp_user, smtp_password) are required")

    # Build MIME message
    msg = MIMEMultipart("alternative")
    msg["Subject"] = subject
    msg["From"]    = from_email or smtp_user
    msg["To"]      = to_email
    msg.attach(MIMEText(body_text, "plain"))

    # Send via STARTTLS
    try:
        with smtplib.SMTP(smtp_host, smtp_port, timeout=15) as server:
            server.ehlo()
            server.starttls()
            server.login(smtp_user, smtp_password)
            recipients = [addr.strip() for addr in to_email.split(",")]
            server.sendmail(from_email or smtp_user, recipients, msg.as_string())
    except smtplib.SMTPException as e:
        raise ValueError(f"Email node SMTP error: {e}")
    except OSError as e:
        raise ValueError(f"Email node connection error: {e}")

    return {"email_sent": True, "to": to_email, "subject": subject}


# ---------------------------------------------
# Slack - posts a message via Incoming Webhook
# ---------------------------------------------
def run_slack(node: dict, state: dict) -> dict:
    """
    Settings:
      webhook_url - Slack Incoming Webhook URL
      channel     - optional channel override (e.g. #alerts)
      username    - display name for the bot
      message     - message text (supports {{placeholders}})
    """
    settings    = node.get("data", {}).get("settings", {})
    webhook_url = settings.get("webhook_url", "").strip()
    channel     = settings.get("channel",     "").strip()
    username    = settings.get("username",    "WorkflowBot")
    message     = settings.get("message",     "")

    # Replace {{key}} placeholders from state
    for key, val in state.items():
        message = message.replace(f"{{{{{key}}}}}", str(val))

    if not webhook_url or webhook_url.startswith("https://hooks.slack.com/services/..."):
        raise ValueError("Slack node: a valid 'webhook_url' is required")

    payload: dict = {"text": message, "username": username}
    if channel:
        payload["channel"] = channel

    try:
        with httpx.Client(timeout=10) as client:
            response = client.post(webhook_url, json=payload)
        if response.status_code != 200:
            raise ValueError(f"Slack returned HTTP {response.status_code}: {response.text}")
    except httpx.RequestError as e:
        raise ValueError(f"Slack node connection error: {e}")

    return {"slack_sent": True, "channel": channel or "(default)", "message": message}


# ---------------------------------------------
# Registry - maps type string -> runner function
# ---------------------------------------------
NODE_RUNNERS = {
    "trigger":         run_trigger,
    "webhook_trigger": run_webhook_trigger,
    "cron_scheduler":  run_cron_scheduler,
    "http_request":    run_http_request,
    "email":           run_email,
    "slack":           run_slack,
    "delay":           run_delay,
    "python_function": run_python_function,
    "condition":       run_condition,
    "logger":          run_logger,
    "action":          run_action,
    "end":             run_end,
    "local_storage":   run_local_storage,
}

