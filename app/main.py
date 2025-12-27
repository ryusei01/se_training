"""
メインアプリケーション
"""
import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from pathlib import Path
from app.api import problems, submissions, executions, drafts

app = FastAPI(title="SE Training - Coding Test", version="0.1.0")

# CORS設定
# 本番環境では、許可するオリジンを環境変数から取得
allowed_origins = os.getenv(
    "ALLOWED_ORIGINS",
    "http://localhost:3000,http://localhost:8081,exp://localhost:8081"
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

# 静的ファイルの配信
static_dir = Path("static")
if static_dir.exists():
    app.mount("/static", StaticFiles(directory="static"), name="static")


@app.get("/")
async def root():
    """トップページ"""
    index_file = Path("static/index.html")
    if index_file.exists():
        return FileResponse(index_file)
    return {"message": "SE Training - Coding Test API"}



