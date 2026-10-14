"""
credential.py – SQLAlchemy model for the Encrypted Credentials Vault.

Each row represents one saved credential (e.g. "My Postgres DB", "OpenAI Key").
The sensitive `encrypted_value` column stores AES-GCM ciphertext — never
the raw secret. The decryption key is derived from JWT_SECRET + user_id.
"""

from datetime import datetime
from typing import TYPE_CHECKING

from sqlalchemy import String, Text, DateTime, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base

if TYPE_CHECKING:
    from .user import User


class Credential(Base):
    __tablename__ = "credentials"

    id: Mapped[int] = mapped_column(primary_key=True)

    # Human-readable alias shown in the node dropdown
    name: Mapped[str] = mapped_column(String(255), nullable=False)

    # One of: postgres_db | openai | slack | email | http_request | generic
    credential_type: Mapped[str] = mapped_column(String(100), nullable=False)

    # AES-GCM ciphertext (base64-encoded), never stores plaintext
    encrypted_value: Mapped[str] = mapped_column(Text, nullable=False)

    user_id: Mapped[int] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"), nullable=False
    )

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=datetime.utcnow
    )

    updated_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), nullable=True
    )

    user: Mapped["User"] = relationship("User", back_populates="credentials")
