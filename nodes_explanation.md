# FlowForge Nodes Explained

This document briefly explains what each node in our workflow engine does, how it works during execution, and how we built it.

## How the Engine Works (The Big Picture)

1. **State:** The engine maintains a dictionary called `state`. Every time a node runs, whatever it outputs gets merged into this `state`. Subsequent nodes can read from this state.
2. **Implementation:** Every node has two parts:
   - **Frontend Metadata (`node_types.py`):** Defines the title, icon, and the settings inputs (like text boxes and dropdowns) that you see in the sidebar and config panel.
   - **Backend Runner (`nodes.py`):** A single Python function that receives the node's settings and the current `state`, performs its action, and returns a new dictionary to add to the state.

---

## The Nodes

### 1. Trigger
* **What it does:** Acts as the starting point of the workflow.
* **How it works:** It simply returns `{"triggered": True}`. It exists mostly as a visual anchor so the engine knows where to begin execution.

### 2. HTTP Request
* **What it does:** Makes a real web request (GET, POST, etc.) to an external API or URL.
* **How it works:** It reads the URL, Method, Headers, and Body from its settings. It uses Python's `httpx` library to fire the request, parses the JSON response, and returns the result (e.g., `{"status_code": 200, "response": {...}}`).

### 3. Delay
* **What it does:** Pauses the workflow for a specified number of seconds.
* **How it works:** It reads the `seconds` setting and uses Python's `time.sleep(N)` to halt the execution thread temporarily.

### 4. Python Function
* **What it does:** Allows the user to write and execute a custom snippet of Python code right in the workflow.
* **How it works:** It uses Python's `exec()` function. It provides a sandboxed local scope containing the current `state` and an empty `result` dictionary. The user's code modifies `result`, which is then returned and added to the state.

### 5. Condition
* **What it does:** Acts as an "If/Else" branch based on previous data.
* **How it works:** It checks a specific field in the `state` (e.g., `status_code`), compares it against a value using an operator (like `eq` or `gt`), and returns `{"condition_result": True/False}`. 

### 6. Logger
* **What it does:** Prints a message to the backend terminal, useful for debugging.
* **How it works:** It takes a message string that can contain `{{key}}` placeholders. It searches the `state` for those keys, replaces them with the actual values, and uses Python's `print()` to output the string to the terminal running the server.

### 7. Action
* **What it does:** A generic step that outputs a formatted text string.
* **How it works:** Similar to Logger, it replaces `{{key}}` placeholders with values from the state, but instead of printing it to the terminal, it returns it so the next node can use it.

### 8. End
* **What it does:** Marks the end of a workflow execution.
* **How it works:** It simply returns `{"final_state": state}`, capturing a snapshot of all the accumulated data throughout the entire workflow run.