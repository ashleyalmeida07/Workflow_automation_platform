from datetime import datetime
from typing import TYPE_CHECKING

from sqlalchemy import String, DateTime, Text, JSON, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base

if TYPE_CHECKING:
    from .execution import Execution
    from .user import User


class Workflow(Base):
    __tablename__ = "workflows"

    id: Mapped[int] = mapped_column(
        primary_key=True
    )

    name: Mapped[str] = mapped_column(
        String(255),
        nullable=False
    )

    description: Mapped[str | None] = mapped_column(
        Text,
        nullable=True
    )

    workflow_json: Mapped[dict] = mapped_column(
        JSON,
        nullable=False,
        default=dict
    )

    user_id: Mapped[int | None] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=True
    )

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=datetime.utcnow
    )

    updated_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True),
        nullable=True
    )

    executions: Mapped[list["Execution"]] = relationship(
        "Execution",
        back_populates="workflow"
    )

    user: Mapped["User | None"] = relationship(
        "User",
        back_populates="workflows"
    )