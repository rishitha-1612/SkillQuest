from __future__ import annotations

from contextlib import asynccontextmanager
from pathlib import Path

from fastapi import FastAPI, HTTPException
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware

from backend.api.routes import router
from backend.services.auth_db import init_auth_db
from backend.services.auth_service import prune_expired_sessions
from backend.services.data_loader import load_role_blueprints, load_state_graphs
from backend.services.role_path_engine import validate_role_blueprint
from backend.services.unlock_engine import validate_graph


@asynccontextmanager
async def lifespan(app: FastAPI):
    init_auth_db()
    prune_expired_sessions()
    graphs = load_state_graphs()
    roles = load_role_blueprints()

    for graph in graphs.values():
        validate_graph(graph)

    for role in roles.values():
        validate_role_blueprint(role, graphs)

    yield


app = FastAPI(
    title="Career Globe Backend",
    version="0.1.0",
    description="FastAPI backend for the Career Globe gamified career navigation system.",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(router)

FRONTEND_DIST = Path(__file__).resolve().parents[1] / "frontend" / "dist"

if FRONTEND_DIST.exists():
    assets_dir = FRONTEND_DIST / "assets"
    if assets_dir.exists():
        app.mount("/assets", StaticFiles(directory=assets_dir), name="frontend-assets")


def serve_frontend_index():
    index_file = FRONTEND_DIST / "index.html"
    if index_file.exists():
        return FileResponse(index_file)
    return {
        "name": "Career Globe Backend",
        "docs": "/docs",
        "health": "/career-globe/health",
    }


@app.get("/")
def root():
    return serve_frontend_index()


@app.get("/{full_path:path}")
def spa_fallback(full_path: str):
    if full_path.startswith(("career-globe", "docs", "openapi.json", "redoc", "assets")):
        raise HTTPException(status_code=404, detail="Not Found")
    requested_file = FRONTEND_DIST / full_path
    if requested_file.exists() and requested_file.is_file():
        return FileResponse(requested_file)
    return serve_frontend_index()
