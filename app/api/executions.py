"""
簡易実行（Phase 1）関連のAPIエンドポイント
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


router = APIRouter(prefix="/api/executions", tags=["executions"])


class RunRequest(BaseModel):
    code: str
    language: str  # "python" | "typescript"
    stdin: Optional[str] = None
    problem_id: Optional[str] = None
    user_id: Optional[str] = None
    time_limit_sec: Optional[float] = None


@router.post("/run", response_model=Execution)
async def run_code(request: RunRequest):
    """
    テストを走らせず、コードをスクリプトとして実行する（stdout/stderrを返す）
    """
    # 言語検証
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
        time_limit = time_limit or problem.time_limit_sec

    time_limit = float(time_limit or 2.0)

    # 実行
    if lang == Language.PYTHON:
        result = run_python_script(code=request.code, stdin=request.stdin, time_limit_sec=time_limit)
    else:
        result = run_typescript_script(code=request.code, stdin=request.stdin, time_limit_sec=time_limit)

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
    """
    return get_executions(user_id=user_id, problem_id=problem_id, language=language, limit=limit)




