"""OpenFlow Backend — FastAPI with SQLite, JWT auth, projects & assets."""

import os
import json
import hashlib
import hmac
import time
from datetime import datetime, timedelta
from typing import Optional

from fastapi import FastAPI, HTTPException, Depends, Header
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from sqlalchemy import create_engine, Column, Integer, String, Text, DateTime, ForeignKey
from sqlalchemy.orm import declarative_base, sessionmaker, Session

# ---------------------------------------------------------------------------
# Database setup
# ---------------------------------------------------------------------------

DATABASE_URL = "sqlite:///./openflow.db"
engine = create_engine(DATABASE_URL, connect_args={"check_same_thread": False})
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

JWT_SECRET = os.environ.get("JWT_SECRET", "openflow-dev-secret-change-me")
JWT_ALGORITHM = "HS256"
JWT_EXPIRY_HOURS = 72


# ---------------------------------------------------------------------------
# Models
# ---------------------------------------------------------------------------

class User(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True, nullable=False)
    password_hash = Column(String, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)


class Project(Base):
    __tablename__ = "projects"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    name = Column(String, nullable=False)
    workflow_json = Column(Text, default="{}")
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)


class Asset(Base):
    __tablename__ = "assets"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    project_id = Column(Integer, ForeignKey("projects.id"), nullable=True)
    type = Column(String, nullable=False)  # image, video, audio
    url = Column(String, nullable=False)
    metadata_json = Column(Text, default="{}")
    created_at = Column(DateTime, default=datetime.utcnow)


Base.metadata.create_all(bind=engine)

# ---------------------------------------------------------------------------
# App
# ---------------------------------------------------------------------------

