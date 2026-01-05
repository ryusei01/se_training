"""
文書決裁デモ（申請）スキーマ
"""

from datetime import datetime
from typing import Optional

from pydantic import BaseModel

from app.models.request import RequestStatus


class RequestBase(BaseModel):
    title: str
    body: Optional[str] = None


class RequestCreate(RequestBase):
    pass


class RequestResponse(RequestBase):
    id: int
    status: RequestStatus
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True



