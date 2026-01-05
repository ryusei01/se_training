"""
モデルの一括インポート

SQLAlchemy の relationship() で文字列参照しているモデル（例: "User"）が
mapper 構築時に解決できずエラーになるのを防ぐため、ここで主要モデルを
先に import してレジストリに登録する。
"""

# NOTE:
# ここで import するだけで副作用として SQLAlchemy の mapper が登録される。
# アプリ起動時（init_db）に必ず読み込むこと。

from app.models.user import User, SubscriptionStatus  # noqa: F401
from app.models.course import Course, Chapter, ChecklistItem, ProgressRecord, SubscriptionHistory  # noqa: F401
from app.models.problem import Problem  # noqa: F401
from app.models.submission import Submission, SubmissionResult  # noqa: F401
from app.models.execution import Execution  # noqa: F401
from app.models.draft import Draft  # noqa: F401
from app.models.request import Request, RequestStatus  # noqa: F401


