"""
credentials.py – REST API for the Encrypted Credentials Vault.

Endpoints:
  GET    /credentials/           → list all credentials (names & types only, no secrets)
  POST   /credentials/           → create & encrypt a new credential
  PUT    /credentials/{id}       → update name or re-encrypt new secret fields
  DELETE /credentials/{id}       → delete permanently

Node execution uses the internal `resolve_credential()` helper to inject
decrypted fields into a node's settings at runtime.
"""

from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.credential import Credential
from app.models.user import User
from app.crypto import encrypt_secret, decrypt_secret
from auth.dependencies import get_current_user


router = APIRouter(prefix="/credentials", tags=["Credentials"])


# ── Pydantic Schemas ───────────────────────────────────────────────────────────

class CreateCredentialRequest(BaseModel):
    name: str                  # e.g. "My Neon DB", "OpenAI Production Key"
    credential_type: str       # e.g. "postgres_db", "openai", "slack"
    secret_fields: dict        # plaintext fields, e.g. {"password": "...", "api_key": "..."}


class UpdateCredentialRequest(BaseModel):
    name: str | None = None
    secret_fields: dict | None = None   # if provided, re-encrypts


class CredentialResponse(BaseModel):
    """Never exposes secret_fields — only metadata."""
    id: int
    name: str
    credential_type: str
    created_at: datetime
    updated_at: datetime | None

    class Config:
        from_attributes = True


# ── Helpers ───────────────────────────────────────────────────────────────────

def _get_or_404(cred_id: int, user_id: int, db: Session) -> Credential:
    cred = db.query(Credential).filter(
        Credential.id == cred_id,
        Credential.user_id == user_id,
    ).first()
    if not cred:
        raise HTTPException(status_code=404, detail="Credential not found")
    return cred


# ── Endpoints ─────────────────────────────────────────────────────────────────

@router.get("/", response_model=list[CredentialResponse])
def list_credentials(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Return metadata for all credentials owned by this user (no secrets)."""
    return db.query(Credential).filter(
        Credential.user_id == current_user.id
    ).all()


@router.post("/", response_model=CredentialResponse, status_code=201)
def create_credential(
    data: CreateCredentialRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Encrypt and persist a new credential."""
    if not data.name.strip():
        raise HTTPException(status_code=422, detail="Credential name cannot be blank")
    if not data.secret_fields:
        raise HTTPException(status_code=422, detail="secret_fields cannot be empty")

    encrypted = encrypt_secret(data.secret_fields, current_user.id)
    cred = Credential(
        name=data.name.strip(),
        credential_type=data.credential_type,
        encrypted_value=encrypted,
        user_id=current_user.id,
    )
    db.add(cred)
    db.commit()
    db.refresh(cred)
    return cred


@router.put("/{cred_id}", response_model=CredentialResponse)
def update_credential(
    cred_id: int,
    data: UpdateCredentialRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Rename or re-encrypt a credential."""
    cred = _get_or_404(cred_id, current_user.id, db)

    if data.name is not None:
        cred.name = data.name.strip()
    if data.secret_fields is not None:
        cred.encrypted_value = encrypt_secret(data.secret_fields, current_user.id)

    cred.updated_at = datetime.now(timezone.utc)
    db.commit()
    db.refresh(cred)
    return cred


@router.delete("/{cred_id}", status_code=204)
def delete_credential(
    cred_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Permanently delete a credential."""
    cred = _get_or_404(cred_id, current_user.id, db)
    db.delete(cred)
    db.commit()


# ── Internal helper used by the execution engine ──────────────────────────────

def resolve_credential(cred_id: int, user_id: int, db: Session) -> dict:
    """
    Fetch + decrypt a credential by ID.  Called inside node runners
    (postgres_db, openai, etc.) to inject live secrets at execution time.
    Returns the plaintext dict, e.g. {"password": "...", "api_key": "..."}.
    Raises HTTPException 404 if not found / 422 if decryption fails.
    """
    cred = db.query(Credential).filter(
        Credential.id == cred_id,
        Credential.user_id == user_id,
    ).first()
    if not cred:
        raise HTTPException(status_code=404, detail=f"Credential #{cred_id} not found")
    try:
        return decrypt_secret(cred.encrypted_value, user_id)
    except ValueError as exc:
        raise HTTPException(status_code=422, detail=str(exc))
