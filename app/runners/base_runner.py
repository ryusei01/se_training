"""
コード実行の基底クラス（将来の拡張を見据えた抽象化）
"""
from abc import ABC, abstractmethod
from typing import Dict, Any
from app.models.problem import Problem


class Runner(ABC):
    """コード実行インターフェース"""
    
    @abstractmethod
    def execute(
        self,
        problem: Problem,
        code: str,
        mode: str = "coding_test"
    ) -> Dict[str, Any]:
        """
        コードを実行して結果を返す
        
        Returns:
            {
                "result": "success" | "failure" | "error" | "timeout",
                "execution_time_sec": float,
                "error_message": str | None,
                "test_output": str | None,
            }
        """
        pass



