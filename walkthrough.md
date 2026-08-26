# Platform Setup — Walkthrough

## Project Structure

```
platform/
├── backend/
│   ├── venv/                    # Python virtual environment
│   ├── app/
│   │   ├── __init__.py
│   │   ├── main.py              # FastAPI app factory + CORS
│   │   ├── config.py            # Pydantic settings (reads .env)
│   │   ├── database.py          # SQLAlchemy engine + session
│   │   ├── models/
│   │   │   ├── __init__.py
│   │   │   └── base.py          # Example User model
│   │   └── routers/
│   │       ├── __init__.py
│   │       └── health.py        # /api/health + /api/health/db
│   ├── alembic/
│   │   ├── env.py               # Migration environment
│   │   ├── script.py.mako       # Migration template
│   │   └── versions/            # Migration scripts
│   ├── alembic.ini
│   ├── requirements.txt
│   ├── .env
│   └── .gitignore
└── frontend/
    ├── node_modules/
    ├── src/
    │   ├── main.jsx             # Entry point with BrowserRouter
    │   ├── App.jsx              # Route definitions
    │   ├── index.css            # Tailwind CSS v4 entry
    │   └── pages/
    │       ├── Home.jsx         # Landing page
    │       └── Flow.jsx         # React Flow editor
    ├── vite.config.js           # Vite + Tailwind + API proxy
    └── package.json
```

---

## Backend — What was set up

| Item | Details |
|------|---------|
| **Python** | 3.13.1 (already installed) |
| **Virtual env** | `backend/venv/` |
| **Framework** | FastAPI 0.115.0 |
| **Server** | Uvicorn 0.30.6 (with standard extras) |
| **ORM** | SQLAlchemy 2.0.35 |
| **PostgreSQL driver** | psycopg 3.2.3 (binary wheels) |
| **Migrations** | Alembic 1.13.2 |
| **Validation** | Pydantic 2.9.2 + pydantic-settings 2.5.2 |
| **Config** | python-dotenv 1.0.1 (`.env` file) |

### Database Configuration

The [`.env`](file:///c:/Users/Ashley/OneDrive/Documents/CS_Infocom/platform/backend/.env) file contains:
```
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/cs_infocom
```

> [!IMPORTANT]
> Update the PostgreSQL credentials in `.env` to match your local setup. Make sure the `cs_infocom` database exists.

### How to run the backend
```bash
cd platform/backend
.\venv\Scripts\activate
uvicorn app.main:app --reload
```
The API will be available at `http://localhost:8000` with docs at `/docs`.

---

## Frontend — What was set up

| Item | Details |
|------|---------|
| **Node** | 22.14.0 (already installed) |
| **Bundler** | Vite 8.2.1 (React template) |
| **React Flow** | @xyflow/react (latest) |
| **Tailwind CSS** | v4.3.3 (with @tailwindcss/vite plugin) |
| **Routing** | react-router-dom (latest) |

### Routes
| Path | Component | Description |
|------|-----------|-------------|
| `/` | `Home` | Landing page with link to flow editor |
| `/flow` | `Flow` | React Flow canvas with nodes, edges, minimap & controls |

### Vite proxy
The [`vite.config.js`](file:///c:/Users/Ashley/OneDrive/Documents/CS_Infocom/platform/frontend/vite.config.js) proxies `/api` requests to `http://localhost:8000` so the frontend can call the backend without CORS issues in development.

### How to run the frontend
```bash
cd platform/frontend
npm run dev
```
The app will be available at `http://localhost:5173`.

---

## Verification

- ✅ All 27 Python packages installed successfully
- ✅ All 66 npm packages installed (0 vulnerabilities)
- ✅ Frontend production build passes (181 modules, 1.78s)
