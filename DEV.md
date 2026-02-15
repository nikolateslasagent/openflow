# 🔧 OpenFlow — Open-Source Visual AI Workflow Builder

> Open-source alternative to Flora.AI + Weavy.ai
> Reference architecture: [nodetool-ai/nodetool](https://github.com/nodetool-ai/nodetool)

**Status:** Pre-alpha — Architecture & Planning
**License:** AGPL-3.0 (same as nodetool)
**Created:** 2026-02-15

---

## 🎯 Vision

A free, open-source, node-based visual AI workflow platform where anyone can:
- Connect any AI model (local or API) via drag-and-drop nodes
- Build image, video, audio, and text generation pipelines
- Run models locally (Ollama, MLX, GGUF) or via cloud APIs
- Share and remix workflows

**The business model:** The hosted web version is free. We capture all generation data (prompts, parameters, outputs) to build training datasets. **Video data is the highest priority** — every video generation, every frame, every parameter.

---

## 🏗️ Architecture

### Reference Products

| Product | What They Do | What We Take |
|---------|-------------|--------------|
| **Flora.AI** | Creative environment — inpaint, outpaint, crop, image gen with polished UI | UX polish, creative tool focus, canvas-based editing |
| **Weavy.ai** | Node-based AI workflows — multiple models (GPT img, Wan, SD, Runway, Kling, Flux, Veo), ControlNet, LoRA, relighting | Node UI design, multi-model support, professional editing tools |
| **NodeTool** | Open-source visual builder — 500K+ HuggingFace models, local-first, streaming, agents | Architecture, codebase reference, node system, deployment model |

### What We Build (Differentiators)

1. **Truly open-source** — not just open-core. Full platform, no paywalled features
2. **Any model** — bring your own API key OR run local. Ollama, MLX, HuggingFace, RunPod, Replicate, OpenAI, Anthropic, fal.ai, etc.
3. **Data flywheel** — every generation on the hosted version feeds our training dataset (with user consent)
4. **Video-first** — optimized for video generation workflows (Wan, Kling, Runway, Veo, MiniMax, Hunyuan)
5. **Community workflows** — share, fork, remix pipelines like GitHub repos

---

## 🧱 Tech Stack

### Frontend
- **Framework:** React 18 + TypeScript
- **Canvas:** React Flow (node-based editor) — same proven approach as nodetool/Weavy
- **State:** Zustand
- **Styling:** Tailwind CSS
- **Real-time:** WebSocket for streaming generation progress

### Backend
- **Runtime:** Python 3.11+ (FastAPI)
- **Task Queue:** Celery + Redis (async generation jobs)
- **Database:** PostgreSQL (users, workflows, metadata)
- **Object Storage:** S3-compatible (MinIO for self-hosted, AWS S3 for cloud)
- **WebSocket:** FastAPI WebSocket for real-time streaming

### AI Model Integration
- **Local:** Ollama, MLX (Apple Silicon), GGUF/GGML, HuggingFace Transformers
- **Cloud APIs:** OpenAI, Anthropic, Replicate, fal.ai, RunPod, Together, OpenRouter
- **Video:** Wan 2.6, Kling, Runway Gen-4, Veo 3, MiniMax Hailuo, Hunyuan, Sora
- **Image:** FLUX, Stable Diffusion, Imagen 3, Recraft, Ideogram, GPT-img
- **Audio:** ElevenLabs, OpenAI TTS, Bark, MusicGen

### Data Pipeline (Training Data Capture)
- **Every generation logged:** prompt, negative prompt, model, parameters, seed, output URL, latency, resolution
- **Video metadata:** frame count, FPS, duration, motion parameters, camera angles
- **Storage:** Parquet files → S3 for bulk export
- **Format:** JSONL + media files, organized by model/date
- **Privacy:** User consent on signup, anonymized IDs, opt-out available

---

## 📁 Project Structure

```
openflow/
├── README.md                  # Project overview, setup, contributing
├── LICENSE                    # AGPL-3.0
├── CONTRIBUTING.md            # How to contribute (labels, PRs, issues)
├── CHANGELOG.md               # Release notes
├── docker-compose.yml         # One-command local dev setup
├── Makefile                   # Common commands
│
├── web/                       # React frontend
│   ├── src/
│   │   ├── components/        # UI components
│   │   │   ├── canvas/        # Node editor (React Flow)
│   │   │   ├── nodes/         # Individual node types
│   │   │   ├── panels/        # Side panels (properties, output preview)
│   │   │   ├── toolbar/       # Top toolbar
│   │   │   └── common/        # Shared components
│   │   ├── stores/            # Zustand state management
│   │   ├── hooks/             # Custom React hooks
│   │   ├── types/             # TypeScript types
│   │   ├── api/               # API client
│   │   └── utils/             # Helpers
│   ├── public/
│   ├── package.json
│   └── tsconfig.json
│
├── server/                    # Python backend
│   ├── app/
│   │   ├── main.py            # FastAPI entry
│   │   ├── api/               # REST + WebSocket routes
│   │   │   ├── workflows.py   # CRUD workflows
│   │   │   ├── nodes.py       # Node registry & execution
│   │   │   ├── generations.py # Generation jobs
│   │   │   └── auth.py        # Authentication
│   │   ├── models/            # SQLAlchemy models
│   │   ├── nodes/             # Node implementations
│   │   │   ├── base.py        # BaseNode class
│   │   │   ├── image/         # Image gen nodes
│   │   │   ├── video/         # Video gen nodes
│   │   │   ├── text/          # LLM nodes
│   │   │   ├── audio/         # Audio/TTS nodes
│   │   │   ├── transform/     # Resize, crop, filter nodes
│   │   │   └── io/            # Input/output nodes
│   │   ├── engine/            # Workflow execution engine
│   │   │   ├── executor.py    # DAG execution
│   │   │   ├── scheduler.py   # Job scheduling
│   │   │   └── streaming.py   # Real-time progress
│   │   ├── data/              # Training data capture
│   │   │   ├── collector.py   # Generation logger
│   │   │   ├── exporter.py    # Parquet/JSONL export
│   │   │   └── storage.py     # S3 upload
│   │   └── providers/         # Model provider adapters
│   │       ├── openai.py
│   │       ├── replicate.py
│   │       ├── fal.py
│   │       ├── runpod.py
│   │       ├── ollama.py
│   │       └── huggingface.py
│   ├── requirements.txt
│   └── Dockerfile
│
├── data/                      # Data pipeline
│   ├── schemas/               # Data schemas (Parquet, JSONL)
│   └── scripts/               # Export/transform scripts
│
└── docs/                      # Documentation
    ├── architecture.md
    ├── nodes.md               # Node development guide
    ├── providers.md           # Adding model providers
    └── data-pipeline.md       # Training data format
```

---

## 🏷️ Label System (GitHub Issues & PRs)

### Type Labels
| Label | Color | Description |
|-------|-------|-------------|
| `type:feature` | `#0E8A16` | New feature or enhancement |
| `type:bug` | `#D73A4A` | Bug fix |
| `type:docs` | `#0075CA` | Documentation |
| `type:infra` | `#CFD3D7` | CI/CD, Docker, deployment |
| `type:refactor` | `#E4E669` | Code cleanup, no behavior change |

### Area Labels
| Label | Color | Description |
|-------|-------|-------------|
| `area:frontend` | `#7057FF` | React/UI work |
| `area:backend` | `#008672` | Python/API work |
| `area:nodes` | `#B60205` | Node implementations |
| `area:engine` | `#FBCA04` | Workflow execution engine |
| `area:data` | `#D876E3` | Training data pipeline |
| `area:providers` | `#0E8A16` | Model provider integrations |

### Priority Labels
| Label | Color | Description |
|-------|-------|-------------|
| `P0:critical` | `#D73A4A` | Drop everything |
| `P1:high` | `#FF9500` | This sprint |
| `P2:medium` | `#FBCA04` | Next sprint |
| `P3:low` | `#CFD3D7` | Backlog |

### Status Labels
| Label | Color | Description |
|-------|-------|-------------|
| `status:ready` | `#0E8A16` | Ready for development |
| `status:in-progress` | `#FBCA04` | Being worked on |
| `status:review` | `#7057FF` | Needs review |
| `status:blocked` | `#D73A4A` | Blocked by dependency |

### Contributor Labels
| Label | Color | Description |
|-------|-------|-------------|
| `good-first-issue` | `#7057FF` | Good for newcomers |
| `help-wanted` | `#008672` | Looking for contributors |
| `hacktoberfest` | `#FF7518` | Hacktoberfest eligible |

---

## 🗺️ Roadmap

### Phase 1 — Foundation (Weeks 1-2)
- [ ] Project scaffolding (React + FastAPI + Docker)
- [ ] React Flow canvas with basic node types (TextInput, ImageOutput, VideoOutput)
- [ ] Node registry system (add nodes via Python decorators)
- [ ] Workflow save/load (JSON serialization)
- [ ] Basic execution engine (run a linear workflow)
- [ ] First provider: OpenAI (text + image)
- [ ] Data collector: log every generation to JSONL

### Phase 2 — Multi-Model (Weeks 3-4)
- [ ] Add providers: Replicate, fal.ai, RunPod, Ollama
- [ ] Video generation nodes (Wan, Kling, MiniMax)
- [ ] Image editing nodes (inpaint, outpaint, crop, upscale) — Flora-style
- [ ] ControlNet / LoRA support nodes
- [ ] Real-time streaming (WebSocket progress updates)
- [ ] Gallery view (browse past generations)
- [ ] Data pipeline: Parquet export, S3 upload

### Phase 3 — Polish & Community (Weeks 5-6)
- [ ] Weavy-style UI polish (dark theme, professional look)
- [ ] Workflow sharing (public URLs, embed)
- [ ] Community workflow browser (fork & remix)
- [ ] User auth (GitHub OAuth, API key management)
- [ ] Self-hosted deployment guide (Docker one-liner)
- [ ] Mobile-responsive canvas

### Phase 4 — Scale (Weeks 7-8)
- [ ] Batch generation (run workflow across parameter sweeps)
- [ ] Scheduled workflows (cron-like)
- [ ] Team workspaces
- [ ] API access (programmatic workflow execution)
- [ ] Training data dashboard (volume, model distribution, quality metrics)
- [ ] Plugin system (community node packs)

---

## 📊 Data Capture Schema

### Generation Record (JSONL)
```json
{
  "id": "gen_abc123",
  "user_id": "anon_xyz",
  "workflow_id": "wf_def456",
  "node_id": "node_789",
  "timestamp": "2026-02-15T10:30:00Z",
  "provider": "replicate",
  "model": "wan-2.6",
  "type": "video",
  "input": {
    "prompt": "A cat walking through a garden...",
    "negative_prompt": "blurry, low quality",
    "width": 1280,
    "height": 720,
    "duration_sec": 4,
    "fps": 24,
    "seed": 42,
    "guidance_scale": 7.5,
    "num_inference_steps": 50
  },
  "output": {
    "url": "s3://openflow-data/gen/2026/02/15/gen_abc123.mp4",
    "frames": 96,
    "file_size_bytes": 2400000,
    "duration_ms": 4000
  },
  "metrics": {
    "latency_ms": 45000,
    "cost_usd": 0.12
  }
}
```

### Video-Specific Fields (Priority Data)
```json
{
  "video_meta": {
    "motion_score": 0.72,
    "camera_movement": "pan_left",
    "scene_transitions": 0,
    "face_count": 1,
    "text_overlay": false,
    "aspect_ratio": "16:9",
    "codec": "h264",
    "bitrate_kbps": 4800
  }
}
```

---

## 🚀 Getting Started (Dev Setup)

```bash
# Clone
git clone https://github.com/[YOUR_ORG]/openflow.git
cd openflow

# One-command setup
docker-compose up -d

# Or manual:
# Backend
cd server
python -m venv venv && source venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000

# Frontend
cd web
npm install
npm run dev  # → localhost:3000
```

---

## 🤝 Contributing

1. Check [Issues](https://github.com/[YOUR_ORG]/openflow/issues) for `good-first-issue` or `help-wanted`
2. Fork the repo
3. Create a branch: `feat/your-feature` or `fix/your-bug`
4. Write clean, typed code with docstrings
5. Add tests for new nodes
6. Open a PR with the appropriate labels

### Code Standards
- **Python:** Black formatter, type hints everywhere, docstrings on all public methods
- **TypeScript:** ESLint + Prettier, strict mode, no `any` types
- **Commits:** Conventional commits (`feat:`, `fix:`, `docs:`, `refactor:`)
- **Nodes:** Every node must have a description, typed inputs/outputs, and an example

---

## 📝 Dev Log

### 2026-02-15 — Project Created
- Researched Flora.AI, Weavy.ai, and nodetool
- Architecture designed based on nodetool reference
- Project structure defined
- Label system created for GitHub
- Data capture schema designed (video-first priority)
- This dev document created

---

*This is a living document. Update it as the project evolves.*
