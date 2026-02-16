"""OpenFlow Backend — Vercel Serverless FastAPI"""

import os
import json
import uuid
from datetime import datetime, timedelta
from typing import Optional

import bcrypt
import jwt
import httpx
from fastapi import FastAPI, Depends, HTTPException, Header
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from sqlalchemy import create_engine, Column, String, Text, ForeignKey, DateTime
from sqlalchemy.orm import sessionmaker, declarative_base, Session, relationship

# ---------------------------------------------------------------------------
# Config
# ---------------------------------------------------------------------------
SECRET_KEY = os.environ.get("JWT_SECRET", "openflow-dev-secret-change-in-prod")
FAL_API_KEY = os.environ.get("FAL_API_KEY", "148ec4ac-aafc-416b-9213-74cacdeefe5e:0dc2faa972e5762ba57fc758b2fd99e8")
DATABASE_URL = os.environ.get("DATABASE_URL", "sqlite:////tmp/openflow.db")
ALGORITHM = "HS256"
TOKEN_EXPIRE_HOURS = 72

# ---------------------------------------------------------------------------
# Database
# ---------------------------------------------------------------------------
connect_args = {"check_same_thread": False} if "sqlite" in DATABASE_URL else {}
engine = create_engine(DATABASE_URL, connect_args=connect_args)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()


class UserModel(Base):
    __tablename__ = "users"
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    email = Column(String, unique=True, nullable=False, index=True)
    username = Column(String, unique=True, nullable=False, index=True)
    password_hash = Column(String, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    projects = relationship("ProjectModel", back_populates="user")
    assets = relationship("AssetModel", back_populates="user")


class ProjectModel(Base):
    __tablename__ = "projects"
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String, ForeignKey("users.id"), nullable=False)
    name = Column(String, nullable=False)
    description = Column(Text, default="")
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    user = relationship("UserModel", back_populates="projects")
    workflows = relationship("WorkflowModel", back_populates="project")


class WorkflowModel(Base):
    __tablename__ = "workflows"
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    project_id = Column(String, ForeignKey("projects.id"), nullable=False)
    name = Column(String, nullable=False)
    data = Column(Text, default="{}")
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    project = relationship("ProjectModel", back_populates="workflows")


class AssetModel(Base):
    __tablename__ = "assets"
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String, ForeignKey("users.id"), nullable=False)
    project_id = Column(String, ForeignKey("projects.id"), nullable=True)
    type = Column(String, default="image")
    url = Column(Text, nullable=False)
    prompt = Column(Text, default="")
    model = Column(String, default="")
    metadata_json = Column(Text, default="{}")
    created_at = Column(DateTime, default=datetime.utcnow)
    user = relationship("UserModel", back_populates="assets")


Base.metadata.create_all(bind=engine)

# ---------------------------------------------------------------------------
# FastAPI
# ---------------------------------------------------------------------------
app = FastAPI(title="OpenFlow API", version="1.0.0")

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


def hash_password(pw: str) -> str:
    return bcrypt.hashpw(pw.encode(), bcrypt.gensalt()).decode()

def verify_password(pw: str, hashed: str) -> bool:
    return bcrypt.checkpw(pw.encode(), hashed.encode())

def create_token(user_id: str, email: str) -> str:
    return jwt.encode({"sub": user_id, "email": email, "exp": datetime.utcnow() + timedelta(hours=TOKEN_EXPIRE_HOURS)}, SECRET_KEY, algorithm=ALGORITHM)

def get_current_user(authorization: Optional[str] = Header(None), db: Session = Depends(get_db)) -> UserModel:
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(401, "Missing token")
    try:
        payload = jwt.decode(authorization.split(" ", 1)[1], SECRET_KEY, algorithms=[ALGORITHM])
        user = db.query(UserModel).filter(UserModel.id == payload["sub"]).first()
        if not user: raise HTTPException(401, "Not found")
        return user
    except jwt.ExpiredSignatureError:
        raise HTTPException(401, "Token expired")
    except jwt.InvalidTokenError:
        raise HTTPException(401, "Invalid token")

# Schemas
class SignupReq(BaseModel):
    email: str; username: str; password: str

class LoginReq(BaseModel):
    email: str; password: str

