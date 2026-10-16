from collections.abc import AsyncIterator
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import get_settings
from app.db import create_pool
from app.routers import (
    auth,
    candidates,
    health,
    import_link,
    items,
    known_words,
    library_documents,
    me,
    push,
    reading,
    review,
    sources,
    speaking,
    today,
)


@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncIterator[None]:
    pool = create_pool(get_settings().database_url)
    # wait=False: a slow database must not block startup, or /health would fail too.
    pool.open(wait=False)
    app.state.pool = pool
    yield
    pool.close()


def create_app() -> FastAPI:
    settings = get_settings()
    app = FastAPI(title="OtterLang API", lifespan=lifespan)
    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.cors_origin_list,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )
    app.include_router(health.router)
    app.include_router(auth.router)
    app.include_router(me.router)
    app.include_router(import_link.router)
    app.include_router(sources.router)
    app.include_router(candidates.router)
    app.include_router(known_words.router)
    app.include_router(items.router)
    app.include_router(library_documents.router)
    app.include_router(push.router)
    app.include_router(reading.router)
    app.include_router(review.router)
    app.include_router(speaking.router)
    app.include_router(today.router)
    return app


app = create_app()
