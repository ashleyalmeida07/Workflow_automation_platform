"""
Workflow CRUD Router
====================
All endpoints require a valid JWT (Bearer token).
Workflows are stored as JSON in the `workflow_json` column:
  { "nodes": [], "edges": [] }

Routes:
  POST   /workflows/          → Create a new workflow
  GET    /workflows/          → List all workflows for the current user
  GET    /workflows/{id}      → Get a single workflow
  PUT    /workflows/{id}      → Update name, description, or JSON
  DELETE /workflows/{id}      → Delete a workflow
"""

from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.workflow import Workflow
from app.models.user import User
from auth.dependencies import get_current_user


router = APIRouter(prefix="/workflows", tags=["Workflows"])


# ── Schemas ──────────────────────────────────────────────────────────────────

class WorkflowJSON(BaseModel):
    """The visual graph: a list of nodes and edges."""
    nodes: list = []
    edges: list = []


class CreateWorkflowRequest(BaseModel):
    name: str
    description: str | None = None
    workflow_json: WorkflowJSON = WorkflowJSON()


class UpdateWorkflowRequest(BaseModel):
    name: str | None = None
    description: str | None = None
    workflow_json: WorkflowJSON | None = None


class WorkflowResponse(BaseModel):
    id: int
    name: str
    description: str | None
    workflow_json: dict
    user_id: int | None
    created_at: datetime
    updated_at: datetime | None

    class Config:
        from_attributes = True


# ── Helpers ───────────────────────────────────────────────────────────────────

def get_workflow_or_404(workflow_id: int, user_id: int, db: Session) -> Workflow:
    """Fetch a workflow that belongs to the current user, or raise 404."""
    wf = db.query(Workflow).filter(
        Workflow.id == workflow_id,
        Workflow.user_id == user_id,
    ).first()
    if not wf:
        raise HTTPException(status_code=404, detail="Workflow not found")
    return wf


# ── Endpoints ─────────────────────────────────────────────────────────────────

@router.post("/", response_model=WorkflowResponse, status_code=201)
def create_workflow(
    data: CreateWorkflowRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Create a new empty (or pre-filled) workflow."""
    wf = Workflow(
        name=data.name,
        description=data.description,
        workflow_json=data.workflow_json.model_dump(),
        user_id=current_user.id,
    )
    db.add(wf)
    db.commit()
    db.refresh(wf)
    return wf


@router.get("/", response_model=list[WorkflowResponse])
def list_workflows(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Return all workflows owned by the logged-in user."""
    return db.query(Workflow).filter(Workflow.user_id == current_user.id).all()


@router.get("/{workflow_id}", response_model=WorkflowResponse)
def get_workflow(
    workflow_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Return a single workflow by ID."""
    return get_workflow_or_404(workflow_id, current_user.id, db)


@router.put("/{workflow_id}", response_model=WorkflowResponse)
def update_workflow(
    workflow_id: int,
    data: UpdateWorkflowRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Update name, description, or the workflow JSON."""
    wf = get_workflow_or_404(workflow_id, current_user.id, db)

    if data.name is not None:
        wf.name = data.name
    if data.description is not None:
        wf.description = data.description
    if data.workflow_json is not None:
        wf.workflow_json = data.workflow_json.model_dump()

    wf.updated_at = datetime.now(timezone.utc)
    db.commit()
    db.refresh(wf)
    return wf


@router.delete("/{workflow_id}", status_code=204)
def delete_workflow(
    workflow_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Delete a workflow permanently."""
    wf = get_workflow_or_404(workflow_id, current_user.id, db)
    db.delete(wf)
    db.commit()
