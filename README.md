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
  <a href="#"><img src="https://img.shields.io/badge/status-pre--alpha-orange.svg" alt="Status" /></a>
</p>

---

## What is OpenFlow?

OpenFlow is a **free, open-source, node-based visual platform** for building AI workflows. Think Weavy.ai or Flora.AI — but fully open, self-hostable, and model-agnostic.

- 🔌 **Any model** — OpenAI, Anthropic, Replicate, fal.ai, RunPod, Ollama, HuggingFace, and more
- 🎬 **Video-first** — Wan, Kling, Runway, Veo, MiniMax, Hunyuan, Sora
- 🖼️ **Creative tools** — Inpaint, outpaint, upscale, ControlNet, LoRA
- 🏠 **Run anywhere** — Your laptop, a server, or the cloud
- 🔓 **Truly open** — AGPL-3.0, no paywalled features

<p align="center">
  <em>Screenshot coming soon</em>
</p>

---

## Quick Start

### Docker (recommended)

```bash
git clone https://github.com/openflow-ai/openflow.git
cd openflow
docker-compose up -d
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Manual Setup

**Backend:**
```bash
cd server
python -m venv venv && source venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

**Frontend:**
```bash
cd web
npm install
npm run dev  # → localhost:3000
```

---

## Supported Models

| Category | Models |
|----------|--------|
| **Image** | FLUX, Stable Diffusion, Imagen 3, Recraft, Ideogram, GPT-img, DALL-E |
| **Video** | Wan 2.6, Kling, Runway Gen-4, Veo 3, MiniMax Hailuo, Hunyuan, Sora |
| **Text** | GPT-4, Claude, Llama, Mistral, Gemini (via Ollama, OpenRouter, etc.) |
| **Audio** | ElevenLabs, OpenAI TTS, Bark, MusicGen |
| **Local** | Ollama, MLX (Apple Silicon), GGUF/GGML, HuggingFace Transformers |

Bring your own API key, or run models locally with zero cost.

---

## Architecture

```
┌─────────────────────────────────────┐
│  React Flow Canvas (Web UI)         │
│  ┌──────┐ ┌──────┐ ┌──────┐       │
│  │ Text │→│ Image│→│Output│       │
│  │ Input│ │  Gen │ │      │       │
│  └──────┘ └──────┘ └──────┘       │
└──────────────┬──────────────────────┘
               │ WebSocket + REST
┌──────────────▼──────────────────────┐
│  FastAPI Backend                     │
│  ├─ Node Registry                    │
│  ├─ DAG Executor (topological sort)  │
│  ├─ Provider Adapters (OpenAI, etc.) │
│  └─ Data Collector (JSONL → S3)      │
└──────────────┬──────────────────────┘
               │
┌──────────────▼──────────────────────┐
│  PostgreSQL │ Redis │ S3 Storage     │
└─────────────────────────────────────┘
```

See [docs/architecture.md](docs/architecture.md) for the full breakdown.

---

## Contributing

We welcome contributions! Check out our [Contributing Guide](CONTRIBUTING.md).

- 🏷️ Look for [`good-first-issue`](https://github.com/openflow-ai/openflow/labels/good-first-issue) labels
- 📖 Read [docs/nodes.md](docs/nodes.md) to create custom nodes
- 🔧 See [docs/providers.md](docs/providers.md) to add model providers

---

## License

[AGPL-3.0](LICENSE) — Free to use, modify, and distribute. Contributions back to the community required for hosted versions.
