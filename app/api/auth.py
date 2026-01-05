"""
認証API

ユーザー登録、ログイン、トークン認証などの認証関連のエンドポイントを提供する。
"""
from datetime import datetime, timedelta
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.user import User, SubscriptionStatus
from app.schemas.user import UserCreate, UserResponse, Token
from app.auth import (
    get_password_hash,
    authenticate_user,
    create_access_token,
    get_current_user,
    ACCESS_TOKEN_EXPIRE_MINUTES,
)

router = APIRouter(prefix="/api/auth", tags=["auth"])


@router.post("/register", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
async def register(user_data: UserCreate, db: Session = Depends(get_db)):
    """
    ユーザー登録
    
    新しいユーザーアカウントを作成する。
    
    Args:
        user_data: ユーザー登録情報（ユーザー名、メールアドレス、パスワード）
        db: データベースセッション
        
    Returns:
        UserResponse: 作成されたユーザー情報
        
    Raises:
        HTTPException: ユーザー名またはメールアドレスが既に存在する場合（400）
    """
    # 既存のユーザー名をチェック
    existing_user = db.query(User).filter(User.username == user_data.username).first()
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Username already registered"
        )
    
    # 既存のメールアドレスをチェック
    existing_email = db.query(User).filter(User.email == user_data.email).first()
    if existing_email:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered"
        )
    
    # 新しいユーザーを作成
    hashed_password = get_password_hash(user_data.password)
    db_user = User(
        username=user_data.username,
        email=user_data.email,
        hashed_password=hashed_password,
        subscription_status=SubscriptionStatus.FREE,
    )
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    
    return db_user


@router.post("/login", response_model=Token)
async def login(
    form_data: OAuth2PasswordRequestForm = Depends(),
    db: Session = Depends(get_db)
):
    """
    ログイン
    
    ユーザー名とパスワードで認証し、JWTトークンを返す。
    
    Args:
        form_data: OAuth2パスワードリクエストフォーム（username, password）
        db: データベースセッション
        
    Returns:
        Token: JWTアクセストークンとトークンタイプ
        
    Raises:
        HTTPException: 認証に失敗した場合（401）
    """
    user = authenticate_user(db, form_data.username, form_data.password)
    if not user:
        # デバッグ用: ユーザーが見つからないか、パスワードが一致しない
        print(f"[DEBUG] Login failed for username: {form_data.username}")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": user.username}, expires_delta=access_token_expires
    )
    return {"access_token": access_token, "token_type": "bearer"}


@router.get("/me", response_model=UserResponse)
async def read_users_me(current_user: User = Depends(get_current_user)):
    """
    現在のユーザー情報を取得
    
    認証済みユーザーの情報を返す。
    
    Args:
        current_user: 現在のユーザー（認証必須）
        
    Returns:
        UserResponse: ユーザー情報
    """
    return current_user

