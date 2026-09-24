# FlowForge Platform Documentation

This document outlines the complete directory structure and API endpoints for the FlowForge platform.

---

## 🏗️ Project Structure

The project is structured as a decoupled monorepo containing a React frontend and a FastAPI backend.

```text
platform/
├── frontend/                     # React + Vite Frontend
│   ├── index.html                # Entry HTML
│   ├── package.json              # npm dependencies
│   ├── vite.config.js            # Vite bundler config (API proxy setup)
│   ├── src/
│   │   ├── main.jsx              # React mounting point
│   │   ├── App.jsx               # React Router definitions
│   │   ├── index.css             # Tailwind CSS & global styles
│   │   ├── components/           # Reusable UI components
│   │   │   ├── ui/               # Base UI elements (sidebar, cards)
│   │   │   ├── WorkflowNode.jsx  # Custom React Flow node component
│   │   │   ├── ExecutionsTab.jsx # Execution history panel
│   │   │   └── FlowControls.jsx  # Floating buttons on canvas
│   │   └── pages/                # Route-level pages
│   │       ├── Landing.jsx       # Public marketing page (`/`)
│   │       ├── Login.jsx         # Auth (`/login`)
│   │       ├── Register.jsx      # Auth (`/register`)
│   │       ├── Dashboard.jsx     # User workflows list (`/dashboard`)
│   │       ├── Flow.jsx          # React Flow visual editor (`/flow`)
│   │       └── Profile.jsx       # Account settings (`/profile`)
│
└── backend/                      # FastAPI Python Backend
    ├── requirements.txt          # Python dependencies
    ├── .env                      # Secrets & DB string (DATABASE_URL, JWT_SECRET)
    └── app/
        ├── main.py               # FastAPI entry point & CORS configuration
        ├── config.py             # Pydantic BaseSettings for env loading
        ├── database.py           # SQLAlchemy engine & session maker
        ├── models/               # SQLAlchemy ORM Models
        │   ├── user.py           # Users table
        │   ├── workflow.py       # Workflows table (stores workflow_json)
        │   └── execution.py      # Executions table (logs & outputs)
        ├── engine/               # Visual Workflow Execution Engine
        │   ├── graph_builder.py  # BFS graph traversal & trigger fallback logic
        │   ├── nodes.py          # Runner functions for HTTP, Python, Condition, etc.
        │   └── node_types.py     # Registry of available node schemas
        └── routers/              # FastAPI Route Handlers
            ├── health.py         # `/health` 
            ├── auth.py           # `/auth` (Login, Register, Profile)
            ├── workflows.py      # `/workflows` (CRUD & Execute trigger)
            ├── executions.py     # `/workflows/{id}/executions`
            └── node_types.py     # `/node-types` (Schema for frontend panel)
```

---

## 📡 API Documentation

Base URL: `http://localhost:8000` (Local) / `https://your-backend.onrender.com` (Production)

> [!IMPORTANT]
> All endpoints except `/auth/login`, `/auth/register`, and `/health` require an `Authorization: Bearer <token>` header.

### 1. Authentication (`/auth`)

| Method | Endpoint | Description | Payload / Query |
|---|---|---|---|
| `POST` | `/auth/register` | Create a new user | `{ "name": "...", "email": "...", "password": "..." }` |
| `POST` | `/auth/login` | Log in and receive JWT token | `{ "email": "...", "password": "..." }` |
| `GET` | `/auth/profile` | Get current logged-in user details | *(Requires Bearer Token)* |

### 2. Workflows (`/workflows`)

| Method | Endpoint | Description | Payload / Query |
|---|---|---|---|
| `GET` | `/workflows/` | List all workflows for current user | |
| `POST` | `/workflows/` | Create a new workflow | `{ "name": "...", "description": "...", "workflow_json": { "nodes": [], "edges": [] } }` |
| `GET` | `/workflows/{id}` | Get a specific workflow by ID | |
| `PUT` | `/workflows/{id}` | Update workflow details or canvas JSON | `{ "name": "...", "description": "...", "workflow_json": {...} }` |
| `DELETE` | `/workflows/{id}` | Delete a workflow | |
| `POST` | `/workflows/{id}/execute` | Trigger a workflow execution | *(Executes the graph in backend engine)* |

### 3. Executions (`/workflows/{id}/executions`)

| Method | Endpoint | Description | Payload / Query |
|---|---|---|---|
| `GET` | `/workflows/{id}/executions` | Get execution history for a workflow | Returns array of `{ id, status, started_at, finished_at, logs }` |
| `GET` | `/executions/{id}` | Get detailed logs and state of a single execution | Returns specific execution dict |

