"""
文書決裁デモ（申請）モデル

docs/追加要件.md の「システム開発演習：文書決裁デモ要件（MVP）」に対応する。
Phase1では一覧/詳細（GET）のみを提供する前提で、最低限の属性を持つ。
"""

from datetime import datetime
from enum import Enum

from sqlalchemy import Column, DateTime, Enum as SQLEnum, Integer, String, Text

from app.database import Base


class RequestStatus(str, Enum):
    """
    申請ステータス
    """

    DRAFT = "draft"
    SUBMITTED = "submitted"
    APPROVED = "approved"
    RETURNED = "returned"
    REJECTED = "rejected"


class Request(Base):
    """
    申請テーブル
    """

    __tablename__ = "requests"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(255), nullable=False, index=True)
    body = Column(Text, nullable=True)
    status = Column(SQLEnum(RequestStatus), default=RequestStatus.DRAFT, nullable=False, index=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)




