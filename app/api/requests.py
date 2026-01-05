"""
文書決裁デモ（申請）API

docs/追加要件.md の「8. システム開発演習：文書決裁デモ要件（MVP）」に対応。
Phase1: 一覧/詳細（GET のみ）
"""

from typing import List

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.request import Request
from app.schemas.request import RequestResponse

router = APIRouter(prefix="/api/requests", tags=["requests"])


@router.get("/", response_model=List[RequestResponse])
async def list_requests(db: Session = Depends(get_db)):
    requests = db.query(Request).order_by(Request.id.desc()).all()
    return requests


@router.get("/{request_id}", response_model=RequestResponse)
async def get_request(request_id: int, db: Session = Depends(get_db)):
    req = db.query(Request).filter(Request.id == request_id).first()
    if not req:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Request not found")
    return req