### 4. Engine Metadata (`/node-types`)

| Method | Endpoint | Description | Payload / Query |
|---|---|---|---|
| `GET` | `/node-types/` | Retrieve schema for all available workflow nodes (HTTP, Trigger, Python, etc.) | Used by the frontend sidebar to populate draggable nodes. |

### 5. System (`/health`)

| Method | Endpoint | Description | Payload / Query |
|---|---|---|---|
| `GET` | `/health` | Check if server is up | Returns `{ "status": "ok" }` |

---

## ⚙️ Workflow Engine Design

The FlowForge execution engine (`backend/app/engine/`) is designed as a synchronous, state-passing **Directed Acyclic Graph (DAG)** executor.

### 1. Graph Parsing & Cycle Detection
When a workflow is executed, the backend receives a `workflow_json` payload generated by React Flow (containing `nodes` and `edges`).
* **Adjacency Map:** `graph_builder.py` maps out which nodes connect to which (`node_A -> [node_B, node_C]`).
* **Start Node Discovery:** It identifies the entry point by finding nodes with **zero incoming edges**, falling back to finding the explicit `trigger` node type if necessary.
* **Cycle Prevention:** Before execution even begins, the frontend actively blocks cycles (infinite loops) during the edge connection phase using a Depth-First Search (DFS) validation.

### 2. Execution Loop (Breadth-First Search)
The engine executes the graph using a simple **BFS Queue**:
1. Pop the next `node_id` from the queue.
2. Resolve its internal type (`http_request`, `python_function`, `condition`, etc.).
3. Execute the corresponding runner function from the `NODE_RUNNERS` registry.
4. Push all connected child nodes into the queue.

### 3. Shared State Interpolation
Instead of passing data purely from one node to its immediate child, the engine maintains a **global shared state dictionary**.
* Every node returns a dictionary of results (e.g., `{"status_code": 200, "response": {...}}`).
* These results are merged into the global `state`.
* Subsequent nodes can dynamically read from this state using Handlebars-style string interpolation (e.g., `{{status_code}}`).

### 4. Node Runners (`nodes.py`)
Each node type is an isolated python function. Notable nodes include:
* **HTTP Request:** Wraps `httpx` for outbound REST calls. Automatically parses JSON/Text responses.
* **Python Function:** Executes arbitrary python code in an isolated `exec()` scope, providing safe built-in functions (like `len`, `math`, `json`).
* **Condition:** Evaluates dynamic if/else branching (e.g., `status_code eq 200`).

### 5. Fault Tolerance & Logging
* If a single node throws an exception (like a network timeout), the engine intercepts the error, marks the node as `failed`, gracefully halts execution, and saves the detailed traceback into the PostgreSQL `Executions` table so it can be reviewed in the UI.

---

## 🚀 Future Improvements

While the core platform is fully functional, here are some key areas targeted for future enhancement:

### 1. Expanding the Node Ecosystem
- **Native Integration Nodes:** Adding dedicated, visually branded nodes for popular services (e.g., Slack, Notion, GitHub, Gmail) so users don't have to manually configure HTTP headers and endpoints.
- **Data Transformation Nodes:** Built-in nodes for parsing XML/CSV, mapping JSON payloads, and mutating data without writing custom Python code.
- **Advanced Logic Controls:** Adding `Switch/Case` routers, `Loop/Map` nodes for iterating over arrays, and `Wait/Delay` nodes that pause execution for a specific duration.

### 2. Application Optimization & Performance
- **Asynchronous Execution:** Transitioning the workflow engine from a synchronous `BFS` loop to a fully asynchronous model using `asyncio` or Celery/Redis for handling long-running or parallel branches concurrently.
- **Database Indexing & Caching:** Adding indexes to frequently queried fields in PostgreSQL (like `user_id` and `workflow_id`) and utilizing Redis caching for user profiles and node schemas to speed up the dashboard.
- **Frontend Lazy Loading:** Splitting the heavy React Flow bundle and loading it lazily only when a user navigates to the `/flow` editor, drastically reducing the initial load time of the landing page and dashboard.

### 3. Developer & UX Enhancements
- **Execution Webhooks:** Allowing users to trigger a workflow via an inbound HTTP webhook, expanding the platform's utility beyond manual triggers.
- **Live Canvas Debugging:** Showing real-time data payloads flowing through the connecting edges visually on the canvas during execution.
