from datetime import datetime
from typing import TYPE_CHECKING

from sqlalchemy import String, Text, DateTime, ForeignKey, JSON
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base

if TYPE_CHECKING:
    from .workflow import Workflow


class Execution(Base):
    __tablename__ = "executions"

    id: Mapped[int] = mapped_column(
        primary_key=True
    )

    workflow_id: Mapped[int] = mapped_column(
        ForeignKey("workflows.id", ondelete="CASCADE"),
        nullable=False
    )

    status: Mapped[str] = mapped_column(
        String(50),
        nullable=False,
        default="pending"
    )

    logs: Mapped[str | None] = mapped_column(
        Text,
        nullable=True
    )

    output: Mapped[dict | None] = mapped_column(
        JSON,
        nullable=True
    )

    started_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True),
        nullable=True
    )

    finished_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True),
        nullable=True
    )

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=datetime.utcnow
    )

    workflow: Mapped["Workflow"] = relationship(
        "Workflow",
        back_populates="executions"
    )