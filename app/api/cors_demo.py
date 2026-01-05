"""
CORS 教材用エンドポイント

docs/追加要件.md の CORS 演習（失敗注入）用。
"""

from fastapi import APIRouter

router = APIRouter(prefix="/api/cors-demo", tags=["cors-demo"])


@router.get("/ok/ping")
async def cors_ok_ping():
    return {"ok": True, "message": "cors ok"}


@router.get("/fail/ping")
async def cors_fail_ping():
    # NOTE: 実際の CORS 失敗は CorsStripMiddleware がヘッダーを剥がして再現する
    return {"ok": True, "message": "cors should fail on web (headers stripped)"}




