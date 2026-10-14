from datetime import datetime
from typing import Annotated, Literal
from uuid import UUID

from fastapi import APIRouter, BackgroundTasks, Depends, HTTPException, Query, Response, status
from pydantic import BaseModel, Field

from app.db import Conn, PoolDep
from app.deps import CurrentUser
from app.repositories import cards, item_queries, items, sources
from app.services.dictionary import Fetch, get_dictionary_fetch
from app.services.items import NewItem, enrich_item, save_item

router = APIRouter(prefix="/items", tags=["items"])

Tag = Literal["technical", "ielts", "general"]
ItemType = Literal["word", "collocation", "pattern"]
ItemStatus = Literal["active", "archived"]

_NOT_FOUND = HTTPException(status.HTTP_404_NOT_FOUND, "Item not found")


class ItemIn(BaseModel):
    """A full save from a document, or a quick-add with only `term`."""

    term: str = Field(min_length=1, max_length=120)
    type: ItemType | None = None
    sentence: str | None = Field(default=None, max_length=500)
    surface: str | None = Field(default=None, max_length=120)
    source_id: UUID | None = None
    tags: list[Tag] = Field(default_factory=list, max_length=3)
    definition: str | None = Field(default=None, max_length=500)
    note: str | None = Field(default=None, max_length=1000)


class ItemUpdate(BaseModel):
    definition: str | None = Field(default=None, max_length=500)
    note: str | None = Field(default=None, max_length=1000)
    tags: list[Tag] | None = Field(default=None, max_length=3)
    status: ItemStatus | None = None


class ItemOut(BaseModel):
    id: UUID
    type: ItemType
    term: str
    lemma: str
    definition: str | None
    note: str | None
    status: ItemStatus
    tags: list[Tag]
    sentence: str | None = None
    created_at: datetime


class ContextOut(BaseModel):
    sentence: str
    surface: str | None
    source_id: UUID | None
    source_title: str | None
    written_by_learner: bool


class ItemDetail(ItemOut):
    phonetic: str | None
    contexts: list[ContextOut]


def _detail(conn: Conn, user_id: UUID, item_id: UUID) -> ItemDetail:
    row = item_queries.get_item(conn, user_id, item_id)
    if row is None:
        raise _NOT_FOUND
    contexts = [
        ContextOut.model_validate(c) for c in item_queries.contexts_for_item(conn, user_id, item_id)
    ]
    return ItemDetail.model_validate({**row, "contexts": contexts})


@router.post("", status_code=status.HTTP_201_CREATED)
def create_item(
    body: ItemIn,
    response: Response,
    background: BackgroundTasks,
    user: CurrentUser,
    conn: Conn,
    pool: PoolDep,
    fetch: Annotated[Fetch, Depends(get_dictionary_fetch)],
) -> ItemDetail:
    if body.source_id and sources.get(conn, user.id, body.source_id) is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Document not found")
    result = save_item(
        conn,
        user.id,
        NewItem(
            term=body.term,
            item_type=body.type,
            sentence=body.sentence,
            surface=body.surface,
            source_id=body.source_id,
            tags=tuple(body.tags),
            definition=body.definition,
            note=body.note,
        ),
    )
    if not result.created:
        response.status_code = status.HTTP_200_OK
    if result.needs_definition:
        # Commit now: the enrichment task uses its own connection and can run before this
        # request's dependency cleanup commits, so it would not see the new item otherwise.
        conn.commit()
        background.add_task(enrich_item, pool, fetch, user.id, result.item_id, result.lemma)
    return _detail(conn, user.id, result.item_id)


@router.get("")
def list_items(
    user: CurrentUser,
    conn: Conn,
    q: Annotated[str | None, Query(max_length=100)] = None,
    tag: Tag | None = None,
    source_id: UUID | None = None,
    item_status: Annotated[ItemStatus, Query(alias="status")] = "active",
    limit: Annotated[int, Query(ge=1, le=500)] = 200,
) -> list[ItemOut]:
    rows = item_queries.list_items(
        conn,
        user.id,
        query=q.strip() if q and q.strip() else None,
        tag=tag,
        source_id=source_id,
        status=item_status,
        limit=limit,
    )
    return [ItemOut.model_validate(r) for r in rows]


@router.get("/{item_id}")
def get_item(item_id: UUID, user: CurrentUser, conn: Conn) -> ItemDetail:
    return _detail(conn, user.id, item_id)


@router.patch("/{item_id}")
def update_item(item_id: UUID, body: ItemUpdate, user: CurrentUser, conn: Conn) -> ItemDetail:
    current = _detail(conn, user.id, item_id)
    fields = body.model_fields_set
    items.update(
        conn,
        user.id,
        item_id,
        definition=body.definition if "definition" in fields else current.definition,
        note=body.note if "note" in fields else current.note,
        status=body.status or current.status,
    )
    if body.tags is not None:
        items.replace_tags(conn, user.id, item_id, list(body.tags))
    if body.definition:
        cards.ensure(conn, user.id, item_id, ["define_to_word"])
    return _detail(conn, user.id, item_id)


@router.delete("/{item_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_item(item_id: UUID, user: CurrentUser, conn: Conn) -> None:
    if not items.delete(conn, user.id, item_id):
        raise _NOT_FOUND
