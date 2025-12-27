"""
実行履歴の保存・読み込み
"""
import json
from pathlib import Path
from datetime import datetime
from typing import List, Optional
from app.models.submission import Submission, SubmissionResult


HISTORY_DIR = Path("data")
HISTORY_FILE = HISTORY_DIR / "submissions.json"


def ensure_history_dir():
    """履歴ディレクトリを確保"""
    HISTORY_DIR.mkdir(exist_ok=True)
    if not HISTORY_FILE.exists():
        HISTORY_FILE.write_text("[]", encoding="utf-8")


def save_submission(submission: Submission):
    """提出を保存"""
    ensure_history_dir()
    
    # 既存の履歴を読み込み
    history = load_all_submissions()
    
    # 新しい提出を追加
    history.append(submission)
    
    # JSONとして保存（datetimeを文字列に変換）
    submissions_data = []
    for s in history:
        submissions_data.append({
            "problem_id": s.problem_id,
            "code": s.code,
            "timestamp": s.timestamp.isoformat(),
            "result": s.result.value,
            "execution_time_sec": s.execution_time_sec,
            "error_message": s.error_message,
            "test_output": s.test_output,
        })
    
    HISTORY_FILE.write_text(
        json.dumps(submissions_data, ensure_ascii=False, indent=2),
        encoding="utf-8"
    )


def load_all_submissions() -> List[Submission]:
    """全提出履歴を読み込み"""
    ensure_history_dir()
    
    if not HISTORY_FILE.exists():
        return []
    
    try:
        data = json.loads(HISTORY_FILE.read_text(encoding="utf-8"))
        submissions = []
        for item in data:
            submissions.append(Submission(
                problem_id=item["problem_id"],
                code=item["code"],
                timestamp=datetime.fromisoformat(item["timestamp"]),
                result=SubmissionResult(item["result"]),
                execution_time_sec=item.get("execution_time_sec"),
                error_message=item.get("error_message"),
                test_output=item.get("test_output"),
            ))
        return submissions
    except Exception:
        return []


def get_submissions_by_problem(problem_id: str) -> List[Submission]:
    """特定問題の提出履歴を取得"""
    all_submissions = load_all_submissions()
    return [s for s in all_submissions if s.problem_id == problem_id]





