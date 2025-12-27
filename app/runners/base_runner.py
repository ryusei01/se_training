"""
コード実行の基底クラス（将来の拡張を見据えた抽象化）

各プログラミング言語に対応するRunnerクラスの基底クラス。
新しい言語を追加する場合は、このクラスを継承して実装する。
"""
from abc import ABC, abstractmethod
from typing import Dict, Any
from app.models.problem import Problem


class Runner(ABC):
    """
    コード実行インターフェース（抽象基底クラス）
    
    各プログラミング言語に対応するRunnerは、このクラスを継承して
    execute メソッドを実装する必要がある。
    """
    
    @abstractmethod
    def execute(
        self,
        problem: Problem,
        code: str,
        mode: str = "coding_test"
    ) -> Dict[str, Any]:
        """
        コードを実行して結果を返す（抽象メソッド）
        
        Args:
            problem: 問題情報
            code: 実行するコード
            mode: 実行モード（デフォルトは"coding_test"）
        
        Returns:
            Dict[str, Any]: 実行結果の辞書
                - "result": 実行結果（"success" | "failure" | "error" | "timeout"）
                - "execution_time_sec": 実行時間（秒、float）
                - "error_message": エラーメッセージ（str | None）
                - "test_output": テスト出力（str | None）
        """
        pass





