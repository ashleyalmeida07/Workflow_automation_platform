from fastapi import APIRouter
from app.engine.node_types import NODE_TYPES

# No auth required – this is just static metadata
router = APIRouter(prefix="/node-types", tags=["Node Types"])

@router.get("/")
def get_node_types():
    return NODE_TYPES
