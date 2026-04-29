from __future__ import annotations

from contextlib import asynccontextmanager

from fastapi import FastAPI
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


@app.get("/")
def root():
    return {
        "name": "Career Globe Backend",
        "docs": "/docs",
        "health": "/career-globe/health",
    }
