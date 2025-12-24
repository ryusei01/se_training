"""
提出データモデル
"""
from datetime import datetime
from enum import Enum
from typing import Optional
from pydantic import BaseModel


class SubmissionResult(str, Enum):
    """実行結果"""
    SUCCESS = "success"
    FAILURE = "failure"
    ERROR = "error"
    TIMEOUT = "timeout"


class Submission(BaseModel):
    """提出"""
    problem_id: str
    code: str
    timestamp: datetime
    result: SubmissionResult
    execution_time_sec: Optional[float] = None
    error_message: Optional[str] = None
    test_output: Optional[str] = None

