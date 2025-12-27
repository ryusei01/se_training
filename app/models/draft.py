"""
解答ドラフト（Phase 1）のデータモデル
"""

from datetime import datetime
from pydantic import BaseModel


class Draft(BaseModel):
    """ユーザーのドラフト（問題×言語×ユーザー）"""

    user_id: str
    problem_id: str
    language: str
    code: str
    updated_at: datetime


