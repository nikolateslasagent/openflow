.PHONY: dev backend frontend lint test clean docker-up docker-down

# Start everything with Docker
docker-up:
	docker-compose up -d

docker-down:
	docker-compose down

# Manual dev (no Docker)
dev: backend frontend

backend:
	cd server && uvicorn app.main:app --reload --port 8000

frontend:
	cd web && npm run dev

# Code quality
lint:
	cd server && python -m black --check . && python -m mypy app/
	cd web && npm run lint && npm run type-check

format:
	cd server && python -m black .
	cd web && npx prettier --write src/

test:
	cd server && python -m pytest
	cd web && npm test

clean:
	find . -name __pycache__ -exec rm -rf {} +
	rm -rf server/.mypy_cache web/node_modules/.vite
