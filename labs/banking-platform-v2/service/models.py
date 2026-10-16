"""Synthetic training models; no real customer/payment details permitted."""
import os
import time
from sqlalchemy import Integer, String, ForeignKey, UniqueConstraint, create_engine
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column, relationship, sessionmaker

class Base(DeclarativeBase):
    pass

class User(Base):
    __tablename__='users'
    id:Mapped[int]=mapped_column(Integer,primary_key=True)
    username:Mapped[str]=mapped_column(String(80),unique=True,nullable=False)
    password_digest:Mapped[str]=mapped_column(String(220),nullable=False)

class Token(Base):
    __tablename__='tokens'
    id:Mapped[int]=mapped_column(Integer,primary_key=True)
    user_id:Mapped[int]=mapped_column(ForeignKey('users.id'),nullable=False)
    digest:Mapped[str]=mapped_column(String(64),unique=True,nullable=False)
    expires_at:Mapped[int]=mapped_column(Integer,nullable=False)

class Account(Base):
    __tablename__='accounts'
    id:Mapped[int]=mapped_column(Integer,primary_key=True)
    user_id:Mapped[int]=mapped_column(ForeignKey('users.id'),nullable=False)
    label:Mapped[str]=mapped_column(String(100),nullable=False)
    balance_cents:Mapped[int]=mapped_column(Integer,nullable=False,default=0)

class Transfer(Base):
    __tablename__='transfers'
    __table_args__=(UniqueConstraint('user_id','request_key',name='uq_transfer_user_request'),)
    id:Mapped[int]=mapped_column(Integer,primary_key=True)
    user_id:Mapped[int]=mapped_column(ForeignKey('users.id'),nullable=False)
    source_id:Mapped[int]=mapped_column(ForeignKey('accounts.id'),nullable=False)
    destination_id:Mapped[int]=mapped_column(ForeignKey('accounts.id'),nullable=False)
    amount_cents:Mapped[int]=mapped_column(Integer,nullable=False)
    request_key:Mapped[str]=mapped_column(String(120),nullable=False)

class Audit(Base):
    __tablename__='audit_events'
    id:Mapped[int]=mapped_column(Integer,primary_key=True)
    user_id:Mapped[int]=mapped_column(Integer,nullable=False)
    operation:Mapped[str]=mapped_column(String(50),nullable=False)
    outcome:Mapped[str]=mapped_column(String(30),nullable=False)


def open_engine(url: str):
    # Keep the real exercise loopback-only. Production-grade deployment not supported.
    kwargs={'connect_args':{'check_same_thread':False}} if url.startswith('sqlite') else {}
    return create_engine(url,**kwargs)
