"""
crypto.py – AES-256-GCM encryption helpers for the Credentials Vault.

Uses Python's built-in `secrets` + the `cryptography` library.

Key derivation: SHA-256(JWT_SECRET + ":" + str(user_id))
This means a credential encrypted for user 5 cannot be decrypted
by anyone who doesn't know both the server secret AND the user id.

Wire format  (base64url-encoded):
    [ 12-byte nonce ][ ciphertext ][ 16-byte GCM tag ]
"""

import base64
import hashlib
import json
import os
from cryptography.hazmat.primitives.ciphers.aead import AESGCM

from app.config import get_settings

settings = get_settings()


def _derive_key(user_id: int) -> bytes:
    """Derive a 32-byte AES key scoped to this user."""
    raw = f"{settings.JWT_SECRET}:{user_id}".encode()
    return hashlib.sha256(raw).digest()   # 32 bytes → AES-256


def encrypt_secret(plaintext_dict: dict, user_id: int) -> str:
    """
    Encrypt a dict of secret fields (e.g. {'password': 'hunter2'}).
    Returns a base64-encoded string safe to store in the DB.
    """
    key   = _derive_key(user_id)
    aesgcm = AESGCM(key)
    nonce  = os.urandom(12)
    data   = json.dumps(plaintext_dict, ensure_ascii=False).encode()
    ct     = aesgcm.encrypt(nonce, data, None)   # ciphertext + 16-byte tag
    blob   = nonce + ct                           # 12 + len(ct)
    return base64.urlsafe_b64encode(blob).decode()


def decrypt_secret(encoded: str, user_id: int) -> dict:
    """
    Decrypt a base64-encoded blob back to the original dict.
    Raises ValueError if tampered or wrong key.
    """
    try:
        key    = _derive_key(user_id)
        aesgcm = AESGCM(key)
        blob   = base64.urlsafe_b64decode(encoded)
        nonce  = blob[:12]
        ct     = blob[12:]
        plain  = aesgcm.decrypt(nonce, ct, None)
        return json.loads(plain)
    except Exception as exc:
        raise ValueError(f"Credential decryption failed: {exc}") from exc
