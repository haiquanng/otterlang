from datetime import datetime
from typing import Annotated
from uuid import UUID

from fastapi import APIRouter, HTTPException, Query, status
from pydantic import BaseModel, Field, field_validator

from app.db import Conn
from app.deps import CurrentUser
from app.repositories import sources
from app.repositories.sources import SourceKind

router = APIRouter(prefix="/sources", tags=["sources"])

MAX_BODY_CHARS = 50_000

_NOT_FOUND = HTTPException(status.HTTP_404_NOT_FOUND, "Document not found")


class SourceIn(BaseModel):
    title: str = Field(min_length=1, max_length=200)
    kind: SourceKind = "other"
    url: str | None = Field(default=None, max_length=2000)
    body: str = Field(min_length=1, max_length=MAX_BODY_CHARS)

    @field_validator("title", "body")
    @classmethod
    def not_blank(cls, value: str) -> str:
        if not value.strip():
            raise ValueError("must not be blank")
        return value.strip()

    @field_validator("url")
    @classmethod
    def http_only(cls, value: str | None) -> str | None:
        if value is None or not value.strip():
            return None
        if not value.startswith(("http://", "https://")):
            raise ValueError("must start with http:// or https://")
        return value.strip()


class SourceSummary(BaseModel):
    id: UUID
    title: str
    kind: SourceKind
    url: str | None
    char_count: int
    created_at: datetime


class SourceOut(BaseModel):
    id: UUID
    title: str
    kind: SourceKind
    url: str | None
    body: str
    created_at: datetime


@router.post("", status_code=status.HTTP_201_CREATED)
def create_source(body: SourceIn, user: CurrentUser, conn: Conn) -> SourceOut:
    row = sources.create(conn, user.id, body.title, body.kind, body.url, body.body)
    return SourceOut.model_validate(row)


@router.get("")
def list_sources(
    user: CurrentUser, conn: Conn, limit: Annotated[int, Query(ge=1, le=200)] = 50
) -> list[SourceSummary]:
    return [SourceSummary.model_validate(r) for r in sources.list_for_user(conn, user.id, limit)]


@router.get("/{source_id}")
def get_source(source_id: UUID, user: CurrentUser, conn: Conn) -> SourceOut:
    row = sources.get(conn, user.id, source_id)
    if row is None:
        raise _NOT_FOUND
    return SourceOut.model_validate(row)


@router.put("/{source_id}")
def update_source(source_id: UUID, body: SourceIn, user: CurrentUser, conn: Conn) -> SourceOut:
    row = sources.update(conn, user.id, source_id, body.title, body.kind, body.url, body.body)
    if row is None:
        raise _NOT_FOUND
    return SourceOut.model_validate(row)


@router.delete("/{source_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_source(source_id: UUID, user: CurrentUser, conn: Conn) -> None:
    if not sources.delete(conn, user.id, source_id):
        raise _NOT_FOUND
