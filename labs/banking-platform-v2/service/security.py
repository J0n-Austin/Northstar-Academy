"""Local demonstration credential policy. Not a production IAM implementation."""
import hashlib,hmac,secrets,time
from fastapi import Depends,Header,HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import select
from .models import User,Token

ITERATIONS=260_000

def password_digest(password: str) -> str:
    salt=secrets.token_bytes(16)
    key=hashlib.pbkdf2_hmac('sha256',password.encode(),salt,ITERATIONS)
    return salt.hex()+':'+key.hex()

def verify_password(password: str,stored: str) -> bool:
    try:
        salt,digest=stored.split(':',1)
        actual=hashlib.pbkdf2_hmac('sha256',password.encode(),bytes.fromhex(salt),ITERATIONS)
        return hmac.compare_digest(actual,bytes.fromhex(digest))
    except (ValueError,TypeError):return False

def new_token() -> str:
    return secrets.token_urlsafe(32)

def token_digest(value: str) -> str:
    return hashlib.sha256(value.encode('utf-8')).hexdigest()
