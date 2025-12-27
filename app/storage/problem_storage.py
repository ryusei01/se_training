"""
問題ファイルの管理

problemsディレクトリ内のJSONファイルから問題情報を読み込む機能を提供する。
問題一覧の取得、個別の問題の読み込みを行う。
"""
import json
from pathlib import Path
from typing import List, Optional
from app.models.problem import Problem, Difficulty, Language


# 問題ファイルが保存されているディレクトリ
PROBLEMS_DIR = Path("problems")


def get_problem_file_path(problem_id: str) -> Path:
    """
    問題ファイルのパスを取得
    
    Args:
        problem_id: 問題ID（例: "ct-001"）
    
    Returns:
        Path: 問題ファイルのパス（problems/{problem_id}.json）
    """
    return PROBLEMS_DIR / f"{problem_id}.json"


def load_problem(problem_id: str) -> Optional[Problem]:
    """
    問題を読み込む
    
    Args:
        problem_id: 問題ID
    
    Returns:
        Optional[Problem]: 問題情報（見つからない場合はNone）
    """
    problem_path = get_problem_file_path(problem_id)
    
    if not problem_path.exists():
        return None
    
    try:
        data = json.loads(problem_path.read_text(encoding="utf-8"))
        # difficultyをEnumに変換
        data["difficulty"] = Difficulty(data["difficulty"])
        # supported_languagesをEnumに変換（存在する場合）
        if "supported_languages" in data and data["supported_languages"]:
            data["supported_languages"] = [Language(lang) for lang in data["supported_languages"]]
        return Problem(**data)
    except Exception as e:
        print(f"Error loading problem {problem_id}: {e}")
        return None


def list_all_problems() -> List[Problem]:
    """
    全問題をリストアップ
    
    problemsディレクトリ内のすべてのJSONファイルを読み込み、
    問題情報のリストを返す。問題IDでソートされる。
    
    Returns:
        List[Problem]: すべての問題のリスト（ID順にソート）
    """
    if not PROBLEMS_DIR.exists():
        return []
    
    problems = []
    for problem_file in PROBLEMS_DIR.glob("*.json"):
        problem_id = problem_file.stem
        problem = load_problem(problem_id)
        if problem:
            problems.append(problem)
    
    # IDでソート
    problems.sort(key=lambda p: p.id)
    return problems

