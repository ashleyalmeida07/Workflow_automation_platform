from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import get_settings
from app.database import engine, Base
from app.routers import health
from app.routers.auth import router as auth_router
from app.routers.workflows import router as workflows_router

# Import models so SQLAlchemy knows about them when creating tables
import app.models.user       # noqa: F401
import app.models.workflow   # noqa: F401
import app.models.execution  # noqa: F401

settings = get_settings()


def create_app() -> FastAPI:
    """Application factory for the FastAPI app."""
    app = FastAPI(
        title="FlowForge",
        description="Visual Workflow Automation Platform",
        version="0.1.0",
        debug=settings.DEBUG,
    )

    # Create all DB tables on startup (safe to run repeatedly)
    Base.metadata.create_all(bind=engine)

    # CORS middleware
    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.cors_origins_list,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    # Routers
    app.include_router(health.router)
    app.include_router(auth_router)
    app.include_router(workflows_router)

    return app


app = create_app()