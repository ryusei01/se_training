"""
問題関連のAPIエンドポイント

コーディングテストの問題情報を取得するためのAPI。
問題一覧の取得と、個別の問題詳細の取得を提供する。
"""
from fastapi import APIRouter, HTTPException
from typing import List
from app.models.problem import Problem
from app.storage.problem_storage import load_problem, list_all_problems

# 問題関連のAPIルーターを作成（/api/problems をプレフィックスとして使用）
router = APIRouter(prefix="/api/problems", tags=["problems"])


@router.get("/", response_model=List[Problem])
async def list_problems():
    """
    問題一覧を取得
    
    Returns:
        List[Problem]: すべての問題のリスト（ID順にソート）
    """
    return list_all_problems()


@router.get("/{problem_id}", response_model=Problem)
async def get_problem(problem_id: str):
    """
    問題詳細を取得
    
    Args:
        problem_id: 問題ID（例: "ct-001"）
        
    Returns:
        Problem: 問題の詳細情報
        
    Raises:
        HTTPException: 問題が見つからない場合（404エラー）
    """
    problem = load_problem(problem_id)
    if not problem:
        raise HTTPException(status_code=404, detail="問題が見つかりません")
    return problem





