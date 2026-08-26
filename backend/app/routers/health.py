from fastapi import APIRouter, Depends

from app.database import get_db

router = APIRouter(prefix="/api", tags=["health"])


@router.get("/health")
async def health_check():
    """Basic health check endpoint."""
    return {"status": "healthy", "message": "CS Infocom Platform API is running"}


@router.get("/health/db")
async def db_health_check(conn=Depends(get_db)):
    """Database connectivity health check."""
    try:
        conn.execute("SELECT 1")
        return {"status": "healthy", "database": "connected"}
    except Exception as e:
        return {"status": "unhealthy", "database": str(e)}
