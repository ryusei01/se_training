"""
簡易実行（Phase 1）のデータモデル
"""

from datetime import datetime
from typing import Optional
from pydantic import BaseModel


class Execution(BaseModel):
    """簡易実行の履歴（サーバ側保存用）"""

    execution_id: str
    user_id: str
    problem_id: Optional[str] = None
    language: str
    code: str
    stdin: Optional[str] = None
    timestamp: datetime

    status: str  # "success" | "error" | "timeout"
    exit_code: Optional[int] = None
    stdout: Optional[str] = None
    stderr: Optional[str] = None
    execution_time_sec: Optional[float] = None
    error_message: Optional[str] = None


