"""
Pythonコードの実行エンジン（pytest使用）
"""
import tempfile
import subprocess
import time
import os
import re
from pathlib import Path
from typing import Dict, Any
from app.models.problem import Problem
from app.runners.base_runner import Runner


class PythonRunner(Runner):
    """Pythonコードをpytestで実行する"""
    
    def execute(
        self,
        problem: Problem,
        code: str,
        mode: str = "coding_test"
    ) -> Dict[str, Any]:
        """
        コードを実行して結果を返す
        """
        start_time = time.time()
        
        # 一時ディレクトリを作成
        with tempfile.TemporaryDirectory() as tmpdir:
            tmp_path = Path(tmpdir)
            
            # ユーザーコードをファイルに書き込み
            solution_file = tmp_path / "solution.py"
            solution_file.write_text(code, encoding="utf-8")
            
            # テストファイルを作成
            test_file = tmp_path / "test_solution.py"
            test_content = self._create_test_file(problem, code)
            test_file.write_text(test_content, encoding="utf-8")
            
            # pytestを実行
            try:
                result = self._run_pytest(tmp_path, problem.time_limit_sec)
                execution_time = time.time() - start_time
                
                return {
                    "result": result["status"],
                    "execution_time_sec": execution_time,
                    "error_message": result.get("error_message"),
                    "test_output": result.get("test_output"),
                }
            except Exception as e:
                execution_time = time.time() - start_time
                return {
                    "result": "error",
                    "execution_time_sec": execution_time,
                    "error_message": f"実行エラー: {str(e)}",
                    "test_output": None,
                }
    
    def _create_test_file(self, problem: Problem, user_code: str) -> str:
        """
        テストファイルの内容を生成
        - ユーザーコードをインポート
        - 問題のテストコードを追加
        """
        # function_signatureから関数名を抽出
        sig = problem.function_signature
        match = re.search(r'def\s+(\w+)', sig)
        if not match:
            raise ValueError(f"関数シグネチャから関数名を抽出できません: {sig}")
        func_name = match.group(1)
        
        test_content = f"""
import sys
from pathlib import Path

# ユーザーコードをインポート
sys.path.insert(0, str(Path(__file__).parent))
from solution import {func_name}

# テストコード内で関数名をエイリアス（問題定義のテストコードは 'solve' を想定）
solve = {func_name}

# 問題のテストコード
{problem.test_code}
"""
        return test_content
    
    def _run_pytest(self, test_dir: Path, time_limit_sec: float) -> Dict[str, Any]:
        """
        pytestを実行
        """
        # pytestコマンドを構築
        cmd = [
            "pytest",
            str(test_dir / "test_solution.py"),
            "-v",
            "--tb=short",
            "-x",  # 最初の失敗で停止
        ]
        
        # 環境変数を設定（セキュリティ対策：最低限）
        env = os.environ.copy()
        env["PYTHONIOENCODING"] = "utf-8"
        # ネットワークアクセス禁止のための環境変数（完全ではないが最低限の対策）
        # 完全なサンドボックスはMVP対象外
        
        try:
            # タイムアウト付きで実行
            process = subprocess.run(
                cmd,
                capture_output=True,
                text=True,
                timeout=time_limit_sec + 1.0,  # 少し余裕を持たせる
                cwd=str(test_dir),
                env=env,
            )
            
            if process.returncode == 0:
                return {
                    "status": "success",
                    "test_output": process.stdout,
                }
            else:
                return {
                    "status": "failure",
                    "error_message": "テストが失敗しました",
                    "test_output": process.stdout + "\n" + process.stderr,
                }
        except subprocess.TimeoutExpired:
            return {
                "status": "timeout",
                "error_message": f"実行時間が制限（{time_limit_sec}秒）を超えました",
                "test_output": None,
            }
        except Exception as e:
            return {
                "status": "error",
                "error_message": f"実行エラー: {str(e)}",
                "test_output": None,
            }

