"""
提出関連のAPIエンドポイント

コーディングテストのコード提出と実行結果の管理を行うAPI。
提出されたコードは自動テストで実行され、結果が返される。
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

# 提出関連のAPIルーターを作成（/api/submissions をプレフィックスとして使用）
router = APIRouter(prefix="/api/submissions", tags=["submissions"])


class SubmitRequest(BaseModel):
    """
    提出リクエストのデータモデル
    
    Attributes:
        problem_id: 問題ID
        code: 提出するコード
        language: プログラミング言語（デフォルトは"python"）
    """
    problem_id: str
    code: str
    language: Optional[str] = "python"  # デフォルトはPython


@router.post("/submit")
async def submit_code(request: SubmitRequest):
    """
    コードを提出して実行し、テスト結果を返す
    
    提出されたコードは問題のテストケースで実行され、
    成功/失敗の結果とともに提出履歴に保存される。
    
    Args:
        request: 提出リクエスト（問題ID、コード、言語）
        
    Returns:
        Submission: 実行結果を含む提出情報
        
    Raises:
        HTTPException: 
            - 問題が見つからない場合（404）
            - 未対応の言語が指定された場合（400）
            - 問題が指定言語に対応していない場合（400）
    """
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
    
    # 言語に応じたRunnerを作成してコードを実行
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
    
    # 提出履歴に保存
    save_submission(submission)
    
    return submission


@router.get("/history/{problem_id}", response_model=List[Submission])
async def get_submission_history(problem_id: str):
    """
    特定問題の提出履歴を取得
    
    Args:
        problem_id: 問題ID
        
    Returns:
        List[Submission]: 指定された問題に対するすべての提出履歴
    """
    return get_submissions_by_problem(problem_id)

