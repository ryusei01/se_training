"""
メインアプリケーション
"""
import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from pathlib import Path
from app.api import problems, submissions, executions, drafts

app = FastAPI(title="SE Training - Coding Test", version="0.1.0")

# CORS設定
# Expoの開発サーバー（Web版: http://localhost:19006, モバイル: exp://localhost:8081）を許可
allowed_origins = os.getenv(
    "ALLOWED_ORIGINS",
    "http://localhost:19006,http://localhost:8081,exp://localhost:8081"
).split(",")

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# APIルーターを登録
app.include_router(problems.router)
app.include_router(submissions.router)
app.include_router(executions.router)
app.include_router(drafts.router)

# 静的ファイルの配信（旧staticディレクトリ、バックアップ用）
static_dir = Path("static")
if static_dir.exists():
    app.mount("/static", StaticFiles(directory="static"), name="static")


@app.get("/")
async def root():
    """APIルート"""
    return {"message": "SE Training - Coding Test API", "docs": "/docs"}



