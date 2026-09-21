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
