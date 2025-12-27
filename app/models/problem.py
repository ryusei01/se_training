"""
問題データモデル

コーディングテストの問題を表現するデータモデル。
問題の内容、テストコード、対応言語などの情報を含む。
"""
from enum import Enum
from typing import List, Optional
from pydantic import BaseModel


class Difficulty(str, Enum):
    """
    難易度の列挙型
    
    Values:
        EASY: 簡単
        MEDIUM: 中級
        HARD: 難しい
    """
    EASY = "easy"
    MEDIUM = "medium"
    HARD = "hard"


class Language(str, Enum):
    """
    対応プログラミング言語の列挙型
    
    Values:
        PYTHON: Python
        TYPESCRIPT: TypeScript
    """
    PYTHON = "python"
    TYPESCRIPT = "typescript"


class Problem(BaseModel):
    """
    問題定義のデータモデル
    
    Attributes:
        id: 問題ID（例: "ct-001"）
        title: 問題タイトル
        difficulty: 難易度（easy/medium/hard）
        category: カテゴリリスト（例: ["array", "hash"]）
        time_limit_sec: 実行時間制限（秒）
        memory_limit_mb: メモリ制限（MB）
        description: Markdown形式の問題文
        function_signature: 関数シグネチャ
            例（Python）: "def solve(nums: list[int], target: int) -> bool:"
            例（TypeScript）: "function solve(nums: number[], target: number): boolean"
        test_code: テストコード
            Python: pytest用のテストコード
            TypeScript: カスタムテストランナー用のテストコード
        supported_languages: 対応言語リスト（Noneの場合はPythonのみ）
        hint: 解き方のヒント（Markdown形式、オプション）
        solution: 答えと解説（Markdown形式、オプション）
    """
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
        """
        対応言語リストを取得
        
        対応言語が指定されていない場合は、デフォルトでPythonのみを返す。
        
        Returns:
            List[Language]: 対応言語のリスト
        """
        if self.supported_languages is None or len(self.supported_languages) == 0:
            return [Language.PYTHON]
        return self.supported_languages

