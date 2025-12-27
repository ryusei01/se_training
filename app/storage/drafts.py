"""
解答ドラフトの保存・読み込み（Phase 1）

認証が未導入のため、暫定的に user_id（文字列）で識別する。
"""

import json
from datetime import datetime
from pathlib import Path
from typing import List, Optional

from app.models.draft import Draft


DATA_DIR = Path("data")
DRAFTS_FILE = DATA_DIR / "drafts.json"


def _ensure_data_file():
    DATA_DIR.mkdir(exist_ok=True)
    if not DRAFTS_FILE.exists():
        DRAFTS_FILE.write_text("[]", encoding="utf-8")


def load_all_drafts() -> List[Draft]:
    _ensure_data_file()
    try:
        raw = json.loads(DRAFTS_FILE.read_text(encoding="utf-8"))
        drafts: List[Draft] = []
        for item in raw:
            drafts.append(
                Draft(
                    user_id=item.get("user_id") or "anonymous",
                    problem_id=item["problem_id"],
                    language=item["language"],
                    code=item.get("code") or "",
                    updated_at=datetime.fromisoformat(item["updated_at"]),
                )
            )
        return drafts
    except Exception:
        return []


def save_draft(draft: Draft) -> Draft:
    """
    ドラフトを保存（同一 user_id × problem_id × language は上書き）
    """
    _ensure_data_file()
    drafts = load_all_drafts()
    updated: List[Draft] = []
    replaced = False
    for d in drafts:
        if (
            d.user_id == draft.user_id
            and d.problem_id == draft.problem_id
            and d.language == draft.language
        ):
            updated.append(draft)
            replaced = True
        else:
            updated.append(d)
    if not replaced:
        updated.append(draft)

    data = []
    for d in updated:
        data.append(
            {
                "user_id": d.user_id,
                "problem_id": d.problem_id,
                "language": d.language,
                "code": d.code,
                "updated_at": d.updated_at.isoformat(),
            }
        )

    DRAFTS_FILE.write_text(
        json.dumps(data, ensure_ascii=False, indent=2),
        encoding="utf-8",
    )
    return draft


def get_draft(
    *, user_id: str, problem_id: str, language: str
) -> Optional[Draft]:
    drafts = load_all_drafts()
    for d in drafts:
        if d.user_id == user_id and d.problem_id == problem_id and d.language == language:
            return d
    return None


