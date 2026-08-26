# Deliverables Summary

## 1. ✅ Database Schema

File: [`querys.sql`](file:///c:/Users/Ashley/OneDrive/Documents/CS_Infocom/platform/backend/querys.sql)

Three tables defined in raw SQL:

| Table | Key Columns |
|-------|------------|
| `users` | `id`, `name`, `email` (unique), `password`, `created_at`, `updated_at` |
| `workflows` | `id`, `name`, `description`, `workflow_json` (JSONB), `user_id` → FK to users, `created_at`, `updated_at` |
| `executions` | `id`, `workflow_id` → FK to workflows (CASCADE), `status`, `logs`, `output` (JSONB), `started_at`, `finished_at`, `created_at` |

**Relationships:**
```
users ──(1:many)──► workflows ──(1:many)──► executions
```

---

## 2. ✅ Migration Scripts

Tool: **Alembic**

| File | Purpose |
|------|---------|
| [`alembic.ini`](file:///c:/Users/Ashley/OneDrive/Documents/CS_Infocom/platform/backend/alembic.ini) | Alembic configuration |
| [`alembic/env.py`](file:///c:/Users/Ashley/OneDrive/Documents/CS_Infocom/platform/backend/alembic/env.py) | Connects models to Alembic, reads DB URL from `.env` |
| [`alembic/versions/6b9bc76fdadc_initial_tables.py`](file:///c:/Users/Ashley/OneDrive/Documents/CS_Infocom/platform/backend/alembic/versions/6b9bc76fdadc_initial_tables.py) | Auto-generated migration — creates all 3 tables |

**Status:** `alembic upgrade head` ran successfully ✅  
All tables are live in the Neon PostgreSQL database.

**Commands for future schema changes:**
```bash
# After changing a model:
alembic revision --autogenerate -m "describe change"
alembic upgrade head
```

---

## 3. ✅ ORM Models

Framework: **SQLAlchemy 2.0** (Mapped / mapped_column style)

| File | Class | Table |
|------|-------|-------|
| [`app/models/user.py`](file:///c:/Users/Ashley/OneDrive/Documents/CS_Infocom/platform/backend/app/models/user.py) | `User` | `users` |
| [`app/models/workflow.py`](file:///c:/Users/Ashley/OneDrive/Documents/CS_Infocom/platform/backend/app/models/workflow.py) | `Workflow` | `workflows` |
| [`app/models/execution.py`](file:///c:/Users/Ashley/OneDrive/Documents/CS_Infocom/platform/backend/app/models/execution.py) | `Execution` | `executions` |

**Relationships configured:**

```python
# User → Workflow (one-to-many)
user.workflows        # list of all workflows owned by user
workflow.user         # the owner user

# Workflow → Execution (one-to-many)
workflow.executions   # list of all runs for this workflow
execution.workflow    # the parent workflow
```

**Shared base:** [`database.py`](file:///c:/Users/Ashley/OneDrive/Documents/CS_Infocom/platform/backend/database.py) — defines `Base`, `engine`, and `SessionLocal`
