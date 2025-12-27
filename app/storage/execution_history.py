"""
簡易実行の履歴保存・読み込み（Phase 1）
"""

import json
from datetime import datetime
from pathlib import Path
from typing import List, Optional

from app.models.execution import Execution


DATA_DIR = Path("data")
EXECUTIONS_FILE = DATA_DIR / "executions.json"


def _ensure_data_file():
    DATA_DIR.mkdir(exist_ok=True)
    if not EXECUTIONS_FILE.exists():
        EXECUTIONS_FILE.write_text("[]", encoding="utf-8")


def save_execution(execution: Execution) -> None:
    """実行履歴を追記保存"""
    _ensure_data_file()
    history = load_all_executions()
    history.append(execution)

    data = []
    for e in history:
        data.append(
            {
                "execution_id": e.execution_id,
                "user_id": e.user_id,
                "problem_id": e.problem_id,
                "language": e.language,
                "code": e.code,
                "stdin": e.stdin,
                "timestamp": e.timestamp.isoformat(),
                "status": e.status,
                "exit_code": e.exit_code,
                "stdout": e.stdout,
                "stderr": e.stderr,
                "execution_time_sec": e.execution_time_sec,
                "error_message": e.error_message,
            }
        )

    EXECUTIONS_FILE.write_text(
        json.dumps(data, ensure_ascii=False, indent=2),
        encoding="utf-8",
    )


def load_all_executions() -> List[Execution]:
    """全実行履歴を読み込み"""
    _ensure_data_file()
    try:
        raw = json.loads(EXECUTIONS_FILE.read_text(encoding="utf-8"))
        executions: List[Execution] = []
        for item in raw:
            executions.append(
                Execution(
                    execution_id=item["execution_id"],
                    user_id=item.get("user_id") or "anonymous",
                    problem_id=item.get("problem_id"),
                    language=item["language"],
                    code=item.get("code") or "",
                    stdin=item.get("stdin"),
                    timestamp=datetime.fromisoformat(item["timestamp"]),
                    status=item.get("status") or "error",
                    exit_code=item.get("exit_code"),
                    stdout=item.get("stdout"),
                    stderr=item.get("stderr"),
                    execution_time_sec=item.get("execution_time_sec"),
                    error_message=item.get("error_message"),
                )
            )
        return executions
    except Exception:
        return []


def get_executions(
    *,
    user_id: Optional[str] = None,
    problem_id: Optional[str] = None,
    language: Optional[str] = None,
    limit: int = 50,
) -> List[Execution]:
    """条件に合う実行履歴を新しい順に返す"""
    items = load_all_executions()
    if user_id:
        items = [e for e in items if e.user_id == user_id]
    if problem_id:
        items = [e for e in items if e.problem_id == problem_id]
    if language:
        items = [e for e in items if e.language == language]
    items.sort(key=lambda e: e.timestamp, reverse=True)
    return items[: max(0, min(limit, 200))]



