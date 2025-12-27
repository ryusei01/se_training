"""
問題関連のAPIエンドポイント
"""
from fastapi import APIRouter, HTTPException
from typing import List
from app.models.problem import Problem
from app.storage.problem_storage import load_problem, list_all_problems

router = APIRouter(prefix="/api/problems", tags=["problems"])


@router.get("/", response_model=List[Problem])
async def list_problems():
    """問題一覧を取得"""
    return list_all_problems()


@router.get("/{problem_id}", response_model=Problem)
async def get_problem(problem_id: str):
    """問題詳細を取得"""
    problem = load_problem(problem_id)
    if not problem:
        raise HTTPException(status_code=404, detail="問題が見つかりません")
    return problem




