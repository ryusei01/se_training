"""
メインアプリケーション

FastAPIベースのバックエンドAPIサーバー。
コーディングテストの問題提供、コード実行、提出管理などの機能を提供する。
"""
import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from pathlib import Path
from app.api import problems, submissions, executions, drafts

# FastAPIアプリケーションインスタンスを作成
app = FastAPI(title="SE Training - Coding Test", version="0.1.0")

# CORS設定
# Expoの開発サーバー（Web版: http://localhost:19006, モバイル: exp://localhost:8081）を許可
# 本番環境では環境変数 ALLOWED_ORIGINS で許可するオリジンを設定する
allowed_origins = os.getenv(
    "ALLOWED_ORIGINS",
    "http://localhost:19006,http://localhost:8081,exp://localhost:8081"
).split(",")

# CORSミドルウェアを追加（フロントエンドからのリクエストを許可）
app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],  # すべてのHTTPメソッドを許可
    allow_headers=["*"],  # すべてのヘッダーを許可
)

# APIルーターを登録
# 各モジュールのルーターをアプリケーションに追加
app.include_router(problems.router)      # 問題関連API
app.include_router(submissions.router)   # 提出関連API
app.include_router(executions.router)    # 簡易実行関連API
app.include_router(drafts.router)        # ドラフト関連API

# 静的ファイルの配信（旧staticディレクトリ、バックアップ用）
# 現在はモバイルアプリを使用しているため、この機能は使用していない
static_dir = Path("static")
if static_dir.exists():
    app.mount("/static", StaticFiles(directory="static"), name="static")


@app.get("/")
async def root():
    """
    APIルートエンドポイント
    
    Returns:
        dict: APIの基本情報とドキュメントへのリンク
    """
    return {"message": "SE Training - Coding Test API", "docs": "/docs"}