class ProjectCreate(BaseModel):
    name: str; description: str = ""

class WorkflowCreate(BaseModel):
    name: str; data: dict = {}

class WorkflowUpdate(BaseModel):
    name: Optional[str] = None; data: Optional[dict] = None

class GenerateReq(BaseModel):
    model: str; inputs: dict; project_id: Optional[str] = None

class SceneReq(BaseModel):
    story: str; num_scenes: int = 4; style: str = "cinematic"

# Auth
@app.post("/api/auth/signup")
def signup(req: SignupReq, db: Session = Depends(get_db)):
    if db.query(UserModel).filter(UserModel.email == req.email).first():
        raise HTTPException(400, "Email taken")
    if db.query(UserModel).filter(UserModel.username == req.username).first():
        raise HTTPException(400, "Username taken")
    user = UserModel(email=req.email, username=req.username, password_hash=hash_password(req.password))
    db.add(user); db.commit(); db.refresh(user)
    proj = ProjectModel(user_id=user.id, name="My First Project")
    db.add(proj); db.commit()
    return {"token": create_token(user.id, user.email), "user": {"id": user.id, "email": user.email, "username": user.username}}

@app.post("/api/auth/login")
def login(req: LoginReq, db: Session = Depends(get_db)):
    user = db.query(UserModel).filter(UserModel.email == req.email).first()
    if not user or not verify_password(req.password, user.password_hash):
        raise HTTPException(401, "Invalid credentials")
    return {"token": create_token(user.id, user.email), "user": {"id": user.id, "email": user.email, "username": user.username}}

@app.get("/api/auth/me")
def me(user: UserModel = Depends(get_current_user)):
    return {"id": user.id, "email": user.email, "username": user.username}

# Projects
@app.get("/api/projects")
def list_projects(user: UserModel = Depends(get_current_user), db: Session = Depends(get_db)):
    return [{"id": p.id, "name": p.name, "description": p.description, "created_at": str(p.created_at)} for p in db.query(ProjectModel).filter(ProjectModel.user_id == user.id).all()]

@app.post("/api/projects")
def create_project(req: ProjectCreate, user: UserModel = Depends(get_current_user), db: Session = Depends(get_db)):
    p = ProjectModel(user_id=user.id, name=req.name, description=req.description)
    db.add(p); db.commit(); db.refresh(p)
    return {"id": p.id, "name": p.name}

# Workflows
@app.get("/api/projects/{pid}/workflows")
def list_workflows(pid: str, user: UserModel = Depends(get_current_user), db: Session = Depends(get_db)):
    p = db.query(ProjectModel).filter(ProjectModel.id == pid, ProjectModel.user_id == user.id).first()
    if not p: raise HTTPException(404)
    return [{"id": w.id, "name": w.name, "data": json.loads(w.data), "updated_at": str(w.updated_at)} for w in db.query(WorkflowModel).filter(WorkflowModel.project_id == pid).all()]

@app.post("/api/projects/{pid}/workflows")
def create_workflow(pid: str, req: WorkflowCreate, user: UserModel = Depends(get_current_user), db: Session = Depends(get_db)):
    p = db.query(ProjectModel).filter(ProjectModel.id == pid, ProjectModel.user_id == user.id).first()
    if not p: raise HTTPException(404)
    w = WorkflowModel(project_id=pid, name=req.name, data=json.dumps(req.data))
    db.add(w); db.commit(); db.refresh(w)
    return {"id": w.id, "name": w.name, "data": json.loads(w.data)}

@app.put("/api/workflows/{wid}")
def update_workflow(wid: str, req: WorkflowUpdate, user: UserModel = Depends(get_current_user), db: Session = Depends(get_db)):
    w = db.query(WorkflowModel).join(ProjectModel).filter(WorkflowModel.id == wid, ProjectModel.user_id == user.id).first()
    if not w: raise HTTPException(404)
    if req.name: w.name = req.name
    if req.data is not None: w.data = json.dumps(req.data)
    db.commit()
    return {"id": w.id, "name": w.name, "data": json.loads(w.data)}

