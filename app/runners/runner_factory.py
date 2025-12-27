"""
Runnerファクトリー - 言語に応じたRunnerを返す
"""
from app.models.problem import Language
from app.runners.python_runner import PythonRunner
from app.runners.typescript_runner import TypeScriptRunner
from app.runners.base_runner import Runner


def create_runner(language: Language) -> Runner:
    """
    言語に応じたRunnerを作成
    
    Args:
        language: 実行言語
        
    Returns:
        Runnerインスタンス
    """
    if language == Language.PYTHON:
        return PythonRunner()
    elif language == Language.TYPESCRIPT:
        return TypeScriptRunner()
    else:
        raise ValueError(f"未対応の言語: {language}")



