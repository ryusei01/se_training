"""
メインアプリケーション

FastAPIベースのバックエンドAPIサーバー。
コーディングテストの問題提供、コード実行、提出管理などの機能を提供する。
"""
import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
# 開発環境では静的ファイルの配信は不要（Expoの開発サーバーを使用）
# 本番環境で静的ファイルを配信する場合は、以下を有効化
# from fastapi.staticfiles import StaticFiles
# from pathlib import Path
from app.api import problems, submissions, executions, drafts, auth, courses, progress, requests, cors_demo
from app.database import init_db
from app.middlewares.cors_strip import CorsStripMiddleware

# FastAPIアプリケーションインスタンスを作成
app = FastAPI(title="SE Training - Coding Test", version="0.1.0")

# データベースを初期化
init_db()

# CORS設定
# Expoの開発サーバー（Web版: http://localhost:19006, モバイル: exp://localhost:8081）を許可
# 本番環境では環境変数 ALLOWED_ORIGINS で許可するオリジンを設定する
# 例: ALLOWED_ORIGINS=https://your-domain.com,https://www.your-domain.com

# デフォルト値（開発環境用）
default_origins = "http://localhost:19006,http://localhost:8081,exp://localhost:8081"

# 環境変数から取得（未設定の場合はデフォルト値を使用）
allowed_origins_str = os.getenv("ALLOWED_ORIGINS", default_origins)

# 空の文字列を除去し、空白をトリム
allowed_origins = [
    origin.strip() 
    for origin in allowed_origins_str.split(",") 
    if origin.strip()
]

# デバッグ用: 許可されているオリジンをログ出力（開発環境のみ）
if os.getenv("ENVIRONMENT") != "production":
    print(f"[CORS] Allowed origins: {allowed_origins}")

# CORSミドルウェアを追加（フロントエンドからのリクエストを許可）
app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],  # すべてのHTTPメソッドを許可
    allow_headers=["*"],  # すべてのヘッダーを許可
)

# CORS 失敗注入（教材用）: /api/cors-demo/fail 配下では CORS を剥がす
app.add_middleware(CorsStripMiddleware, path_prefix="/api/cors-demo/fail")

# APIルーターを登録
# 各モジュールのルーターをアプリケーションに追加
app.include_router(problems.router)      # 問題関連API
app.include_router(submissions.router)   # 提出関連API
app.include_router(executions.router)    # 簡易実行関連API
app.include_router(drafts.router)        # ドラフト関連API
app.include_router(auth.router)          # 認証関連API
app.include_router(courses.router)       # コース関連API
app.include_router(progress.router)      # 学習記録関連API
app.include_router(requests.router)      # 文書決裁デモ（申請）API
app.include_router(cors_demo.router)     # CORS 教材API

# 注意: 開発環境ではExpoの開発サーバー（http://localhost:19006）を直接使用します
# 本番環境で静的ファイルを配信する場合は、以下のコメントを解除してください
# expo_web_dir = Path("mobile/dist")
# if expo_web_dir.exists():
#     app.mount("/", StaticFiles(directory=str(expo_web_dir), html=True), name="expo-web")


@app.get("/")
async def root():
    """
    APIルートエンドポイント
    
    開発環境では、Expoの開発サーバー（http://localhost:19006）を使用してください。
    
    Returns:
        dict: APIの基本情報とドキュメントへのリンク
    """
    return {
        "message": "SE Training - Coding Test API",
        "docs": "/docs",
        "note": "開発環境では、Expoの開発サーバー（http://localhost:19006）を使用してください"
    }


@app.get("/health")
async def health():
    """
    ヘルスチェックエンドポイント
    
    本番環境でのスリープ対策や監視用に使用。
    
    Returns:
        dict: ステータス情報
    """
    return {"status": "ok", "service": "SE Training API"}



