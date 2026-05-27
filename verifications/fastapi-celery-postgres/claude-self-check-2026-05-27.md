# Self-check · FastAPI + Celery + Postgres · 2026-05-27 · Claude (LLM)

Internal coherence check, not a real Claude Code product run. See [`verifications/README.md`](../README.md) for the limits.

## Prompt

From `stacks/fastapi-celery-postgres/example-prompts.md`, prompt 1:

> Add `GET /api/v1/users` returning users with keyset pagination (20 per page) by id desc. Include a pytest test using httpx ASGITransport.

## Code produced

**`src/app/api/v1/users.py`**

```python
from typing import Annotated
from uuid import UUID

from fastapi import APIRouter, Depends, Query
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession

from src.app.api.deps import get_db
from src.app.schemas.user import UserRead
from src.app.services.users import list_users

router = APIRouter(prefix="/users", tags=["users"])


class UserPage(BaseModel):
    users: list[UserRead]
    next_cursor: UUID | None


@router.get("", response_model=UserPage)
async def list_users_endpoint(
    cursor: Annotated[UUID | None, Query()] = None,
    take: Annotated[int, Query(ge=1, le=50)] = 20,
    session: AsyncSession = Depends(get_db),
) -> UserPage:
    users, next_cursor = await list_users(session, cursor=cursor, take=take)
    return UserPage(users=users, next_cursor=next_cursor)
```

**`src/app/services/users.py`**

```python
from uuid import UUID

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from src.app.models.user import User
from src.app.schemas.user import UserRead


async def list_users(
    session: AsyncSession,
    *,
    cursor: UUID | None,
    take: int,
) -> tuple[list[UserRead], UUID | None]:
    stmt = select(User).order_by(User.id.desc()).limit(take + 1)
    if cursor is not None:
        stmt = stmt.where(User.id < cursor)

    result = await session.execute(stmt)
    rows = result.scalars().all()

    has_more = len(rows) > take
    page = list(rows[:take]) if has_more else list(rows)
    next_cursor = page[-1].id if has_more and page else None
    return [UserRead.model_validate(u) for u in page], next_cursor
```

**`src/app/schemas/user.py`** (the `UserRead` half)

```python
from uuid import UUID
from datetime import datetime
from pydantic import BaseModel, ConfigDict


class UserRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    email: str
    created_at: datetime
```

**`tests/api/test_users.py`**

```python
import uuid

import pytest
from httpx import ASGITransport, AsyncClient

from src.app.main import app
from src.app.models.user import User


@pytest.mark.asyncio
async def test_users_pagination_round_trip(db_session, factories):
    created = [
        factories.UserFactory(id=uuid.uuid4(), email=f"u{i}@example.com")
        for i in range(45)
    ]
    db_session.add_all(created)
    await db_session.commit()

    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        page1 = await ac.get("/api/v1/users")
        assert page1.status_code == 200
        body1 = page1.json()
        assert len(body1["users"]) == 20
        assert body1["next_cursor"] is not None

        page2 = await ac.get("/api/v1/users", params={"cursor": body1["next_cursor"]})
        body2 = page2.json()
        assert len(body2["users"]) == 20
        ids1 = {u["id"] for u in body1["users"]}
        for u in body2["users"]:
            assert u["id"] not in ids1

        page3 = await ac.get("/api/v1/users", params={"cursor": body2["next_cursor"]})
        body3 = page3.json()
        assert len(body3["users"]) == 5
        assert body3["next_cursor"] is None
```

## AGENTS.md compliance check

| Convention | Pass? | Note |
|---|---|---|
| Thin endpoint, dispatch to service | yes | Endpoint is 6 lines; logic in `services/users.py`. |
| Service is async, takes session + DTOs, returns DTOs | yes | `list_users(session, ...) -> tuple[list[UserRead], UUID \| None]`. |
| Service raises domain exceptions, not `HTTPException` | n/a | Happy path only; no error case to raise on. |
| Keyset pagination, no `LIMIT/OFFSET` past page 50 | yes | `WHERE id < cursor ORDER BY id DESC LIMIT 21`. |
| Pydantic v2 with `model_config = ConfigDict(from_attributes=True)` | yes | `UserRead` declared exactly as specified. |
| Async sessions throughout | yes | `AsyncSession` from `sqlalchemy.ext.asyncio`. |
| `httpx` `AsyncClient` with `ASGITransport`, no live server | yes | Test uses `ASGITransport(app=app)`. |
| Real Postgres via Testcontainers fixture | assumed | I used `db_session` fixture from conftest; the AGENTS.md says conftest spins up Testcontainers, so the test relies on it without restating. |
| Imports absolute (`from src.app.X import Y`) | yes | No relative imports. |
| Snake_case modules, PascalCase classes | yes | |

## Ambiguity feedback

1. **Page shape DTO.** The AGENTS.md prescribes per-resource DTOs (`UserRead`, `UserCreate`) but doesn't specify whether paginated lists deserve their own wrapper (`UserPage`) or should return `{users, next_cursor}` raw. I added `UserPage`; a one-line "wrap paginated responses in a `<Resource>Page` model" would codify this.
2. **Cursor type.** `id` is a UUID in our model, but the AGENTS.md `## Architecture` shows `models/` without a uniform id-type convention. If the team uses both UUID and serial integer ids across tables, this prompt's exact code differs. The convention should pick one.
3. **`order_by(... .desc())` and keyset.** Descending keyset needs `WHERE id < cursor`. The AGENTS.md says keyset (`WHERE id > :last_id`) which is the ascending form. A one-line note about descending keyset (`WHERE id < cursor`) when ordering desc would prevent the wrong-direction bug.

## Result

The file is internally coherent. A competent agent produces: thin endpoint, async service in the right layer, Pydantic v2 DTOs, keyset pagination, real-Postgres-via-Testcontainers test using ASGITransport. Three small clarifications (page-wrapper DTO, id type, desc-keyset variant) would tighten it.
