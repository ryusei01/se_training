"""
簡易実行（Phase 1）

- テストを走らせず、ユーザーコードを「スクリプト」として実行する
- stdin を渡し、stdout/stderr/exit code を返す
"""

from __future__ import annotations

import os
import subprocess
import sys
import tempfile
import time
from pathlib import Path
from typing import Any, Dict, Optional


def run_python_script(
    *,
    code: str,
    stdin: Optional[str] = None,
    time_limit_sec: float = 2.0,
) -> Dict[str, Any]:
    start = time.time()
    with tempfile.TemporaryDirectory() as tmpdir:
        tmp_path = Path(tmpdir)
        main_file = tmp_path / "main.py"
        main_file.write_text(code, encoding="utf-8")

        env = os.environ.copy()
        env["PYTHONIOENCODING"] = "utf-8"

        try:
            p = subprocess.run(
                [sys.executable, str(main_file)],
                input=stdin,
                capture_output=True,
                text=True,
                timeout=max(0.1, time_limit_sec),
                cwd=str(tmp_path),
                env=env,
            )
            return {
                "status": "success" if p.returncode == 0 else "error",
                "exit_code": p.returncode,
                "stdout": p.stdout,
                "stderr": p.stderr,
                "execution_time_sec": time.time() - start,
                "error_message": None if p.returncode == 0 else "実行が終了コード0以外で終了しました",
            }
        except subprocess.TimeoutExpired:
            return {
                "status": "timeout",
                "exit_code": None,
                "stdout": None,
                "stderr": None,
                "execution_time_sec": time.time() - start,
                "error_message": f"実行時間が制限（{time_limit_sec}秒）を超えました",
            }
        except Exception as e:
            return {
                "status": "error",
                "exit_code": None,
                "stdout": None,
                "stderr": None,
                "execution_time_sec": time.time() - start,
                "error_message": f"実行エラー: {str(e)}",
            }


def run_typescript_script(
    *,
    code: str,
    stdin: Optional[str] = None,
    time_limit_sec: float = 2.0,
) -> Dict[str, Any]:
    """
    TypeScript を `npx --yes tsx main.ts` で実行する。
    """
    start = time.time()
    with tempfile.TemporaryDirectory() as tmpdir:
        tmp_path = Path(tmpdir)

        # ESM設定（tsxが参照するケースがある）
        (tmp_path / "package.json").write_text(
            '{"name":"simple-runner","version":"1.0.0","type":"module"}',
            encoding="utf-8",
        )

        main_file = tmp_path / "main.ts"
        main_file.write_text(code, encoding="utf-8")

        env = os.environ.copy()
        env["PYTHONIOENCODING"] = "utf-8"

        try:
            p = subprocess.run(
                ["npx", "--yes", "tsx", str(main_file)],
                input=stdin,
                capture_output=True,
                text=True,
                timeout=max(0.1, time_limit_sec),
                cwd=str(tmp_path),
                env=env,
            )
            return {
                "status": "success" if p.returncode == 0 else "error",
                "exit_code": p.returncode,
                "stdout": p.stdout,
                "stderr": p.stderr,
                "execution_time_sec": time.time() - start,
                "error_message": None if p.returncode == 0 else "実行が終了コード0以外で終了しました",
            }
        except subprocess.TimeoutExpired:
            return {
                "status": "timeout",
                "exit_code": None,
                "stdout": None,
                "stderr": None,
                "execution_time_sec": time.time() - start,
                "error_message": f"実行時間が制限（{time_limit_sec}秒）を超えました",
            }
        except FileNotFoundError:
            return {
                "status": "error",
                "exit_code": None,
                "stdout": None,
                "stderr": None,
                "execution_time_sec": time.time() - start,
                "error_message": "npx/tsx が見つかりません。Node.js と tsx が必要です。",
            }
        except Exception as e:
            return {
                "status": "error",
                "exit_code": None,
                "stdout": None,
                "stderr": None,
                "execution_time_sec": time.time() - start,
                "error_message": f"実行エラー: {str(e)}",
            }




