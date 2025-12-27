"""
解答ドラフト（Phase 1）関連のAPIエンドポイント
"""

from datetime import datetime
from typing import Optional

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from app.models.draft import Draft
from app.models.problem import Language
from app.storage.drafts import get_draft, save_draft
from app.storage.problem_storage import load_problem


router = APIRouter(prefix="/api/drafts", tags=["drafts"])


class SaveDraftRequest(BaseModel):
    problem_id: str
    language: str
    code: str
    user_id: Optional[str] = None


@router.post("/save", response_model=Draft)
async def save_draft_api(request: SaveDraftRequest):
    # problem存在チェック
    problem = load_problem(request.problem_id)
    if not problem:
        raise HTTPException(status_code=404, detail="問題が見つかりません")

    # 言語検証 + 問題側の対応言語チェック
    lang_raw = request.language.lower().strip()
    if lang_raw == "ts":
        lang_raw = "typescript"
    try:
        lang = Language(lang_raw)
    except ValueError:
        raise HTTPException(status_code=400, detail=f"未対応の言語: {request.language}")
    if lang not in problem.get_supported_languages():
        raise HTTPException(
            status_code=400,
            detail=f"この問題は {lang.value} には対応していません。対応言語: {[l.value for l in problem.get_supported_languages()]}",
        )

    draft = Draft(
        user_id=request.user_id or "anonymous",
        problem_id=request.problem_id,
        language=lang.value,
        code=request.code,
        updated_at=datetime.now(),
    )
    return save_draft(draft)


@router.get("/{problem_id}", response_model=Draft)
async def get_draft_api(
    problem_id: str,
    language: str,
    user_id: Optional[str] = None,
):
    lang_raw = language.lower().strip()
    if lang_raw == "ts":
        lang_raw = "typescript"

    draft = get_draft(user_id=user_id or "anonymous", problem_id=problem_id, language=lang_raw)
    if not draft:
        raise HTTPException(status_code=404, detail="ドラフトが見つかりません")
    return draft




