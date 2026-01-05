"""
ユーザー関連のPydanticスキーマ

APIリクエストとレスポンスのデータモデルを定義する。
"""
from datetime import datetime
from typing import Optional
from pydantic import BaseModel, EmailStr
from app.models.user import SubscriptionStatus


class UserBase(BaseModel):
    """
    ユーザーの基本情報
    
    Attributes:
        username: ユーザー名
        email: メールアドレス
    """
    username: str
    email: EmailStr


class UserCreate(UserBase):
    """
    ユーザー作成リクエスト
    
    Attributes:
        password: パスワード（平文）
    """
    password: str


class UserResponse(UserBase):
    """
    ユーザー情報レスポンス
    
    Attributes:
        id: ユーザーID
        subscription_status: 課金状態
        trial_started_at: トライアル開始日時
        trial_ends_at: トライアル終了日時
        created_at: アカウント作成日時
    """
    id: int
    subscription_status: SubscriptionStatus
    trial_started_at: Optional[datetime] = None
    trial_ends_at: Optional[datetime] = None
    created_at: datetime
    
    class Config:
        from_attributes = True


class Token(BaseModel):
    """
    認証トークン
    
    Attributes:
        access_token: JWTアクセストークン
        token_type: トークンタイプ（通常は"bearer"）
    """
    access_token: str
    token_type: str


class TokenData(BaseModel):
    """
    トークン内のデータ
    
    Attributes:
        username: ユーザー名（オプション）
    """
    username: Optional[str] = None


