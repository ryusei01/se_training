"""
Runnerファクトリー - 言語に応じたRunnerを返す

ファクトリーパターンを使用して、指定された言語に対応するRunnerインスタンスを作成する。
新しい言語を追加する場合は、ここに条件分岐を追加する必要がある。
"""
from app.models.problem import Language
from app.runners.python_runner import PythonRunner
from app.runners.typescript_runner import TypeScriptRunner
from app.runners.base_runner import Runner


def create_runner(language: Language) -> Runner:
    """
    言語に応じたRunnerインスタンスを作成
    
    指定された言語に対応するRunnerを生成して返す。
    現在はPythonとTypeScriptに対応している。
    
    Args:
        language: 実行するプログラミング言語
        
    Returns:
        Runner: 対応するRunnerインスタンス
        
    Raises:
        ValueError: 未対応の言語が指定された場合
    """
    if language == Language.PYTHON:
        return PythonRunner()
    elif language == Language.TYPESCRIPT:
        return TypeScriptRunner()
    else:
        raise ValueError(f"未対応の言語: {language}")





