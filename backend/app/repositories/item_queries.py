"""Read queries for the library: list with filters, and one item with its contexts."""

from uuid import UUID

from psycopg import Connection
from psycopg.rows import DictRow


def _like_pattern(query: str) -> str:
    escaped = query.replace("\\", "\\\\").replace("%", "\\%").replace("_", "\\_")
    return f"%{escaped}%"


def list_items(
    conn: Connection[DictRow],
    user_id: UUID,
    *,
    query: str | None,
    tag: str | None,
    source_id: UUID | None,
    status: str,
    limit: int,
) -> list[DictRow]:
    # Optional filters are expressed in fixed SQL ("param is null or ...") instead of
    # string-built queries, so every value stays a bound parameter.
    return conn.execute(
        """
        select i.id, i.type, i.term, i.lemma, i.definition, i.note, i.status, i.created_at,
          coalesce(array_agg(t.tag order by t.tag) filter (where t.tag is not null), '{}') as tags,
          (select c.sentence from item_contexts c where c.item_id = i.id
             order by c.created_at limit 1) as sentence
        from items i
        left join item_tags t on t.item_id = i.id
        where i.user_id = %(user_id)s
          and i.status = %(status)s::item_status
          and (%(query)s::text is null
               or i.term ilike %(pattern)s or i.lemma ilike %(pattern)s
               or i.definition ilike %(pattern)s or i.note ilike %(pattern)s)
          and (%(tag)s::text is null or exists (
               select 1 from item_tags t2 where t2.item_id = i.id and t2.tag = %(tag)s))
          and (%(source_id)s::uuid is null or exists (
               select 1 from item_contexts c2
               where c2.item_id = i.id and c2.source_id = %(source_id)s))
        group by i.id
        order by i.created_at desc
        limit %(limit)s
        """,
        {
            "user_id": user_id,
            "status": status,
            "query": query,
            "pattern": _like_pattern(query or ""),
            "tag": tag,
            "source_id": source_id,
            "limit": limit,
        },
    ).fetchall()


def get_item(conn: Connection[DictRow], user_id: UUID, item_id: UUID) -> DictRow | None:
    return conn.execute(
        """
        select i.id, i.type, i.term, i.lemma, i.definition, i.note, i.status, i.created_at,
          coalesce((select array_agg(t.tag order by t.tag) from item_tags t
                    where t.item_id = i.id), '{}') as tags,
          d.phonetic
        from items i
        left join dictionary_entries d on d.id = i.dict_entry_id
        where i.user_id = %s and i.id = %s
        """,
        (user_id, item_id),
    ).fetchone()


def contexts_for_item(conn: Connection[DictRow], user_id: UUID, item_id: UUID) -> list[DictRow]:
    return conn.execute(
        "select c.sentence, c.surface, c.source_id, s.title as source_title "
        "from item_contexts c left join sources s on s.id = c.source_id "
        "where c.user_id = %s and c.item_id = %s order by c.created_at",
        (user_id, item_id),
    ).fetchall()
