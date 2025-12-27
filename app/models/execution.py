"""
簡易実行（Phase 1）のデータモデル

テストを実行せずにコードをスクリプトとして実行した結果を表現するデータモデル。
デバッグや動作確認に使用される。
"""

from datetime import datetime
from typing import Optional
from pydantic import BaseModel


class Execution(BaseModel):
    """
    簡易実行の履歴データモデル（サーバー側保存用）
    
    Attributes:
        execution_id: 実行ID（UUID）
        user_id: ユーザーID
        problem_id: 関連する問題ID（オプション）
        language: プログラミング言語
        code: 実行されたコード
        stdin: 標準入力（オプション）
        timestamp: 実行日時
        status: 実行ステータス（"success" | "error" | "timeout"）
        exit_code: 終了コード（オプション）
        stdout: 標準出力（オプション）
        stderr: 標準エラー出力（オプション）
        execution_time_sec: 実行時間（秒、オプション）
        error_message: エラーメッセージ（オプション）
    """

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




