"""
executions.py – POST /workflows/{id}/execute
             – GET  /workflows/{id}/executions

Runs the workflow synchronously (simple & debuggable) and returns
the full step-by-step result immediately.
"""

from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.workflow import Workflow
from app.models.execution import Execution
from app.models.user import User
from auth.dependencies import get_current_user
from app.engine.graph_builder import run_workflow

router = APIRouter(prefix="/workflows", tags=["Executions"])


@router.get("/{workflow_id}/executions")
def list_executions(
    workflow_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Return all past executions for a workflow, newest first."""
    workflow = db.query(Workflow).filter(
        Workflow.id == workflow_id,
        Workflow.user_id == current_user.id,
    ).first()

    if not workflow:
        raise HTTPException(status_code=404, detail="Workflow not found")

    executions = (
        db.query(Execution)
        .filter(Execution.workflow_id == workflow_id)
        .order_by(Execution.started_at.desc())
        .limit(50)
        .all()
    )

    return [
        {
            "id":          ex.id,
            "status":      ex.status,
            "started_at":  ex.started_at.isoformat() if ex.started_at  else None,
            "finished_at": ex.finished_at.isoformat() if ex.finished_at else None,
            "steps":       ex.output.get("steps", []) if ex.output else [],
            "error":       ex.logs or None,
        }
        for ex in executions
    ]


@router.post("/{workflow_id}/execute")
def execute_workflow(
    workflow_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    # ── 1. Fetch the workflow ─────────────────────────────────────────────
    workflow = db.query(Workflow).filter(
        Workflow.id == workflow_id,
        Workflow.user_id == current_user.id,
    ).first()

    if not workflow:
        raise HTTPException(status_code=404, detail="Workflow not found")

    # ── 2. Create an execution record (status = running) ──────────────────
    execution = Execution(
        workflow_id=workflow_id,
        status="running",
        started_at=datetime.now(timezone.utc),
    )
    db.add(execution)
    db.commit()
    db.refresh(execution)

    # ── 3. Run the graph ──────────────────────────────────────────────────
    result = run_workflow(workflow.workflow_json)

    # ── 4. Persist the result ─────────────────────────────────────────────
    execution.status      = result["status"]           # "completed" | "failed"
    execution.output      = result                     # full result stored as JSON
    execution.logs        = result.get("error", "")   # top-level error if any
    execution.finished_at = datetime.now(timezone.utc)
    db.commit()

    # ── 5. Return the full result to the caller ───────────────────────────
    return {
        "execution_id": execution.id,
        "status":       result["status"],
        "steps":        result.get("steps", []),
        "state":        result.get("state", {}),
        "error":        result.get("error"),
    }
