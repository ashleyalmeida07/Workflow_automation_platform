from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from starlette.middleware.base import BaseHTTPMiddleware

from app.config import get_settings
from app.database import engine, Base
from app.routers import health
from app.routers.auth import router as auth_router
from app.routers.workflows import router as workflows_router
from app.routers.node_types import router as node_types_router
from app.routers.executions import router as executions_router

# Import models so SQLAlchemy knows about them when creating tables
import app.models.user       # noqa: F401
import app.models.workflow   # noqa: F401
import app.models.execution  # noqa: F401

settings = get_settings()


class CorsFallbackMiddleware(BaseHTTPMiddleware):
    """
    Starlette's CORSMiddleware does not add CORS headers to HTTP error responses
    (401, 422, 500, etc.), causing browsers to raise a CORS error even for
    normal auth failures.  This middleware ensures the header is always present.
    """
    async def dispatch(self, request: Request, call_next):
        response = await call_next(request)
        origin = request.headers.get("origin")
        if origin and "access-control-allow-origin" not in response.headers:
            response.headers["access-control-allow-origin"] = origin
            response.headers["access-control-allow-credentials"] = "true"
        return response


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

    # CORS middleware — must come BEFORE routers so it also covers error responses.
    # Starlette strips CORS headers from 4xx/5xx by default; using allow_origins=["*"]
    # during startup is the safest workaround for Render + Vercel deployments.
    origins = settings.cors_origins_list or ["*"]
    app.add_middleware(
        CORSMiddleware,
        allow_origins=origins,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
        expose_headers=["*"],
    )
    # Outer middleware: ensures CORS headers are present even on error responses
    app.add_middleware(CorsFallbackMiddleware)

    # Routers
    app.include_router(health.router)
    app.include_router(auth_router)
    app.include_router(workflows_router)
    app.include_router(node_types_router)
    app.include_router(executions_router)

    return app


app = create_app()