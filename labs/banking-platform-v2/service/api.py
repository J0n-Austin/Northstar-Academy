"""FastAPI + SQLAlchemy learning service. Work on synthetic localhost fixtures only.

Learner defects are marked with NS-B tickets. Deliberately NOT deployable publicly.
"""
import os,time
from contextlib import contextmanager
from fastapi import FastAPI,HTTPException,Header,Depends
from pydantic import BaseModel,Field,ConfigDict
from sqlalchemy import select,update
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session,sessionmaker
from .models import Base,User,Token,Account,Transfer,Audit,open_engine
from .security import password_digest,verify_password,new_token,token_digest

class Credentials(BaseModel):
    username:str=Field(min_length=3,max_length=60,pattern=r'^[a-zA-Z0-9_-]+$')
    password:str=Field(min_length=12,max_length=200)

class AccountRequest(BaseModel):
    label:str=Field(min_length=1,max_length=80)
    opening_cents:int=Field(ge=0,le=1_000_000)

class TransferRequest(BaseModel):
    source_id:int=Field(gt=0)
    destination_id:int=Field(gt=0)
    amount_cents:int=Field(gt=0,le=1_000_000)
    request_key:str=Field(min_length=6,max_length=120)


def create_app(database_url: str|None = None) -> FastAPI:
    url=database_url or os.environ.get('NORTHSTAR_DATABASE_URL','sqlite:///./northstar-v2.sqlite3')
    engine=open_engine(url)
    # Codespaces fast path for SQLite; PostgreSQL schema managed via Alembic upgrade head.
    if url.startswith('sqlite'): Base.metadata.create_all(engine)
    Sessions=sessionmaker(engine,expire_on_commit=False)
    app=FastAPI(title='Northstar Banking V2 Training',version='0.2.0',docs_url='/docs')
    app.state.engine=engine

    def db():
        with Sessions() as session:yield session

    def actor(authorization:str|None=Header(default=None),session:Session=Depends(db))->User:
        if not authorization or not authorization.startswith('Bearer '):raise HTTPException(401,'Bearer token required')
        digest=token_digest(authorization[7:])
        token=session.scalars(select(Token).where(Token.digest==digest,Token.expires_at>int(time.time()))).first()
        if token is None:raise HTTPException(401,'Expired or invalid token')
        user=session.get(User,token.user_id)
        if user is None:raise HTTPException(401,'Unknown actor')
        return user

    @app.get('/health')
    def health():return {'status':'ok','version':'v2'}

    @app.post('/users',status_code=201)
    def register(info:Credentials,session:Session=Depends(db)):
        if session.scalars(select(User).where(User.username==info.username)).first():raise HTTPException(409,'Username taken')
        user=User(username=info.username,password_digest=password_digest(info.password))
        session.add(user)
        try:session.commit()
        except IntegrityError:session.rollback();raise HTTPException(409,'Username taken')
        return {'id':user.id,'username':user.username}

    @app.post('/sessions')
    def login(info:Credentials,session:Session=Depends(db)):
        user=session.scalars(select(User).where(User.username==info.username)).first()
        if user is None or not verify_password(info.password,user.password_digest):raise HTTPException(401,'Invalid credentials')
        raw=new_token();session.add(Token(user_id=user.id,digest=token_digest(raw),expires_at=int(time.time())+3600));session.commit()
        return {'access_token':raw,'token_type':'bearer','expires_in':3600}

    @app.post('/accounts',status_code=201)
    def add_account(info:AccountRequest,session:Session=Depends(db),user:User=Depends(actor)):
        account=Account(user_id=user.id,label=info.label,balance_cents=info.opening_cents)
        session.add(account);session.commit()
        return {'id':account.id,'label':account.label,'balance_cents':account.balance_cents}

    @app.get('/accounts')
    def accounts(session:Session=Depends(db),user:User=Depends(actor)):
        rows=session.scalars(select(Account).where(Account.user_id==user.id).order_by(Account.id)).all()
        return {'accounts':[{'id':a.id,'label':a.label,'balance_cents':a.balance_cents} for a in rows]}

    @app.get('/accounts/{account_id}')
    def account(account_id:int,session:Session=Depends(db),user:User=Depends(actor)):
        # NS-B502: broken object authorization; repair before release.
        account=session.get(Account,account_id)
        if account is None:raise HTTPException(404,'Account not found')
        return {'id':account.id,'label':account.label,'balance_cents':account.balance_cents}

    @app.post('/transfers',status_code=201)
    def transfer(info:TransferRequest,session:Session=Depends(db),user:User=Depends(actor)):
        if info.source_id==info.destination_id:raise HTTPException(422,'Distinct accounts required')
        # NS-B503: idempotency and rollback safety currently missing. Tests expose it.
        src=session.get(Account,info.source_id);dst=session.get(Account,info.destination_id)
        if not src or not dst or src.user_id!=user.id or dst.user_id!=user.id:raise HTTPException(404,'Account unavailable')
        if src.balance_cents<info.amount_cents:raise HTTPException(409,'Insufficient funds')
        src.balance_cents-=info.amount_cents;dst.balance_cents+=info.amount_cents
        event=Transfer(user_id=user.id,source_id=src.id,destination_id=dst.id,amount_cents=info.amount_cents,request_key=info.request_key)
        session.add(event)
        try:session.commit()
        except IntegrityError:session.rollback();raise HTTPException(409,'Duplicate request')
        return {'id':event.id,'amount_cents':event.amount_cents,'replayed':False}

    @app.get('/statements/{account_id}')
    def statements(account_id:int,session:Session=Depends(db),user:User=Depends(actor)):
        # NS-B504: implement a stable, owner-scoped read model and redact private IDs.
        raise HTTPException(501,'Statement read model not yet implemented')

    @app.get('/audit')
    def audit(session:Session=Depends(db),user:User=Depends(actor)):
        # NS-B505: enforce minimum necessary audit fields and create useful events.
        return {'events':[]}

    return app

if __name__=='__main__':
    import uvicorn
    uvicorn.run(create_app(),host='127.0.0.1',port=8766)
