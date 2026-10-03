# FlowForge Engine & Nodes Documentation

This document provides a comprehensive overview of how the FlowForge workflow execution engine operates and detailed explanations for every supported node type in the system.

---

## 1. How the Execution Engine Works (Deep Dive)

The execution engine is responsible for parsing a visual React-Flow graph (JSON) and executing it as a logical sequence of operations. The core logic is implemented in `graph_builder.py` and `nodes.py`.

### The Global State (Data Plumbing)
At the heart of the engine is the **Global State** (`state`), which is a standard Python dictionary (`dict`). 
1. When execution begins, `state` is empty (`{}`).
2. Every time a node runs, the engine passes this entire `state` dictionary into the node's runner function.
3. The runner function does its work and returns a *new* dictionary (e.g., `{"status_code": 200}`).
4. The engine then takes that returned dictionary and merges it into the global state using `state.update(output)`.
5. The next node in the graph now has access to the updated `state`.

### Dynamic Variable Interpolation
Many Action nodes (HTTP Request, Email, Slack, AI Chat, etc.) support dynamic placeholders in the format `{{key}}`.
* Before making a network call or sending a message, the engine scans the node's settings (URLs, headers, bodies, email subjects) for placeholders.
* It loops through all keys in the `state` dictionary and replaces `{{key}}` with the corresponding value string (e.g., `url = url.replace(f"{{{{{key}}}}}", str(val))`).
* This allows an HTTP Request node to seamlessly use the `{{file_content}}` output by a previous File Upload node.

### Safe Python Execution Sandbox
Nodes that allow custom logic (Python Function, Loop Node, Parallel Execution, Custom Node) execute user code dynamically using Python's `exec()` function.
* The engine creates a strictly controlled `local_scope` containing:
  - `state`: The global state dictionary.
  - `result`: A blank dictionary for the user to populate.
  - `json`: The built-in JSON module for parsing.
  - A limited set of `__builtins__` (e.g., `print`, `len`, `str`, `int`, `list`, `min`, `max`, `round`, `enumerate`) to prevent access to OS-level modules or filesystem destructive commands.
* After `exec()` finishes running the user's string of code within this sandbox, the engine extracts the `result` dictionary from the `local_scope` and merges it into the global workflow state.

---

## 2. Graph Traversal Algorithm
The engine processes a workflow using a Breadth-First Search (BFS) algorithm through the following steps:

1. **Graph Construction:**
   - **Lookups:** It builds a dictionary mapping every `node_id` to its configuration data.
   - **Adjacency List:** It maps out the edges to understand which nodes connect to which (e.g., `source_id -> [target_id1, target_id2]`).
   - **In-Degree Tracking:** It counts how many incoming connections each node has to identify valid entry points.

2. **Start-Node Detection:**
   The engine uses a multi-tiered strategy to find where to begin execution:
   - *Strategy 1:* Nodes with zero incoming edges that are explicitly of a trigger type (`trigger`, `webhook_trigger`, `cron_scheduler`).
   - *Strategy 2:* Any trigger-type node (even if it mistakenly has incoming edges).
   - *Strategy 3:* Any node with zero incoming edges (e.g., a workflow starting directly with an HTTP request).
   - *Strategy 4 (Fallback):* If the graph is entirely cyclic, it defaults to the first node in the array to prevent hard failures.

3. **Execution Loop (BFS):**
   - It starts with the entry point node(s) and places them in a queue.
   - For each node in the queue:
     - It fetches the corresponding backend runner function from `NODE_RUNNERS`.
     - The runner executes, taking the node's settings and the current `state`.
     - The output is merged into `state`, and the step is logged. If a node throws a Python Exception, the entire execution halts immediately.
     - Connected target nodes (children) are added to the queue if they haven't been visited yet.

---

## 3. Node Catalogue

Nodes are categorized by their functionality. Every node has a frontend definition (`node_types.py`) and a backend runner (`nodes.py`).

### Triggers
These nodes start a workflow. They typically have no inputs, only outputs.

* **Manual Trigger (`trigger`):** Acts as a visual anchor. Starts the workflow manually when a user clicks "Run". Returns `{"triggered": True}`.
* **Webhook Trigger (`webhook_trigger`):** Starts the workflow when an HTTP POST/GET hits a specific URL. Configurable with allowed methods and secret tokens. Outputs the incoming payload to `webhook_payload`.
* **Cron Scheduler (`cron_scheduler`):** Runs the workflow automatically on a time schedule based on a Cron expression (e.g., `0 9 * * 1-5`) and a specified timezone.

### Actions
These nodes perform side effects or external communications.

* **HTTP Request (`http_request`):** Makes an HTTP call (GET, POST, etc.) to an external URL using Python's `httpx`. Supports dynamic `{{key}}` placeholders in the URL, Headers, and Body. Outputs the `response` (parsed JSON if possible, otherwise raw text) and `status_code`.
* **Send Email (`email`):** Sends an email via SMTP (STARTTLS). Configurable with host, port, credentials, sender, recipient, and subject. Supports templating in the subject and body.
* **Slack Message (`slack`):** Posts a message to a Slack channel using an Incoming Webhook URL. Allows overriding the bot username and channel.
* **Action (`action`):** A simple step that outputs a formatted text string. It replaces `{{key}}` placeholders with values from the state.
* **PostgreSQL Query (`postgres_db`):** Connects to a PostgreSQL database using `psycopg2` and executes a custom SQL query. Returns parsed dictionaries for SELECT queries. Outputs the query `results`.
* **AI Chat (`ai_chat`):** Sends a prompt to an OpenAI-compatible API (OpenAI, Groq, Ollama, etc.). Configurable with base URL, API key, model, system prompt, and max tokens. Outputs the `ai_response`.
* **Docker Deploy (`docker_deploy`):** Runs Docker or `docker-compose` commands (up, down, pull, build, restart) using Python's `subprocess`. Replaces `{{image}}` and `{{container}}` variables.

### Logic
These nodes control the flow of data, branching, and custom operations.

* **Condition (`condition`):** Acts as an "If/Else" branch. Compares a field in the state (supports dotted paths like `response.id`) against a user-defined value using operators (`eq`, `gt`, `contains`, etc.).
* **Python Function (`python_function`):** Executes custom Python code securely via `exec()`. The script is provided a sandboxed scope with the current `state` and writes outputs to a `result` dictionary.
* **Delay (`delay`):** Halts the workflow execution thread for a specified number of seconds using Python's `time.sleep()`.
* **Parallel Execution (`parallel_execution`):** Uses `concurrent.futures.ThreadPoolExecutor` to concurrently run a snippet of Python code on every item within a specified array in the state.
* **Loop (`loop_node`):** Iterates over an array in the state sequentially. Runs custom Python code for each item (injected into scope as `item`) and aggregates the outputs. Allows setting a maximum iteration limit.
* **Custom Node (`custom_node`):** A dynamic node builder where users can define a custom name, description, and underlying Python logic right from the UI.

### Utilities
Helper nodes for storage, debugging, and file manipulation.

* **Logger (`logger`):** Prints messages to the backend server terminal (Info, Warning, Error) for debugging. Replaces `{{key}}` placeholders with state values.
* **Local Storage (`local_storage`):** Reads from or appends to a local JSON file on the server's filesystem.
* **File Upload / Read (`file_upload`):** Reads the contents of a file either directly from a local filesystem path or extracted from an incoming webhook payload using dotted path resolution. Outputs `file_content`.
* **End (`end`):** Marks the explicit conclusion of a workflow branch. It captures and outputs the final accumulated state snapshot.
