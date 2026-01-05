"""
認証関連のユーティリティ

パスワードのハッシュ化、JWTトークンの生成・検証を行う。
"""
from datetime import datetime, timedelta
from typing import Optional
from jose import JWTError, jwt
import bcrypt
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.user import User
from app.schemas.user import TokenData

# OAuth2パスワードベアラートークン
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="api/auth/login", auto_error=False)

# JWT設定
SECRET_KEY = "your-secret-key-change-in-production"  # 本番環境では環境変数から取得すべき
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 30 * 24 * 60  # 30日間


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """
    平文パスワードとハッシュ化されたパスワードを検証する
    
    Args:
        plain_password: 平文パスワード
        hashed_password: ハッシュ化されたパスワード
        
    Returns:
        bool: パスワードが一致する場合True
    """
    return bcrypt.checkpw(
        plain_password.encode('utf-8'),
        hashed_password.encode('utf-8')
    )


def get_password_hash(password: str) -> str:
    """
    パスワードをハッシュ化する
    
    Args:
        password: 平文パスワード
        
    Returns:
        str: ハッシュ化されたパスワード
    """
    salt = bcrypt.gensalt()
    hashed = bcrypt.hashpw(password.encode('utf-8'), salt)
    return hashed.decode('utf-8')


def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    """
    JWTアクセストークンを生成する
    
    Args:
        data: トークンに含めるデータ
        expires_delta: 有効期限（指定しない場合はデフォルト値を使用）
        
    Returns:
        str: JWTトークン
    """
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt


def authenticate_user(db: Session, username: str, password: str) -> Optional[User]:
    """
    ユーザーを認証する
    
    Args:
        db: データベースセッション
        username: ユーザー名
        password: パスワード
        
    Returns:
        Optional[User]: 認証成功した場合Userオブジェクト、失敗した場合None
    """
    user = db.query(User).filter(User.username == username).first()
    if not user:
        print(f"[DEBUG] User not found: {username}")
        return None
    if not verify_password(password, user.hashed_password):
        print(f"[DEBUG] Password verification failed for user: {username}")
        return None
    print(f"[DEBUG] Authentication successful for user: {username}")
    return user


def get_current_user(
    token: str = Depends(oauth2_scheme),
    db: Session = Depends(get_db)
) -> User:
    """
    現在のユーザーを取得する（認証必須）
    
    FastAPIの依存関係として使用する。
    JWTトークンからユーザー情報を取得し、データベースからユーザーを取得する。
    
    Args:
        token: JWTトークン
        db: データベースセッション
        
    Returns:
        User: 現在のユーザー
        
    Raises:
        HTTPException: 認証に失敗した場合（401）
    """
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        username: str = payload.get("sub")
        if username is None:
            raise credentials_exception
        token_data = TokenData(username=username)
    except JWTError:
        raise credentials_exception
    user = db.query(User).filter(User.username == token_data.username).first()
    if user is None:
        raise credentials_exception
    return user


def get_current_active_user(
    current_user: User = Depends(get_current_user)
) -> User:
    """
    現在のアクティブなユーザーを取得する
    
    Args:
        current_user: 現在のユーザー（get_current_userから取得）
        
    Returns:
        User: アクティブなユーザー
    """
    # 将来的にis_activeフラグを追加する場合に使用
    return current_user


def get_current_user_optional(
    token: Optional[str] = Depends(oauth2_scheme),
    db: Session = Depends(get_db)
) -> Optional[User]:
    """
    現在のユーザーを取得する（認証オプショナル）
    
    認証トークンが提供されている場合はユーザーを返し、
    提供されていない場合はNoneを返す。
    
    Args:
        token: JWTトークン（オプション、oauth2_schemeから取得）
        db: データベースセッション
        
    Returns:
        Optional[User]: 認証済みユーザー、またはNone
    """
    if not token:
        return None
    
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        username: str = payload.get("sub")
        if username is None:
            return None
        token_data = TokenData(username=username)
    except JWTError:
        return None
    
    user = db.query(User).filter(User.username == token_data.username).first()
    return user
