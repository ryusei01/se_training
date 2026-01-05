"""
CORS 失敗注入用ミドルウェア

docs/追加要件.md の「10. CORS（教材・演習要件）」の“失敗注入”を再現するための最小実装。
指定されたパス配下では CORS ヘッダーを剥がし、OPTIONS を 403 で返す。

ブラウザ（Expo Web）では CORS エラーとして観測でき、DevTools Network 学習に使える。
"""

from typing import Callable, Iterable, Optional

from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request
from starlette.responses import Response


class CorsStripMiddleware(BaseHTTPMiddleware):
    def __init__(self, app, path_prefix: str):
        super().__init__(app)
        self.path_prefix = path_prefix

    async def dispatch(self, request: Request, call_next: Callable):
        if request.url.path.startswith(self.path_prefix):
            # Preflight を明示的にブロック（教材用）
            if request.method.upper() == "OPTIONS":
                return Response("CORS preflight blocked (training)", status_code=403)

            response = await call_next(request)

            # CORS ヘッダーを剥がす（CORSMiddleware の後段で実行される想定）
            for header in (
                "access-control-allow-origin",
                "access-control-allow-credentials",
                "access-control-allow-methods",
                "access-control-allow-headers",
                "access-control-expose-headers",
            ):
                if header in response.headers:
                    del response.headers[header]
            return response

        return await call_next(request)




