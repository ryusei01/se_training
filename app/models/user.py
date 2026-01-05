"""
ユーザーモデル

ユーザー情報、認証情報、課金状態を管理するデータモデル。
"""
from datetime import datetime
from enum import Enum
from sqlalchemy import Column, Integer, String, DateTime, Enum as SQLEnum
from sqlalchemy.orm import relationship
from app.database import Base


class SubscriptionStatus(str, Enum):
    """
    課金状態の列挙型
    
    Values:
        FREE: 無料範囲のみ利用可能
        TRIAL: トライアル期間中（7日間）
        PAID: 有料会員（全コース利用可能）
    """
    FREE = "free"
    TRIAL = "trial"
    PAID = "paid"


class User(Base):
    """
    ユーザーテーブル
    
    ユーザー情報、認証情報、課金状態を保持する。
    
    Attributes:
        id: ユーザーID（主キー）
        username: ユーザー名（一意）
        email: メールアドレス（一意）
        hashed_password: ハッシュ化されたパスワード
        subscription_status: 課金状態（free/trial/paid）
        trial_started_at: トライアル開始日時（trialの場合）
        trial_ends_at: トライアル終了日時（trialの場合）
        created_at: アカウント作成日時
        updated_at: 最終更新日時
    """
    __tablename__ = "users"
    
    id = Column(Integer, primary_key=True, index=True)
    username = Column(String(50), unique=True, index=True, nullable=False)
    email = Column(String(255), unique=True, index=True, nullable=False)
    hashed_password = Column(String(255), nullable=False)
    subscription_status = Column(
        SQLEnum(SubscriptionStatus),
        default=SubscriptionStatus.FREE,
        nullable=False
    )
    trial_started_at = Column(DateTime, nullable=True)
    trial_ends_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
    
    # リレーションシップ
    progress_records = relationship("ProgressRecord", back_populates="user", cascade="all, delete-orphan")
    subscription_history = relationship("SubscriptionHistory", back_populates="user", cascade="all, delete-orphan")


