"""
メインアプリケーション
"""
from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from pathlib import Path
from app.api import problems, submissions

app = FastAPI(title="SE Training - Coding Test", version="0.1.0")

# APIルーターを登録
app.include_router(problems.router)
app.include_router(submissions.router)

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

