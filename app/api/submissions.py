"""
提出関連のAPIエンドポイント
"""
from fastapi import APIRouter, HTTPException
from typing import List, Optional
from datetime import datetime
from pydantic import BaseModel
from app.models.submission import Submission, SubmissionResult
from app.storage.problem_storage import load_problem
from app.storage.history import save_submission, get_submissions_by_problem
from app.models.problem import Language
from app.runners.runner_factory import create_runner

router = APIRouter(prefix="/api/submissions", tags=["submissions"])


class SubmitRequest(BaseModel):
    """提出リクエスト"""
    problem_id: str
    code: str
    language: Optional[str] = "python"  # デフォルトはPython


@router.post("/submit")
async def submit_code(request: SubmitRequest):
    """コードを提出して実行"""
    # 問題を取得
    problem = load_problem(request.problem_id)
    if not problem:
        raise HTTPException(status_code=404, detail="問題が見つかりません")
    
    # 言語を検証
    try:
        lang = Language(request.language.lower())
    except ValueError:
        raise HTTPException(status_code=400, detail=f"未対応の言語: {request.language}")
    
    # 問題が対応している言語か確認
    supported_languages = problem.get_supported_languages()
    if lang not in supported_languages:
        raise HTTPException(
            status_code=400,
            detail=f"この問題は {lang.value} には対応していません。対応言語: {[l.value for l in supported_languages]}"
        )
    
    # 言語に応じたRunnerを作成
    runner = create_runner(lang)
    result = runner.execute(problem, request.code, mode="coding_test")
    
    # 結果をSubmissionオブジェクトに変換
    submission = Submission(
        problem_id=request.problem_id,
        code=request.code,
        timestamp=datetime.now(),
        result=SubmissionResult(result["result"]),
        execution_time_sec=result.get("execution_time_sec"),
        error_message=result.get("error_message"),
        test_output=result.get("test_output"),
    )
    
    # 履歴に保存
    save_submission(submission)
    
    return submission


@router.get("/history/{problem_id}", response_model=List[Submission])
async def get_submission_history(problem_id: str):
    """特定問題の提出履歴を取得"""
    return get_submissions_by_problem(problem_id)

