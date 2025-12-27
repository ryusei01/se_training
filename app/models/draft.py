"""
解答ドラフト（Phase 1）のデータモデル

ユーザーが編集中のコードを保存するためのデータモデル。
問題ごと、言語ごと、ユーザーごとに保存される。
"""

from datetime import datetime
from pydantic import BaseModel


class Draft(BaseModel):
    """
    ユーザーのドラフトデータモデル（問題×言語×ユーザーの組み合わせで一意）
    
    Attributes:
        user_id: ユーザーID
        problem_id: 問題ID
        language: プログラミング言語
        code: 保存されているコード
        updated_at: 最終更新日時
    """

    user_id: str
    problem_id: str
    language: str
    code: str
    updated_at: datetime




