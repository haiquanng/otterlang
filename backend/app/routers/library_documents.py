from typing import Literal
from uuid import UUID

from fastapi import APIRouter, HTTPException, Response, status
from pydantic import BaseModel

from app.db import Conn
from app.deps import CurrentUser
from app.repositories import library_documents

router = APIRouter(prefix="/library-documents", tags=["library"])

Kind = Literal["tech_blog", "ielts", "other"]


class LibraryDocumentOut(BaseModel):
    id: UUID
    title: str
    kind: Kind
    source_name: str
    license: str | None
    word_count: int
    source_id: UUID | None  # the learner's copy, when already added


class AddedOut(BaseModel):
    source_id: UUID


@router.get("")
def list_library(
    user: CurrentUser, conn: Conn, kind: Kind | None = None
) -> list[LibraryDocumentOut]:
    rows = library_documents.list_for_user(conn, user.id, kind)
    return [LibraryDocumentOut.model_validate(r) for r in rows]


@router.post("/{document_id}/add", status_code=status.HTTP_201_CREATED)
def add_to_my_documents(
    document_id: UUID, response: Response, user: CurrentUser, conn: Conn
) -> AddedOut:
    result = library_documents.copy_to_user(conn, user.id, document_id)
    if result is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Library text not found")
    source_id, created = result
    if not created:
        response.status_code = status.HTTP_200_OK
    return AddedOut(source_id=source_id)
