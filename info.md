# Key Terms Cheat-Sheet

| Term | Explanation |
|------|-------------|
| `Mapped[X]` | Tells Python "this attribute will be of type X". It's a **type hint** that SQLAlchemy also uses to infer the column type. |
| `mapped_column(...)` | The actual **column definition** with database-level constraints. |
| `primary_key` | The **unique identifier** for each row (like a row's ID card). |
| `nullable` | `False` = the database will **reject** empty values; `True` = empty (`NULL`) is allowed. |
| `unique` | No two rows can have the **same value** in this column. |
| `default` | A value automatically filled in if you don't provide one. Here `datetime.utcnow` (without `()`) is passed as a **callable**, so it gets the current time at insert time, not at class-definition time. |
| `datetime \| None` | Python **union type** meaning "either a datetime or None" (i.e., the field is optional). |

---

# How Alembic Works

Alembic is a **database migration tool** — think of it like Git, but for your database schema.

## The Simple Idea

Every time you change a model (add a column, rename a table, etc.), you **don't touch the database manually**. Instead you:
1. Change your Python model
2. Tell Alembic to detect the change → it writes a migration file
3. Run the migration → Alembic applies the change to the DB

## Key Files

| File | Purpose |
|------|---------|
| `alembic.ini` | Config file (DB URL, paths) |
| `alembic/env.py` | Setup file — imports your models and connects to DB |
| `alembic/versions/` | Folder of migration files — one per change, in order |

## The 3 Commands You'll Use

```bash
# 1. Generate a migration — detects what changed in your models
alembic revision --autogenerate -m "describe your change"

# 2. Apply all pending migrations to the DB
alembic upgrade head

# 3. Undo the last migration (rollback)
alembic downgrade -1
```

## How a Migration File Looks

Each generated file has two functions:

```python
def upgrade():
    # What to DO — e.g. create a table, add a column
    op.create_table('users', ...)

def downgrade():
    # How to UNDO it — e.g. drop the table
    op.drop_table('users')
```

## Real-World Flow

```
You add a column to User model
        ↓
alembic revision --autogenerate -m "add phone to users"
        ↓
Alembic creates:  alembic/versions/xxxx_add_phone_to_users.py
        ↓
alembic upgrade head
        ↓
Column now exists in the real database ✅
```

---

# Phase 5 — Workflow CRUD APIs

## What a Workflow Is

A workflow is stored as a row in the `workflows` table. The most important column is `workflow_json`:

```json
{
  "nodes": [],
  "edges": []
}
```

- **nodes** — the individual steps (triggers, actions, conditions)
- **edges** — the connections between steps

This JSON is what the visual flow editor reads and writes.

## File Layout

```
backend/
├── app/
│   ├── database.py          ← SQLAlchemy engine + Session + Base
│   ├── models/
│   │   └── workflow.py      ← Workflow ORM model (DB table definition)
│   └── routers/
│       └── workflows.py     ← All 5 CRUD endpoints live here
```

## The 5 APIs

| Method | URL | What it does |
|--------|-----|--------------|
| `POST` | `/workflows/` | Create a new workflow |
| `GET` | `/workflows/` | List all my workflows |
| `GET` | `/workflows/{id}` | Get one workflow |
| `PUT` | `/workflows/{id}` | Update name/description/JSON |
| `DELETE` | `/workflows/{id}` | Delete permanently |

All endpoints are **protected** — you must send `Authorization: Bearer <token>` in the header.

## How a Request Flows

```
Frontend (Dashboard)
    → sends JWT in header
        → FastAPI router
            → get_current_user() decodes token → finds User in DB
                → CRUD logic runs on Workflow table
                    → response sent back as JSON
```

## How Tables Are Created

`main.py` calls `Base.metadata.create_all(bind=engine)` on startup.
This automatically creates any missing tables without needing migrations.

## Frontend Dashboard

After login, users land on `/dashboard` which:
1. Fetches `GET /auth/profile` (to show the user's name)
2. Fetches `GET /workflows/` (to list all workflows)
3. Shows a card for each workflow with **Edit** and **Delete** buttons
4. "New Workflow" button opens a modal → `POST /workflows/`
5. "Open editor" on a card navigates to `/flow` (the visual builder)
