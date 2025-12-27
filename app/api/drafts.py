"""
解答ドラフト（Phase 1）関連のAPIエンドポイント

ユーザーが編集中のコードを保存・取得するためのAPI。
問題ごと、言語ごと、ユーザーごとにドラフトが保存される。
"""

from datetime import datetime
from typing import Optional

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from app.models.draft import Draft
from app.models.problem import Language
from app.storage.drafts import get_draft, save_draft
from app.storage.problem_storage import load_problem


# ドラフト関連のAPIルーターを作成（/api/drafts をプレフィックスとして使用）
router = APIRouter(prefix="/api/drafts", tags=["drafts"])


class SaveDraftRequest(BaseModel):
    """
    ドラフト保存リクエストのデータモデル
    
    Attributes:
        problem_id: 問題ID
        language: プログラミング言語
        code: 保存するコード
        user_id: ユーザーID（オプション、デフォルトは"anonymous"）
    """
    problem_id: str
    language: str
    code: str
    user_id: Optional[str] = None


@router.post("/save", response_model=Draft)
async def save_draft_api(request: SaveDraftRequest):
    """
    ドラフトを保存する
    
    同一の user_id × problem_id × language の組み合わせで
    既存のドラフトがある場合は上書きされる。
    
    Args:
        request: ドラフト保存リクエスト
        
    Returns:
        Draft: 保存されたドラフト情報
        
    Raises:
        HTTPException:
            - 問題が見つからない場合（404）
            - 未対応の言語が指定された場合（400）
            - 問題が指定言語に対応していない場合（400）
    """
    # 問題存在チェック
    problem = load_problem(request.problem_id)
    if not problem:
        raise HTTPException(status_code=404, detail="問題が見つかりません")

    # 言語検証 + 問題側の対応言語チェック（"ts" を "typescript" に変換）
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

    # ドラフトオブジェクトを作成して保存
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
    """
    ドラフトを取得する
    
    Args:
        problem_id: 問題ID
        language: プログラミング言語（クエリパラメータ）
        user_id: ユーザーID（クエリパラメータ、オプション）
        
    Returns:
        Draft: 取得されたドラフト情報
        
    Raises:
        HTTPException: ドラフトが見つからない場合（404）
    """
    # "ts" を "typescript" に変換
    lang_raw = language.lower().strip()
    if lang_raw == "ts":
        lang_raw = "typescript"

    # ドラフトを取得
    draft = get_draft(user_id=user_id or "anonymous", problem_id=problem_id, language=lang_raw)
    if not draft:
        raise HTTPException(status_code=404, detail="ドラフトが見つかりません")
    return draft




