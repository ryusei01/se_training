"""
問題データモデル
"""
from enum import Enum
from typing import List, Optional
from pydantic import BaseModel


class Difficulty(str, Enum):
    """難易度"""
    EASY = "easy"
    MEDIUM = "medium"
    HARD = "hard"


class Language(str, Enum):
    """対応言語"""
    PYTHON = "python"
    TYPESCRIPT = "typescript"


class Problem(BaseModel):
    """問題定義"""
    id: str  # 例: ct-001
    title: str
    difficulty: Difficulty
    category: List[str]  # 例: ["array", "hash"]
    time_limit_sec: float
    memory_limit_mb: int
    description: str  # Markdown形式の問題文
    function_signature: str  # 例: "def solve(nums: list[int], target: int) -> bool:" (Python) または "function solve(nums: number[], target: number): boolean" (TypeScript)
    test_code: str  # テストコード（Python: pytest用、TypeScript: カスタムテストランナー用）
    supported_languages: Optional[List[Language]] = None  # 対応言語リスト（Noneの場合は["python"]）
    hint: Optional[str] = None  # 解き方のヒント（Markdown形式）
    solution: Optional[str] = None  # 答えと解説（Markdown形式）
    
    def get_supported_languages(self) -> List[Language]:
        """対応言語リストを取得（デフォルトはPythonのみ）"""
        if self.supported_languages is None or len(self.supported_languages) == 0:
            return [Language.PYTHON]
        return self.supported_languages

