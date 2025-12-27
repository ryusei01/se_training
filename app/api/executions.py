"""
簡易実行（Phase 1）関連のAPIエンドポイント

テストを実行せずにコードをスクリプトとして実行する機能を提供するAPI。
デバッグやコードの動作確認に使用される。
"""

from datetime import datetime
from typing import List, Optional
from uuid import uuid4

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from app.models.execution import Execution
from app.models.problem import Language
from app.runners.simple_executor import run_python_script, run_typescript_script
from app.storage.execution_history import get_executions, save_execution
from app.storage.problem_storage import load_problem


# 簡易実行関連のAPIルーターを作成（/api/executions をプレフィックスとして使用）
router = APIRouter(prefix="/api/executions", tags=["executions"])


class RunRequest(BaseModel):
    """
    簡易実行リクエストのデータモデル
    
    Attributes:
        code: 実行するコード
        language: プログラミング言語（"python" または "typescript"）
        stdin: 標準入力（オプション）
        problem_id: 関連する問題ID（オプション）
        user_id: ユーザーID（オプション）
        time_limit_sec: 実行時間制限（秒、オプション）
    """
    code: str
    language: str  # "python" | "typescript"
    stdin: Optional[str] = None
    problem_id: Optional[str] = None
    user_id: Optional[str] = None
    time_limit_sec: Optional[float] = None


@router.post("/run", response_model=Execution)
async def run_code(request: RunRequest):
    """
    コードをスクリプトとして実行する（テストは実行しない）
    
    提出機能とは異なり、テストケースを実行せずに
    コードを直接実行し、stdout/stderrを返す。
    デバッグや動作確認に使用される。
    
    Args:
        request: 実行リクエスト（コード、言語、標準入力など）
        
    Returns:
        Execution: 実行結果（stdout、stderr、実行時間など）
        
    Raises:
        HTTPException:
            - 未対応の言語が指定された場合（400）
            - 問題が見つからない場合（404）
            - 問題が指定言語に対応していない場合（400）
    """
    # 言語検証（"ts" を "typescript" に変換）
    lang_raw = request.language.lower().strip()
    if lang_raw == "ts":
        lang_raw = "typescript"
    try:
        lang = Language(lang_raw)
    except ValueError:
        raise HTTPException(status_code=400, detail=f"未対応の言語: {request.language}")

    # problem_id がある場合は存在確認＆対応言語チェック（API利用者の取り違え防止）
    time_limit = request.time_limit_sec
    if request.problem_id:
        problem = load_problem(request.problem_id)
        if not problem:
            raise HTTPException(status_code=404, detail="問題が見つかりません")
        if lang not in problem.get_supported_languages():
            raise HTTPException(
                status_code=400,
                detail=f"この問題は {lang.value} には対応していません。対応言語: {[l.value for l in problem.get_supported_languages()]}",
            )
        # 問題の時間制限をデフォルトとして使用
        time_limit = time_limit or problem.time_limit_sec

    # 時間制限のデフォルト値は2秒
    time_limit = float(time_limit or 2.0)

    # 言語に応じてコードを実行
    if lang == Language.PYTHON:
        result = run_python_script(code=request.code, stdin=request.stdin, time_limit_sec=time_limit)
    else:
        result = run_typescript_script(code=request.code, stdin=request.stdin, time_limit_sec=time_limit)

    # 実行結果をExecutionオブジェクトに変換
    execution = Execution(
        execution_id=str(uuid4()),
        user_id=(request.user_id or "anonymous"),
        problem_id=request.problem_id,
        language=lang.value,
        code=request.code,
        stdin=request.stdin,
        timestamp=datetime.now(),
        status=result["status"],
        exit_code=result.get("exit_code"),
        stdout=result.get("stdout"),
        stderr=result.get("stderr"),
        execution_time_sec=result.get("execution_time_sec"),
        error_message=result.get("error_message"),
    )
    # 実行履歴に保存
    save_execution(execution)
    return execution


@router.get("/history", response_model=List[Execution])
async def get_execution_history(
    user_id: Optional[str] = None,
    problem_id: Optional[str] = None,
    language: Optional[str] = None,
    limit: int = 50,
):
    """
    簡易実行の履歴を取得（新しい順）
    
    Args:
        user_id: ユーザーIDでフィルタ（オプション）
        problem_id: 問題IDでフィルタ（オプション）
        language: 言語でフィルタ（オプション）
        limit: 取得件数の上限（デフォルト: 50、最大: 200）
        
    Returns:
        List[Execution]: 条件に一致する実行履歴のリスト（新しい順）
    """
    return get_executions(user_id=user_id, problem_id=problem_id, language=language, limit=limit)




