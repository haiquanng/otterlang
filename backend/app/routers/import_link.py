from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, Field

from app.db import Conn
from app.deps import CurrentUser
from app.rate_limit import RateLimiter
from app.repositories import sources
from app.repositories.sources import SourceKind
from app.routers.sources import MAX_BODY_CHARS, SourceOut
from app.services.web_fetch import (
    ArticleFetch,
    NoReadableTextError,
    NotPublicUrlError,
    PageUnavailableError,
    get_article_fetch,
)

router = APIRouter(prefix="/sources", tags=["sources"])

MAX_TITLE_CHARS = 200
# Each import makes the server fetch a page for the user; keep it from becoming a proxy.
import_limiter = RateLimiter(limit=20, window_seconds=3600)


class ImportIn(BaseModel):
    url: str = Field(min_length=8, max_length=2000)
    kind: SourceKind = "tech_blog"


@router.post("/import", status_code=status.HTTP_201_CREATED)
def import_from_link(
    body: ImportIn,
    user: CurrentUser,
    conn: Conn,
    fetch: Annotated[ArticleFetch, Depends(get_article_fetch)],
) -> SourceOut:
    url = body.url.strip()
    if not import_limiter.allow(str(user.id)):
        raise HTTPException(status.HTTP_429_TOO_MANY_REQUESTS, "Too many imports, try later")
    try:
        article = fetch(url, MAX_BODY_CHARS)
    except NotPublicUrlError:
        raise HTTPException(
            status.HTTP_422_UNPROCESSABLE_CONTENT, "That is not a public web page link"
        ) from None
    except PageUnavailableError:
        raise HTTPException(status.HTTP_502_BAD_GATEWAY, "Couldn't reach that page") from None
    except NoReadableTextError:
        raise HTTPException(
            status.HTTP_422_UNPROCESSABLE_CONTENT, "No readable text on that page"
        ) from None
    title = article.title[:MAX_TITLE_CHARS] or url[:MAX_TITLE_CHARS]
    row = sources.create(conn, user.id, title, body.kind, url, article.text)
    return SourceOut.model_validate(row)