app = FastAPI(title="OpenFlow API", version="0.1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


# ---------------------------------------------------------------------------
# Auth helpers
# ---------------------------------------------------------------------------

import base64

def _hash_password(password: str) -> str:
    salt = os.urandom(16)
    dk = hashlib.pbkdf2_hmac("sha256", password.encode(), salt, 100_000)
    return base64.b64encode(salt + dk).decode()


def _verify_password(password: str, stored: str) -> bool:
    raw = base64.b64decode(stored.encode())
    salt, dk = raw[:16], raw[16:]
    return hmac.compare_digest(dk, hashlib.pbkdf2_hmac("sha256", password.encode(), salt, 100_000))


def _create_token(user_id: int, email: str) -> str:
    payload = {
        "sub": user_id,
        "email": email,
        "exp": int(time.time()) + JWT_EXPIRY_HOURS * 3600,
    }
    # Manual JWT (avoid pyjwt import issues)
    header = base64.urlsafe_b64encode(json.dumps({"alg": "HS256", "typ": "JWT"}).encode()).rstrip(b"=").decode()
    pay = base64.urlsafe_b64encode(json.dumps(payload).encode()).rstrip(b"=").decode()
    sig_input = f"{header}.{pay}".encode()
    sig = base64.urlsafe_b64encode(hmac.new(JWT_SECRET.encode(), sig_input, hashlib.sha256).digest()).rstrip(b"=").decode()
    return f"{header}.{pay}.{sig}"


def _decode_token(token: str) -> dict:
    try:
        parts = token.split(".")
        if len(parts) != 3:
            raise ValueError("bad token")
        # Verify signature
        sig_input = f"{parts[0]}.{parts[1]}".encode()
        expected = base64.urlsafe_b64encode(hmac.new(JWT_SECRET.encode(), sig_input, hashlib.sha256).digest()).rstrip(b"=").decode()
        if not hmac.compare_digest(expected, parts[2]):
            raise ValueError("bad sig")
        # Decode payload
        padded = parts[1] + "=" * (4 - len(parts[1]) % 4)
        payload = json.loads(base64.urlsafe_b64decode(padded))
        if payload.get("exp", 0) < time.time():
            raise ValueError("expired")
        return payload
    except Exception as e:
        raise HTTPException(status_code=401, detail=str(e))


def get_current_user(authorization: Optional[str] = Header(None), db: Session = Depends(get_db)) -> User:
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Missing token")
    payload = _decode_token(authorization[7:])
    user = db.query(User).filter(User.id == payload["sub"]).first()
    if not user:
        raise HTTPException(status_code=401, detail="User not found")
    return user


# ---------------------------------------------------------------------------
# Auth endpoints
# ---------------------------------------------------------------------------

class AuthRequest(BaseModel):
    email: str
    password: str


@app.post("/auth/signup")
def signup(req: AuthRequest, db: Session = Depends(get_db)):
    if db.query(User).filter(User.email == req.email).first():
        raise HTTPException(status_code=400, detail="Email already registered")
    user = User(email=req.email, password_hash=_hash_password(req.password))
    db.add(user)
    db.commit()
    db.refresh(user)
    return {"token": _create_token(user.id, user.email), "user_id": user.id}


@app.post("/auth/login")
def login(req: AuthRequest, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == req.email).first()
    if not user or not _verify_password(req.password, user.password_hash):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    return {"token": _create_token(user.id, user.email), "user_id": user.id}


# ---------------------------------------------------------------------------
# Project endpoints
# ---------------------------------------------------------------------------

class ProjectCreate(BaseModel):
    name: str
    workflow_json: str = "{}"


class ProjectUpdate(BaseModel):
    name: Optional[str] = None
    workflow_json: Optional[str] = None


@app.get("/projects")
def list_projects(user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    projects = db.query(Project).filter(Project.user_id == user.id).order_by(Project.updated_at.desc()).all()
    return [{"id": p.id, "name": p.name, "workflow_json": p.workflow_json,
             "created_at": str(p.created_at), "updated_at": str(p.updated_at)} for p in projects]


@app.post("/projects")
def create_project(req: ProjectCreate, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    p = Project(user_id=user.id, name=req.name, workflow_json=req.workflow_json)
    db.add(p)
    db.commit()
    db.refresh(p)
    return {"id": p.id, "name": p.name, "created_at": str(p.created_at)}


@app.get("/projects/{project_id}")
def get_project(project_id: int, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    p = db.query(Project).filter(Project.id == project_id, Project.user_id == user.id).first()
    if not p:
        raise HTTPException(status_code=404, detail="Not found")
    return {"id": p.id, "name": p.name, "workflow_json": p.workflow_json,
            "created_at": str(p.created_at), "updated_at": str(p.updated_at)}


@app.put("/projects/{project_id}")
def update_project(project_id: int, req: ProjectUpdate, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    p = db.query(Project).filter(Project.id == project_id, Project.user_id == user.id).first()
    if not p:
        raise HTTPException(status_code=404, detail="Not found")
    if req.name is not None:
        p.name = req.name
    if req.workflow_json is not None:
        p.workflow_json = req.workflow_json
    p.updated_at = datetime.utcnow()
    db.commit()
    return {"ok": True}


@app.delete("/projects/{project_id}")
def delete_project(project_id: int, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    p = db.query(Project).filter(Project.id == project_id, Project.user_id == user.id).first()
    if not p:
        raise HTTPException(status_code=404, detail="Not found")
    db.delete(p)
    db.commit()
    return {"ok": True}


# ---------------------------------------------------------------------------
# Asset endpoints
# ---------------------------------------------------------------------------

class AssetCreate(BaseModel):
    project_id: Optional[int] = None
    type: str
    url: str
    metadata_json: str = "{}"


@app.get("/assets")
def list_assets(user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    assets = db.query(Asset).filter(Asset.user_id == user.id).order_by(Asset.created_at.desc()).all()
    return [{"id": a.id, "type": a.type, "url": a.url, "project_id": a.project_id,
             "metadata_json": a.metadata_json, "created_at": str(a.created_at)} for a in assets]


@app.post("/assets")
def create_asset(req: AssetCreate, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    a = Asset(user_id=user.id, project_id=req.project_id, type=req.type, url=req.url, metadata_json=req.metadata_json)
    db.add(a)
    db.commit()
    db.refresh(a)
    return {"id": a.id, "url": a.url, "created_at": str(a.created_at)}


@app.get("/health")
def health():
    return {"status": "ok"}