# Generate
FAL_MODELS = {
    "flux-2-pro": "fal-ai/flux-pro/v1.1", "flux-fast": "fal-ai/flux/schnell",
    "flux-pro-1.1": "fal-ai/flux-pro/v1.1", "sd-3.5": "fal-ai/stable-diffusion-v35-large",
    "dall-e-3": "fal-ai/dall-e-3", "imagen-4": "fal-ai/imagen4/preview",
    "wan-2.1": "fal-ai/wan/v2.1", "kling-3.0-pro": "fal-ai/kling-video/v3/pro/text-to-video",
    "minimax-hailuo": "fal-ai/minimax-video/video-01-live/text-to-video",
    "hunyuan": "fal-ai/hunyuan-video", "luma-ray-2": "fal-ai/luma-dream-machine",
}

@app.post("/api/generate")
async def generate(req: GenerateReq, user: UserModel = Depends(get_current_user), db: Session = Depends(get_db)):
    fal_model = FAL_MODELS.get(req.model, "fal-ai/flux/dev")
    inp = req.inputs
    is_video = any(k in fal_model for k in ["video", "wan", "kling", "minimax", "hunyuan", "luma", "ltx", "mochi"])
    body: dict = {"prompt": inp.get("prompt", "")}
    if inp.get("negative_prompt"): body["negative_prompt"] = inp["negative_prompt"]
    if is_video:
        if inp.get("duration"): body["duration"] = f"{inp['duration']}s"
        if inp.get("width"): body["video_size"] = {"width": int(inp["width"]), "height": int(inp.get("height", 720))}
    else:
        if inp.get("width"): body["image_size"] = {"width": int(inp["width"]), "height": int(inp.get("height", inp["width"]))}
    if inp.get("guidance_scale"): body["guidance_scale"] = float(inp["guidance_scale"])
    if inp.get("seed") and int(inp["seed"]) >= 0: body["seed"] = int(inp["seed"])

    async with httpx.AsyncClient(timeout=300) as client:
        resp = await client.post(f"https://fal.run/{fal_model}", json=body, headers={"Content-Type": "application/json", "Authorization": f"Key {FAL_API_KEY}"})
        data = resp.json()
    url = (data.get("images") or [{}])[0].get("url") or data.get("image", {}).get("url") or data.get("video", {}).get("url")
    if url:
        a = AssetModel(user_id=user.id, project_id=req.project_id, type="video" if is_video else "image", url=url, prompt=inp.get("prompt", ""), model=req.model, metadata_json=json.dumps(inp))
        db.add(a); db.commit()
        return {"url": url, "asset_id": a.id}
    raise HTTPException(500, f"Generation failed: {str(data)[:300]}")

# Assets
@app.get("/api/assets")
def list_assets(user: UserModel = Depends(get_current_user), db: Session = Depends(get_db), limit: int = 50):
    return [{"id": a.id, "type": a.type, "url": a.url, "prompt": a.prompt, "model": a.model, "created_at": str(a.created_at)} for a in db.query(AssetModel).filter(AssetModel.user_id == user.id).order_by(AssetModel.created_at.desc()).limit(limit).all()]

# Scene Builder
@app.post("/api/scene-builder")
async def scene_builder(req: SceneReq, user: UserModel = Depends(get_current_user)):
    import re
    try:
        async with httpx.AsyncClient(timeout=60) as client:
            resp = await client.post("https://fal.run/fal-ai/any-llm", json={
                "model": "google/gemini-flash-2.0",
                "prompt": f"Break this story into {req.num_scenes} visual scenes. For each, give a title and a detailed {req.style} image prompt. Return ONLY a JSON array: [{{\"title\": \"...\", \"prompt\": \"...\", \"type\": \"image\"}}]\n\nStory: {req.story}",
            }, headers={"Authorization": f"Key {FAL_API_KEY}"})
            data = resp.json()
            text = data.get("output", "") or str(data)
            m = re.search(r'\[.*\]', text, re.DOTALL)
            if m: return {"scenes": json.loads(m.group())}
    except: pass
    return {"scenes": [{"title": f"Scene {i+1}", "prompt": f"{req.style}, {req.story}, scene {i+1}", "type": "image"} for i in range(req.num_scenes)]}

@app.get("/api/health")
def health():
    return {"status": "ok"}
