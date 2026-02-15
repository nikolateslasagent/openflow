# Contributing to OpenFlow

Thanks for your interest in contributing! OpenFlow is built by the community, for the community.

## Getting Started

1. **Fork** the repo and clone it locally
2. **Set up dev environment** — see [README.md](README.md) for setup instructions
3. **Find an issue** — look for `good-first-issue` or `help-wanted` labels
4. **Open an issue first** for major changes (so we can discuss the approach)

## Development Workflow

```bash
# Create a feature branch
git checkout -b feat/your-feature

# Make your changes, then:
make lint    # Check code quality
make test    # Run tests

# Commit using conventional commits
git commit -m "feat: add upscale node for image enhancement"
```

## Commit Convention

We use [Conventional Commits](https://www.conventionalcommits.org/):

| Prefix | Use |
|--------|-----|
| `feat:` | New feature |
| `fix:` | Bug fix |
| `docs:` | Documentation only |
| `refactor:` | Code change that doesn't fix a bug or add a feature |
| `test:` | Adding or updating tests |
| `chore:` | Tooling, CI, dependencies |

## Code Standards

### Python (Backend)
- **Formatter:** Black (default settings)
- **Type hints:** Required on all function signatures
- **Docstrings:** Required on all public classes and functions
- **No `Any` types** unless absolutely necessary (and justified in a comment)

### TypeScript (Frontend)
- **ESLint + Prettier** for formatting
- **Strict mode** enabled — no `any` types
- **Components:** Functional components with hooks
- **Naming:** PascalCase for components, camelCase for functions/variables

### Nodes
Every new node must include:
- A `Meta` class with `id`, `name`, `description`, and `category`
- Typed `Inputs` and `Outputs` classes
- A working `execute` method
- A description that explains what it does in plain English

See [docs/nodes.md](docs/nodes.md) for the full guide.

## Pull Request Process

1. **One PR per feature/fix** — keep PRs focused
2. **Add the appropriate labels** (see Label System below)
3. **Write a clear description** — what changed and why
4. **Include screenshots** for UI changes
5. **All checks must pass** — lint, type-check, tests

## Label System

### Type
- `type:feature` — New feature
- `type:bug` — Bug fix
- `type:docs` — Documentation
- `type:infra` — CI/CD, Docker
- `type:refactor` — Code cleanup

### Area
- `area:frontend` — React/UI
- `area:backend` — Python/API
- `area:nodes` — Node implementations
- `area:engine` — Workflow execution
- `area:data` — Training data pipeline
- `area:providers` — Model integrations

### Priority
- `P0:critical` — Drop everything
- `P1:high` — This sprint
- `P2:medium` — Next sprint
- `P3:low` — Backlog

## Adding a New Model Provider

See [docs/providers.md](docs/providers.md) for the step-by-step guide.

## Questions?

Open a Discussion or reach out on Discord.
