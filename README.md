<p align="center">
  <img src="docs/assets/logo-placeholder.png" alt="OpenFlow" width="120" />
</p>

<h1 align="center">OpenFlow</h1>
<p align="center">
  <strong>Open-source visual AI workflow builder</strong><br/>
  Connect any AI model. Build creative pipelines. Generate anything.
</p>

<p align="center">
  <a href="#"><img src="https://img.shields.io/badge/license-AGPL--3.0-blue.svg" alt="License" /></a>
  <a href="#"><img src="https://img.shields.io/badge/PRs-welcome-brightgreen.svg" alt="PRs Welcome" /></a>
  <a href="#"><img src="https://img.shields.io/badge/sprint-10-purple.svg" alt="Sprint 10" /></a>
</p>

---

## What is OpenFlow?

OpenFlow is an open-source visual AI workflow builder that lets you connect AI models into creative pipelines — from text-to-image to video generation, upscaling, batch processing, and more. Built with React Flow, fal.ai, and an optional FastAPI backend.

**No subscriptions. No markup. Pay only for API usage.**

## ✨ Features

### Core Canvas (Sprint 1)
- **Visual node-based editor** — Drag-and-drop AI nodes onto an infinite canvas
- **18+ image models** — Flux Pro, DALL-E 3, Stable Diffusion 3.5, Imagen 4, Ideogram v3, Recraft v3, and more
- **14+ video models** — Kling 3.0, Wan 2.1, MiniMax Hailuo, Hunyuan, Luma Ray 2, Veo 3.1, and more
- **Real-time generation** via fal.ai API
- **Node connections** — Wire outputs to inputs for multi-step pipelines

### Dashboard & Asset Manager (Sprint 2)
- **Dashboard** with quick stats, recent activity, and template launcher
- **Asset Manager** — Browse, filter, preview, and download all generated media
- **AI Chat Assistant** — Get help with workflows, models, and prompts
- **Mini-app templates** — Product Photo, Social Media Video, Storyboard, Music Video

### Advanced Nodes (Sprint 3–4)
- **Image to Image** — Transform existing images with prompts
- **Upscale** — 2x/4x resolution enhancement with Real-ESRGAN
- **Inpainting** — Edit specific regions of images
- **Background Remover** — One-click background removal
- **ControlNet** — Guided generation with canny, depth, or pose control
- **Prompt Enhancer** — AI-powered prompt expansion
- **LLM Chat** — GPT-4o, Claude, Gemini, Llama integration

### Workflow Engine (Sprint 5–6)
- **Topological execution** — Run All respects node dependencies
- **Data flow** — Outputs automatically pass to connected inputs
- **Undo/Redo** — Full history with Ctrl+Z / Ctrl+Shift+Z
- **Workflow sharing** — Share workflows via URL hash encoding
- **Export** — JSON workflow, PNG screenshot, PDF storyboard
- **Cloud projects** — Save/load with FastAPI backend + auth

### Creative Tools (Sprint 7)
- **Storyboard View** — Visual scene-by-scene story builder
- **Timeline Editor** — Arrange video clips on a timeline with transitions
- **Audio nodes** — Text-to-Speech, Music Generator, Sound Effects, Voice-Over
- **Video Render** — Concatenate clips with transitions
- **Caption Generator** — Auto-generate SRT subtitles

### Marketplace & Customization (Sprint 8)
- **Marketplace** — Browse and use community workflow templates
- **Custom Node Builder** — Connect any REST API as a workflow node
- **Webhook nodes** — HTTP triggers for automation
- **Node Presets** — Save and reuse favorite configurations
- **Prompt Library** — Curated prompt collection with categories

### Batch & Polish (Sprint 9)
- **Batch Processing** — Run multiple prompts in sequence
- **Gallery View** — Masonry grid of all generated assets
- **Image paste** — Ctrl+V to paste images as nodes
- **Image drag-and-drop** — Drop images directly onto canvas
- **Snap to grid** — Precise node alignment
- **Auto-layout** — One-click node arrangement
- **Tutorial overlay** — Interactive onboarding
- **Training data export** — JSONL export for fine-tuning

