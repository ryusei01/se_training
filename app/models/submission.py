"""
提出データモデル

コーディングテストの提出情報と実行結果を表現するデータモデル。
"""
from datetime import datetime
from enum import Enum
from typing import Optional
from pydantic import BaseModel


class SubmissionResult(str, Enum):
    """
    実行結果の列挙型
    
    Values:
        SUCCESS: すべてのテストが成功
        FAILURE: テストが失敗
        ERROR: 実行エラーが発生
        TIMEOUT: 実行時間が制限を超えた
    """
    SUCCESS = "success"
    FAILURE = "failure"
    ERROR = "error"
    TIMEOUT = "timeout"


class Submission(BaseModel):
    """
    提出のデータモデル
    
    Attributes:
        problem_id: 問題ID
        code: 提出されたコード
        timestamp: 提出日時
        result: 実行結果（SUCCESS/FAILURE/ERROR/TIMEOUT）
        execution_time_sec: 実行時間（秒、オプション）
        error_message: エラーメッセージ（オプション）
        test_output: テスト実行の出力（オプション）
    """
    problem_id: str
    code: str
    timestamp: datetime
    result: SubmissionResult
    execution_time_sec: Optional[float] = None
    error_message: Optional[str] = None
    test_output: Optional[str] = None

