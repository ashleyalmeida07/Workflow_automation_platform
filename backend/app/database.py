from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base
from app.config import get_settings

settings = get_settings()

# Create the SQLAlchemy engine
engine = create_engine(
    settings.DATABASE_URL,
    connect_args={"check_same_thread": False} if settings.DATABASE_URL.startswith("sqlite") else {},
    pool_pre_ping=True,       # test connection before use, discard dead ones
    pool_recycle=300,         # recycle connections every 5 min to avoid SSL timeouts

)

# Session factory
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Base class for all models
Base = declarative_base()


def get_db():
    """FastAPI dependency — yields a DB session per request, then closes it."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