### Agent API & Notifications (Sprint 10) 🆕
- **Agent API** — Trigger generations via URL parameters
- **Generation Queue** — Drag-to-reorder queue with priority flags, pause/resume
- **Notification Center** — Bell icon with unread badge, click-to-jump
- **Keyboard Shortcuts Help** — Press `?` for full shortcut reference
- **API Documentation** — In-app API docs panel

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────┐
│                   Frontend                       │
│  React + TypeScript + React Flow + Vite          │
│                                                  │
│  ┌──────────┐ ┌──────────┐ ┌──────────────────┐ │
│  │  Canvas   │ │Dashboard │ │ Storyboard/      │ │
│  │  Editor   │ │          │ │ Timeline/Gallery │ │
│  └────┬─────┘ └──────────┘ └──────────────────┘ │
│       │                                          │
│  ┌────▼──────────────────────────────────────┐   │
│  │         Node Execution Engine             │   │
│  │  Topological sort → Data flow → fal.ai    │   │
│  └────┬──────────────────────────────────┬───┘   │
│       │                                  │       │
└───────┼──────────────────────────────────┼───────┘
        │                                  │
   ┌────▼────┐                    ┌────────▼───────┐
   │ fal.ai  │                    │  FastAPI        │
   │   API   │                    │  Backend        │
   │         │                    │  (optional)     │
   │ 18 img  │                    │  Auth + Projects│
   │ 14 vid  │                    │  PostgreSQL     │
   └─────────┘                    └────────────────┘
```

## 🔌 Agent API

AI agents can trigger OpenFlow actions by opening a URL with query parameters.

### URL Parameters

| Parameter | Values | Description |
|-----------|--------|-------------|
| `action` | `generate`, `workflow`, `batch` | Action type |
| `model` | `flux-pro`, `flux-fast`, `dall-e-3`, ... | AI model to use |
| `prompt` | URL-encoded text | Generation prompt |
| `template` | `product-photo`, `storyboard`, ... | Workflow template name |
| `prompts` | `p1\|p2\|p3` | Pipe-separated batch prompts |

### Examples

```bash
# Generate a single image
https://your-app.vercel.app/?action=generate&model=flux-pro&prompt=a+sunset+over+mountains

# Load a template
https://your-app.vercel.app/?action=workflow&template=product-photo

# Batch generation
https://your-app.vercel.app/?action=batch&prompts=a+cat|a+dog|a+bird&model=flux-fast
```

### Python Integration

```python
import webbrowser

base = "https://your-app.vercel.app"
url = f"{base}/?action=generate&model=flux-pro&prompt=cyberpunk+city+at+night"
webbrowser.open(url)
```

## 📸 Screenshots

| Dashboard | Canvas Editor |
|-----------|--------------|
| ![Dashboard](docs/assets/screenshot-dashboard.png) | ![Canvas](docs/assets/screenshot-canvas.png) |

| Storyboard | Timeline |
|------------|----------|
| ![Storyboard](docs/assets/screenshot-storyboard.png) | ![Timeline](docs/assets/screenshot-timeline.png) |

## 🚀 Getting Started

### Prerequisites
- Node.js 18+
- A [fal.ai](https://fal.ai) API key (free tier available)

### Install & Run

```bash
git clone https://github.com/nikolateslasagent/openflow.git
cd openflow/web
npm install
npm run dev
```

Open `http://localhost:5173` and enter your fal.ai API key in Settings.

### Optional: Backend

```bash
cd backend
pip install -r requirements.txt
uvicorn main:app --reload
```

### Deploy to Vercel

```bash
cd web
npx vercel --prod
```

## ⌨️ Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `Space` | Run selected node |
| `Delete` | Delete selected node(s) |
| `Ctrl+S` | Save project |
| `Ctrl+Z` | Undo |
| `Ctrl+Shift+Z` | Redo |
| `Ctrl+D` | Duplicate selected |
| `Ctrl+V` | Paste image from clipboard |
| `Double-click` | Quick add node |
| `?` | Keyboard shortcuts help |

## 🤝 Contributing

Contributions are welcome! Here's how:

1. Fork the repository
2. Create a feature branch: `git checkout -b feat/your-feature`
3. Make your changes
4. Run the dev server to test: `npm run dev`
5. Commit: `git commit -m "feat: your feature description"`
6. Push: `git push origin feat/your-feature`
7. Open a Pull Request

### Development Guidelines
- TypeScript strict mode
- Functional React components with hooks
- Inline styles (no CSS framework dependency)
- All state in React — no external state management

## 📄 License

This project is licensed under the **GNU Affero General Public License v3.0 (AGPL-3.0)**.

See [LICENSE](LICENSE) for details.

---

<p align="center">
  Built with ❤️ by <a href="https://github.com/nikolateslasagent">nikolateslasagent</a>
</p>
